import { CONFIG } from '../config.js';
import { gunForLevel } from '../guns.js';
import { project, playerScreenX } from '../perspective.js';
import { loadBest, saveBest } from '../storage.js';
import { textStyle } from './TitleScene.js';
import * as fx from '../effects.js';
import * as sfx from '../sfx.js';

const ZOMBIE_TEX_HEIGHT = 270;
const HEAD_FRACTION = 0.33; // head occupies the top part of zombie.svg
// survivor-back.svg: viewBox 146..294 x 50..200. Hands are at (262, 84).
const SURVIVOR_VIEW_H = 150;
const HANDS_FX = (262 - 146) / 148;
const HANDS_FY = (84 - 50) / 150;
// Survivor is drawn left of his screen x so the centre of the road stays visible.
const SURVIVOR_ORIGIN_X = 0.62;


export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    const { width, height } = CONFIG;
    this.isOver = false;
    this.kills = 0;
    this.shots = 0;
    this.headshots = 0;
    this.elapsed = 0;
    this.zombies = [];
    this.player = { x: 0, health: CONFIG.player.maxHealth };
    this.move = { left: false, right: false };
    this.trigger = null; // pointer holding the trigger (automatic guns)
    this.triggerHeldMs = 0;
    this.spawnAcc = CONFIG.spawn.intervalMs * 0.6;

    this.zombieLevel = 0;
    this.zStats = zombieStatsForLevel(0);

    this.add.image(0, 0, 'bg').setOrigin(0).setDepth(-1000);
    this.createStreetLight();

    const ph = CONFIG.player.displayHeight;
    this.survivor = this.add
      .image(playerScreenX(0), height + 6, 'survivor')
      .setOrigin(SURVIVOR_ORIGIN_X, 1)
      .setDisplaySize((ph * 296) / 300, ph)
      .setDepth(5000);
    this.gunSprite = this.add.image(0, 0, 'gun-pistol').setOrigin(0.5, 1).setDepth(5001);

    this.muzzleFlash = this.add.image(0, 0, 'flash').setDepth(5002).setVisible(false);
    this.tracer = this.add.graphics().setDepth(4999);

    this.blood = this.add.particles(0, 0, 'blood', {
      speed: { min: 60, max: 220 },
      angle: { min: 200, max: 340 },
      gravityY: 600,
      lifespan: 500,
      scale: { start: 1, end: 0.2 },
      emitting: false,
    }).setDepth(4998);
    this.dust = this.add.particles(0, 0, 'dust', {
      speed: { min: 20, max: 90 },
      angle: { min: 180, max: 360 },
      lifespan: 700,
      alpha: { start: 0.6, end: 0 },
      scale: { start: 0.6, end: 2 },
      emitting: false,
    }).setDepth(3000);
    this.sparks = this.add.particles(0, 0, 'spark', {
      speed: { min: 150, max: 480 },
      lifespan: 700,
      scale: { start: 1.2, end: 0 },
      tint: [0xffd76a, 0xffffff, 0xffa23a],
      blendMode: 'ADD',
      emitting: false,
    }).setDepth(5003);
    this.flames = this.add.particles(0, 0, 'spark', {
      speedY: { min: -90, max: -40 },
      speedX: { min: -15, max: 15 },
      lifespan: 400,
      scale: { start: 0.9, end: 0 },
      tint: [0xff7a1a, 0xffd23f, 0xff3b1a],
      blendMode: 'ADD',
      emitting: false,
    }).setDepth(4995);

    this.hurtOverlay = this.add.rectangle(0, 0, width, height, 0xff0000, 0).setOrigin(0).setDepth(9000);

    this.createHud();
    this.createInput();
    this.setGun(0);

    // A couple of zombies right away so the road isn't empty.
    this.spawnZombie('road', CONFIG.zFar * 0.6);
    this.spawnZombie('road');
  }

  // ---------- setup ----------

  createStreetLight() {
    const g = this.add.graphics().setDepth(-900);
    g.fillStyle(0xffe9a0, 0.13);
    g.fillTriangle(151, 288, 40, 530, 270, 530);
    g.fillStyle(0xffe9a0, 0.1);
    g.fillEllipse(155, 525, 260, 40);
    const flicker = () => {
      if (!g.active) return;
      g.setAlpha(Math.random() < 0.3 ? 0.15 : 1);
      this.time.delayedCall(Phaser.Math.Between(60, 1400), flicker);
    };
    flicker();
  }

  createHud() {
    const { width, height } = CONFIG;
    const D = 9500;
    this.add.text(20, 14, 'HEALTH', textStyle(15, '#e8e2c8')).setDepth(D);
    this.add.rectangle(20, 36, 224, 20, 0x000000).setOrigin(0).setDepth(D);
    this.healthBar = this.add.rectangle(22, 38, 220, 16, 0xd83a3a).setOrigin(0).setDepth(D + 1);

    this.add.text(20, 62, 'NEXT GUN', textStyle(13, '#ffd76a')).setDepth(D);
    this.add.rectangle(20, 82, 224, 12, 0x000000).setOrigin(0).setDepth(D);
    this.nextGunBar = this.add.rectangle(22, 84, 0, 8, 0xffd76a).setOrigin(0).setDepth(D + 1);
    this.nextGunText = this.add.text(250, 78, '', textStyle(13, '#ffd76a')).setDepth(D);

    this.killText = this.add.text(width - 20, 14, 'KILLS 0', textStyle(30, '#e8e2c8')).setOrigin(1, 0).setDepth(D);
    this.levelText = this.add
      .text(width - 20, 54, 'ZOMBIE LV 0', textStyle(15, '#ff6a5a'))
      .setOrigin(1, 0)
      .setDepth(D);

    this.ammoText = this.add.text(width - 20, height - 16, '', textStyle(24, '#ffd76a')).setOrigin(1, 1).setDepth(D);

    this.popup = this.add.text(width / 2, 230, '', textStyle(30, '#ffd76a')).setOrigin(0.5).setDepth(D).setAlpha(0);
  }

  createInput() {
    this.keys = this.input.keyboard.addKeys('A,D,LEFT,RIGHT,R');
    this.keys.R.on('down', () => this.startReload());

    this.isTouch = this.sys.game.device.input.touch;
    this.crosshair = this.add.image(CONFIG.width / 2, CONFIG.height / 2, 'crosshair').setDepth(9800);
    if (this.isTouch) {
      this.crosshair.setVisible(false);
      this.createTouchButtons();
    } else {
      this.input.setDefaultCursor('none');
    }

    this.input.on('pointerdown', (pointer, over) => {
      if (over.length > 0) return; // touched a UI button
      this.trigger = pointer;
      this.triggerHeldMs = 0;
      this.shoot(pointer.x, pointer.y);
    });
    const release = (pointer) => {
      if (this.trigger === pointer) this.trigger = null;
      if (this.move.left === pointer.id) this.move.left = false;
      if (this.move.right === pointer.id) this.move.right = false;
    };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);

    this.events.once('shutdown', () => this.input.setDefaultCursor('default'));
  }

  createTouchButtons() {
    const make = (x, label, dir) => {
      const btn = this.add
        .circle(x, CONFIG.height - 70, 44, 0x000000, 0.45)
        .setStrokeStyle(3, 0xe8e2c8, 0.6)
        .setDepth(9600)
        .setInteractive();
      this.add.text(x, CONFIG.height - 70, label, textStyle(34, '#e8e2c8')).setOrigin(0.5).setDepth(9601);
      btn.on('pointerdown', (pointer) => {
        this.move[dir] = pointer.id;
      });
    };
    make(70, '◀', 'left');
    make(180, '▶', 'right');
  }

  // ---------- guns ----------

  setGun(level) {
    const def = gunForLevel(level);
    this.gunLevel = level;
    this.gun = { ...def, ammo: def.magSize, reloading: false, lastShot: -9999 };
    this.gunSprite.setTexture(def.sprite);
    this.gunScale = this.survivor.displayHeight / SURVIVOR_VIEW_H / 3; // gun SVGs are loaded at 3x
    this.gunSprite.setScale(this.gunScale);
    this.updateAmmoText();
    this.updateNextGunBar();
  }

  upgradeGun() {
    const prog = CONFIG.progression;
    this.setGun(this.gunLevel + 1);

    // Pop the new gun into his hands
    this.gunSprite.setScale(0);
    this.tweens.add({ targets: this.gunSprite, scale: this.gunScale, duration: 450, ease: 'Back.easeOut' });

    // Heal
    const p = this.player;
    p.health = Math.min(CONFIG.player.maxHealth, p.health + prog.healOnUpgrade);
    this.healthBar.width = 220 * (p.health / CONFIG.player.maxHealth);
    fx.floatText(this, 140, 40, `+${prog.healOnUpgrade} HP`, '#7dff7a');

    // Small, non-blocking notice: sparks at the gun and a compact toast by the ammo counter.
    const m = this.muzzlePosition();
    this.sparks.explode(25, m.x, m.y + 20);
    fx.showGunToast(this, this.gun);
    sfx.playUpgrade();
  }

  muzzlePosition() {
    return { x: this.gunSprite.x, y: this.gunSprite.y - this.gunSprite.displayHeight };
  }

  placeGun() {
    const s = this.survivor;
    this.gunSprite.x = s.x + (HANDS_FX - SURVIVOR_ORIGIN_X) * s.displayWidth;
    this.gunSprite.y = s.y - s.displayHeight * (1 - HANDS_FY);
    this.gunSprite.angle = s.angle;
  }

  currentCooldown() {
    const gun = this.gun;
    if (!gun.spinUpMs) return gun.fireCooldownMs;
    const spin = Math.min(1, this.triggerHeldMs / gun.spinUpMs);
    return Phaser.Math.Linear(gun.fireCooldownMs * 4, gun.fireCooldownMs, spin);
  }

  shoot(px, py) {
    if (this.isOver) return;
    const now = this.time.now;
    const gun = this.gun;
    if (gun.reloading || now - gun.lastShot < this.currentCooldown()) return;
    if (gun.ammo <= 0) {
      sfx.playEmpty();
      this.startReload();
      return;
    }
    gun.ammo--;
    gun.lastShot = now;
    this.shots++;
    this.updateAmmoText();
    sfx.playShot();

    const m = this.muzzlePosition();
    this.muzzleFlash
      .setPosition(m.x, m.y - 6)
      .setVisible(true)
      .setAngle(Math.random() * 45)
      .setScale(gun.pellets ? 1.3 : gun.spinUpMs ? 1.1 : 0.9);
    this.time.delayedCall(40, () => this.muzzleFlash.setVisible(false));
    if (!this.tweens.isTweening(this.survivor)) {
      this.tweens.add({ targets: this.survivor, y: CONFIG.height + (gun.pellets ? 22 : 12), duration: 50, yoyo: true });
    }
    this.cameras.main.shake(50, gun.pellets ? 0.006 : 0.002);

    if (this.isTouch) {
      this.crosshair.setPosition(px, py).setVisible(true).setAlpha(1);
      this.tweens.add({ targets: this.crosshair, alpha: 0, duration: 300 });
    }

    // Collect hits from every pellet / piercing bullet.
    const aims = [];
    const pellets = gun.pellets || 1;
    for (let i = 0; i < pellets; i++) {
      if (pellets === 1) aims.push({ x: px, y: py });
      else {
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * gun.spread;
        aims.push({ x: px + Math.cos(a) * r, y: py + Math.sin(a) * r * 0.7 });
      }
    }

    this.tracer.clear().lineStyle(gun.pierce ? 3 : 2, gun.tracer, 0.95);
    const hits = new Map();
    for (const aim of aims) {
      this.tracer.lineBetween(m.x, m.y, aim.x, aim.y);
      for (const hit of this.zombiesAt(aim.x, aim.y, gun.pierce || 1)) {
        const prev = hits.get(hit.zombie) || { damage: 0, headshot: false, x: aim.x, y: aim.y };
        prev.damage += gun.damage * (hit.headshot ? CONFIG.zombies.headshotMultiplier : 1);
        prev.headshot = prev.headshot || hit.headshot;
        hits.set(hit.zombie, prev);
      }
    }
    this.tracer.setAlpha(1);
    this.tweens.add({ targets: this.tracer, alpha: 0, duration: 90 });

    let firstHit = null;
    for (const [z, h] of hits) {
      if (!firstHit) firstHit = { z, ...h };
      if (gun.burn) {
        z.burnUntil = now + gun.burnMs;
        z.burnDps = gun.burn;
      }
      if (gun.knockback) z.z += gun.knockback;
      this.damageZombie(z, h.damage, h);
    }
    // `gun` is the gun that fired: a kill above may already have upgraded this.gun.
    if (firstHit && gun.explode) this.explode(firstHit.x, firstHit.y, firstHit.z, gun.explode);

    if (this.gun === gun && gun.ammo === 0) this.startReload();
  }

  explode(x, y, sourceZombie, blast) {
    const p = CONFIG.zNear / sourceZombie.z;
    const radius = blast.radius * Math.max(0.4, p);
    fx.explosionFx(this, x, y, radius);
    sfx.playExplosion();
    for (const z of this.zombies) {
      if (z.state === 'dead') continue;
      const s = z.sprite;
      const cy = s.y - s.displayHeight * 0.5;
      if (Phaser.Math.Distance.Between(x, y, s.x, cy) < radius + s.displayWidth * 0.2) {
        this.damageZombie(z, blast.damage, { x: s.x, y: cy, headshot: false, quiet: true });
      }
    }
  }

  startReload() {
    const gun = this.gun;
    if (this.isOver || gun.reloading || gun.ammo === gun.magSize) return;
    gun.reloading = true;
    this.updateAmmoText();
    sfx.playReload();
    const gunAtStart = gun;
    this.time.delayedCall(gun.reloadMs, () => {
      if (this.gun !== gunAtStart) return; // gun was upgraded meanwhile (comes full)
      gun.ammo = gun.magSize;
      gun.reloading = false;
      this.updateAmmoText();
    });
  }

  updateAmmoText() {
    const gun = this.gun;
    if (gun.reloading) {
      this.ammoText.setText(`${gun.name.toUpperCase()}  RELOADING…`).setColor('#ff8a5a');
    } else {
      const low = gun.ammo <= Math.max(2, gun.magSize * 0.2);
      this.ammoText.setText(`${gun.name.toUpperCase()}  ${gun.ammo} / ${gun.magSize}`).setColor(low ? '#ff8a5a' : '#ffd76a');
    }
  }

  updateNextGunBar() {
    const every = CONFIG.progression.gunUpgradeEvery;
    const into = this.kills % every;
    this.nextGunBar.width = 220 * (into / every);
    const left = every - into;
    this.nextGunText.setText(`${left} kill${left === 1 ? '' : 's'}`);
  }

  // ---------- zombies ----------

  pickSource() {
    const unlocked = CONFIG.spawnSources.filter((s) => s.unlockLevel <= this.zombieLevel);
    const total = unlocked.reduce((sum, s) => sum + s.weight, 0);
    let r = Math.random() * total;
    for (const s of unlocked) {
      r -= s.weight;
      if (r <= 0) return s.id;
    }
    return 'road';
  }

  spawnWave() {
    const st = this.zStats;
    const alive = this.zombies.filter((z) => z.state !== 'dead').length;
    if (alive >= st.maxAlive) return;
    const source = this.pickSource();
    const count = Math.random() < st.hordeChance ? Phaser.Math.Between(...CONFIG.spawn.hordeSize) : 1;
    const spot = this.pickSpot(source);
    for (let i = 0; i < Math.min(count, st.maxAlive - alive); i++) {
      this.time.delayedCall(i * 350, () => this.spawnZombie(source, undefined, spot));
    }
  }

  pickSpot(sourceId) {
    const src = CONFIG.spawnSources.find((s) => s.id === sourceId);
    if (src.doors) return Phaser.Utils.Array.GetRandom(src.doors);
    if (src.spots) return Phaser.Utils.Array.GetRandom(src.spots);
    return null;
  }

  spawnZombie(sourceId, atZ, spot) {
    if (this.isOver) return;
    const st = this.zStats;
    const type = CONFIG.zombies.walker;
    let z, x;
    let rise = 1;
    let fade = 1;
    spot = spot ?? this.pickSpot(sourceId);
    switch (sourceId) {
      case 'house':
      case 'nearHouse':
        z = spot.z;
        x = spot.x + Phaser.Math.FloatBetween(-0.05, 0.05);
        fade = 0;
        fx.doorBurst(this, spot, this.dust);
        sfx.playDoor();
        break;
      case 'car':
        z = spot.z + Phaser.Math.FloatBetween(-0.2, 0.2);
        x = spot.x;
        rise = 0;
        fade = 0;
        break;
      case 'roadside': {
        const side = Math.random() < 0.5 ? -1 : 1;
        z = Phaser.Math.FloatBetween(3.4, 4.6);
        x = side * 1.75;
        break;
      }
      default:
        z = atZ ?? CONFIG.zFar + Math.random() * 4;
        x = Phaser.Math.FloatBetween(-0.9, 0.9);
    }

    const zombie = {
      z,
      x,
      hp: st.health,
      speed: st.speed * Phaser.Math.FloatBetween(0.85, 1.15),
      type,
      state: 'walk',
      attackTimer: type.attackEveryMs * 0.5,
      phase: Math.random() * Math.PI * 2,
      flashUntil: 0,
      burnUntil: 0,
      rise,
      fade,
      sprite: this.add.image(0, 0, 'zombie').setOrigin(0.5, 0.978),
    };
    this.zombies.push(zombie);
    this.placeZombie(zombie, this.time.now);
  }

  placeZombie(z, time) {
    const { x, y, p } = project(z.z, z.x);
    const scale = (CONFIG.zombies.heightAtNear * p) / ZOMBIE_TEX_HEIGHT;
    const bob = z.state === 'walk' ? Math.abs(Math.sin(z.phase)) * -6 * p : 0;
    const riseOffset = (1 - z.rise) * 60 * p; // climbing up from behind a car
    z.sprite.setPosition(x, y + bob + riseOffset);
    z.sprite.setScale(scale);
    z.sprite.setDepth(y);
    z.sprite.setAngle(Math.sin(z.phase) * (z.state === 'attack' ? 8 : 4));
    z.sprite.setAlpha(z.fade);

    if (time < z.flashUntil) {
      z.sprite.setTintFill(0xffffff);
    } else if (time < z.burnUntil) {
      z.sprite.setTint(Math.random() < 0.5 ? 0xff9a4a : 0xffd27a);
    } else {
      // Zombies emerge from the dark: far away they are almost black.
      const b = Phaser.Math.Clamp(0.18 + p * 1.1, 0.18, 1);
      const c = Math.round(b * 255);
      z.sprite.setTint(Phaser.Display.Color.GetColor(c, c, Math.min(255, c + 20)));
    }
  }

  updateZombies(time, dt) {
    for (const z of this.zombies) {
      if (z.state === 'dead') continue;
      const t = z.type;
      z.fade = Math.min(1, z.fade + dt * 3);
      z.rise = Math.min(1, z.rise + dt * 1.5);

      if (time < z.burnUntil) {
        z.hp -= z.burnDps * dt;
        if (Math.random() < dt * 25) {
          const s = z.sprite;
          this.flames.emitParticleAt(s.x + Phaser.Math.Between(-10, 10) * s.scaleX * 3, s.y - s.displayHeight * Math.random() * 0.8);
        }
        if (z.hp <= 0) {
          this.killZombie(z, false);
          continue;
        }
      }

      const offRoad = Math.abs(z.x) > 0.95;
      if (z.z > CONFIG.zAttack) {
        z.state = 'walk';
        z.z = Math.max(CONFIG.zAttack, z.z - z.speed * dt);
        if (offRoad) {
          const dx = this.player.x - z.x;
          z.x += Math.sign(dx) * Math.min(Math.abs(dx), t.offRoadSpeed * dt);
        } else {
          z.x += (this.player.x - z.x) * Math.min(1, t.homing * dt);
        }
        z.phase += dt * 6 * (z.speed / t.speed);
      } else {
        z.state = 'attack';
        const dx = this.player.x - z.x;
        const follow = offRoad ? t.offRoadSpeed + t.homingClose * 0.5 : t.homingClose;
        z.x += Math.sign(dx) * Math.min(Math.abs(dx), follow * dt);
        z.phase += dt * 10;
        if (Math.abs(z.x - this.player.x) < t.attackReach) {
          z.attackTimer -= dt * 1000;
          if (z.attackTimer <= 0) {
            z.attackTimer = t.attackEveryMs;
            this.damagePlayer(t.damage);
            if (this.isOver) return;
          }
        }
      }
      this.placeZombie(z, time);
    }
  }

  // Zombies under the point, nearest first (up to `limit` for piercing rounds).
  zombiesAt(px, py, limit = 1) {
    const found = [];
    const candidates = this.zombies.filter((z) => z.state !== 'dead' && z.fade > 0.3).sort((a, b) => a.z - b.z);
    for (const z of candidates) {
      const s = z.sprite;
      const h = s.displayHeight;
      const top = s.y - h * 0.978;
      const halfW = s.displayWidth * 0.26; // body only, not the outstretched arms
      if (px >= s.x - halfW && px <= s.x + halfW && py >= top && py <= s.y) {
        found.push({ zombie: z, headshot: py < top + h * HEAD_FRACTION });
        if (found.length >= limit) break;
      }
    }
    return found;
  }

  damageZombie(z, damage, hit) {
    if (z.state === 'dead') return;
    z.hp -= damage;
    z.flashUntil = this.time.now + 60;
    this.blood.explode(hit.headshot ? 14 : 6, hit.x, hit.y);
    if (hit.headshot) {
      this.headshots++;
      sfx.playHeadshot();
    } else if (!hit.quiet) {
      sfx.playHit();
    }
    if (z.hp <= 0) {
      this.killZombie(z, hit.headshot);
    } else {
      // Hits only make them flinch: they keep coming.
      z.z += hit.headshot ? CONFIG.zombies.headshotStagger : CONFIG.zombies.flinch;
    }
  }

  killZombie(z, headshot) {
    if (z.state === 'dead') return;
    z.state = 'dead';
    this.kills++;
    this.killText.setText(`KILLS ${this.kills}`);
    if (headshot) this.showPopup('HEADSHOT!');
    const dir = Math.random() < 0.5 ? -1 : 1;
    this.tweens.add({
      targets: z.sprite,
      angle: 85 * dir,
      alpha: 0,
      y: z.sprite.y + 10,
      duration: 450,
      ease: 'Quad.easeIn',
      onComplete: () => {
        z.sprite.destroy();
        this.zombies = this.zombies.filter((other) => other !== z);
      },
    });

    const prog = CONFIG.progression;
    const gunUp = this.kills % prog.gunUpgradeEvery === 0;
    const zombieUp = this.kills % prog.zombieLevelUpEvery === 0;
    if (gunUp) this.upgradeGun();
    if (zombieUp) this.zombieLevelUp();
    this.updateNextGunBar();
  }

  zombieLevelUp() {
    if (this.isOver) return;
    this.zombieLevel++;
    this.zStats = zombieStatsForLevel(this.zombieLevel);
    // No on-screen message: only the HUD counter pulses and a growl plays.
    this.levelText.setText(`ZOMBIE LV ${this.zombieLevel}`).setScale(1.4);
    this.tweens.add({ targets: this.levelText, scale: 1, duration: 300, ease: 'Quad.easeOut' });
    sfx.playGrowl();
  }


  // ---------- player ----------

  damagePlayer(amount) {
    const p = this.player;
    p.health = Math.max(0, p.health - amount);
    this.healthBar.width = 220 * (p.health / CONFIG.player.maxHealth);
    sfx.playHurt();
    this.cameras.main.shake(140, 0.01);
    this.hurtOverlay.setFillStyle(0xff0000, 0.35);
    this.tweens.add({ targets: this.hurtOverlay, fillAlpha: 0, duration: 300 });
    if (p.health <= 0) this.gameOver();
  }

  showPopup(text) {
    this.popup.setText(text).setAlpha(1).setScale(1.3);
    this.tweens.killTweensOf(this.popup);
    this.tweens.add({ targets: this.popup, scale: 1, duration: 150 });
    this.tweens.add({ targets: this.popup, alpha: 0, delay: 500, duration: 300 });
  }

  gameOver() {
    this.isOver = true;
    const best = loadBest();
    const newBest = this.kills > best;
    if (newBest) saveBest(this.kills);
    this.input.setDefaultCursor('default');
    this.crosshair.setVisible(false);
    this.scene.launch('GameOver', {
      kills: this.kills,
      timeMs: this.elapsed,
      best: Math.max(best, this.kills),
      newBest,
      headshotPct: this.shots ? Math.round((this.headshots / this.shots) * 100) : 0,
      gun: this.gun.name,
      zombieLevel: this.zombieLevel,
    });
    this.scene.pause();
  }

  // ---------- loop ----------

  update(time, delta) {
    if (this.isOver) return;
    const speed = CONFIG.gameSpeed;
    this.time.timeScale = speed;
    this.tweens.timeScale = CONFIG.gameSpeed;
    const dt = (Math.min(delta, 50) / 1000) * speed;
    this.elapsed += dt * 1000;

    // Movement
    const left = this.keys.A.isDown || this.keys.LEFT.isDown || this.move.left !== false;
    const right = this.keys.D.isDown || this.keys.RIGHT.isDown || this.move.right !== false;
    const dir = (right ? 1 : 0) - (left ? 1 : 0);
    const pc = CONFIG.player;
    this.player.x = Phaser.Math.Clamp(this.player.x + dir * pc.moveSpeed * dt, pc.minX, pc.maxX);
    this.survivor.x = playerScreenX(this.player.x);
    this.survivor.setAngle(dir * 2);
    this.placeGun();

    if (!this.isTouch) {
      const ptr = this.input.activePointer;
      this.crosshair.setPosition(ptr.x, ptr.y);
    }

    // Automatic fire while the trigger is held
    if (this.trigger && this.trigger.isDown) {
      this.triggerHeldMs += dt * 1000;
      if (this.gun.auto) this.shoot(this.trigger.x, this.trigger.y);
    } else {
      this.trigger = null;
      this.triggerHeldMs = 0;
    }

    // Spawning
    this.spawnAcc += dt * 1000;
    if (this.spawnAcc >= this.zStats.intervalMs) {
      this.spawnAcc = 0;
      this.spawnWave();
    }

    // Zombie timers (flash, burn) use the scene clock.
    this.updateZombies(this.time.now, dt);
  }
}

function zombieStatsForLevel(level) {
  const w = CONFIG.zombies.walker;
  const L = CONFIG.zombieLevelUp;
  // Full-strength growth up to lateLevel, gentler growth after it,
  // so good players can keep going for a long time.
  const early = Math.min(level, L.lateLevel);
  const late = Math.max(0, level - L.lateLevel);
  return {
    health: w.health * Math.pow(L.healthMult, early) * Math.pow(L.lateHealthMult, late),
    speed: w.speed * Math.min(L.maxSpeedMult, Math.pow(L.speedMult, early) * Math.pow(L.lateSpeedMult, late)),
    intervalMs: Math.max(
      L.minIntervalMs,
      CONFIG.spawn.intervalMs * Math.pow(L.intervalMult, early) * Math.pow(L.lateIntervalMult, late),
    ),
    maxAlive: Math.min(L.maxAliveCap, CONFIG.spawn.maxAlive + L.maxAliveAdd * level),
    hordeChance: Math.min(0.7, CONFIG.spawn.hordeChance + L.hordeChanceAdd * level),
  };
}
