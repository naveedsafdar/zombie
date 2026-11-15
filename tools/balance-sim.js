// Balance simulator: plays the game with bot "players" of different skill and
// reports how many kills each gets before dying. Run from the browser console
// while the game is open:
//
//   const { BalanceSim } = await import('/tools/balance-sim.js');
//   const sim = new BalanceSim({ runs: 3 });
//   while (!sim.done) sim.advance(5000);   // work in 5 s bursts
//   console.table(sim.results);
//
// It drives the Phaser loop directly (no rendering) so it runs much faster than real time.
export const PROFILES = {
  bad: { reactMs: 750, head: 0.12, body: 0.48 }, // slow, mostly body shots, many misses
  avg: { reactMs: 420, head: 0.3, body: 0.52 },
  good: { reactMs: 260, head: 0.55, body: 0.4 },
};

export class BalanceSim {
  constructor({ runs = 3, profiles = PROFILES, maxMinutes = 12 } = {}) {
    this.game = window.zombieRoad;
    this.queue = [];
    for (let i = 0; i < runs; i++) for (const entry of Object.entries(profiles)) this.queue.push(entry);
    this.maxMinutes = maxMinutes;
    this.results = [];
    this.cur = null;
    this.t = performance.now();
    this.done = false;
  }

  // Simulate for up to `budgetMs` of real time, then return.
  advance(budgetMs = 5000) {
    const game = this.game;
    const realRender = game.scene.render;
    game.scene.render = () => {};
    try {
      const end = performance.now() + budgetMs;
      while (performance.now() < end) {
        if (!this.cur) {
          if (!this.queue.length) {
            this.done = true;
            break;
          }
          this.startRun(this.queue.shift());
        }
        this.tick();
      }
    } finally {
      game.scene.render = realRender;
    }
    return this.results;
  }

  startRun([name, prof]) {
    const sm = this.game.scene;
    sm.stop('GameOver');
    sm.stop('Title');
    sm.start('Game'); // restarts it if it is still running or paused
    this.cur = { name, prof, simMs: 0, nextReact: 0, aim: null, pending: true };
  }

  tick() {
    const cur = this.cur;
    this.t += 16.6;
    this.game.step(this.t, 16.6);
    const s = this.game.scene.getScene('Game');
    if (cur.pending) {
      if (s.sys.isPaused()) this.game.scene.resume('Game');
      if (s.sys.isActive() && !s.isOver && s.kills === 0 && s.elapsed < 100) cur.pending = false;
      return;
    }
    cur.simMs += 16.6;
    if (s.isOver || cur.simMs > this.maxMinutes * 60000) {
      this.results.push({
        player: cur.name,
        kills: s.kills,
        gun: s.gun.name,
        zombieLevel: s.zombieLevel,
        minutes: +(cur.simMs / 60000).toFixed(1),
        survived: !s.isOver,
      });
      this.cur = null;
      return;
    }
    const { prof } = cur;
    if (cur.simMs >= cur.nextReact) {
      cur.nextReact = cur.simMs + prof.reactMs * (0.7 + Math.random() * 0.6);
      const target = s.zombies
        .filter((z) => z.state !== 'dead' && z.fade > 0.3 && z.z < 14)
        .sort((a, b) => a.z - b.z)[0];
      if (target) {
        const r = Math.random();
        cur.aim = { zombie: target, kind: r < prof.head ? 'head' : r < prof.head + prof.body ? 'body' : 'miss' };
        if (!s.gun.auto) this.fire(s);
      } else cur.aim = null;
    } else if (s.gun.auto && cur.aim) this.fire(s);
  }

  fire(s) {
    const aim = this.cur.aim;
    const sp = aim.zombie.sprite;
    if (!sp.active) return;
    const h = sp.displayHeight;
    const y = aim.kind === 'head' ? sp.y - h * 0.82 : sp.y - h * 0.45;
    const x = aim.kind === 'miss' ? sp.x + sp.displayWidth * 0.6 : sp.x;
    s.shoot(x, y);
  }
}
