// Visual effects: banners, the gun upgrade card, shockwave, door bursts, explosions.
// Everything here uses tweens (which keep normal speed during slow-motion).
import { CONFIG } from './config.js';
import { textStyle } from './scenes/TitleScene.js';

const UI_DEPTH = 9700;

export function showBanner(scene, text, color = '#ffd76a', y = 150, size = 44) {
  const t = scene.add
    .text(CONFIG.width / 2, y, text, {
      ...textStyle(size, color),
      fontFamily: 'Impact, "Arial Black", sans-serif',
      strokeThickness: 8,
    })
    .setOrigin(0.5)
    .setDepth(UI_DEPTH + 2)
    .setScale(2.2)
    .setAlpha(0);
  scene.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' });
  scene.tweens.add({
    targets: t,
    alpha: 0,
    y: y - 20,
    delay: 1700,
    duration: 400,
    onComplete: () => t.destroy(),
  });
  return t;
}

export function floatText(scene, x, y, text, color) {
  const t = scene.add.text(x, y, text, textStyle(30, color)).setOrigin(0.5).setDepth(UI_DEPTH + 3);
  scene.tweens.add({
    targets: t,
    y: y - 50,
    alpha: 0,
    duration: 1300,
    ease: 'Quad.easeOut',
    onComplete: () => t.destroy(),
  });
}

// Card that slides in from the right showing the new gun.
export function showGunCard(scene, gun) {
  const W = 340;
  const H = 210;
  const x = CONFIG.width - W / 2 - 24;
  const y = 300;
  const card = scene.add.container(CONFIG.width + W, y).setDepth(UI_DEPTH + 1);

  const bg = scene.add.graphics();
  bg.fillStyle(0x0c0f1c, 0.92).fillRoundedRect(-W / 2, -H / 2, W, H, 14);
  bg.lineStyle(3, 0xffd76a, 1).strokeRoundedRect(-W / 2, -H / 2, W, H, 14);
  bg.fillStyle(0x8a93ad, 1).fillRoundedRect(-W / 2 + 14, -H / 2 + 62, W - 28, 104, 10); // light panel so the dark gun reads
  card.add(bg);

  card.add(scene.add.text(-W / 2 + 18, -H / 2 + 12, 'NEW GUN', textStyle(14, '#ffd76a')));
  card.add(scene.add.text(-W / 2 + 18, -H / 2 + 32, gun.name, textStyle(gun.name.length > 18 ? 20 : 26, '#ffffff')));

  const img = scene.add.image(0, 12, gun.card);
  const scale = Math.min(290 / img.width, 100 / img.height);
  img.setScale(scale);
  card.add(img);

  card.add(scene.add.text(0, H / 2 - 22, gun.tagline, textStyle(15, '#b8e8a0')).setOrigin(0.5));

  scene.tweens.add({ targets: card, x, duration: 380, ease: 'Back.easeOut' });
  scene.tweens.add({
    targets: card,
    x: CONFIG.width + W,
    delay: 2600,
    duration: 320,
    ease: 'Quad.easeIn',
    onComplete: () => card.destroy(),
  });
}

export function shockwave(scene, x, y) {
  const g = scene.add.graphics().setDepth(4997);
  const state = { r: 10, a: 1 };
  scene.tweens.add({
    targets: state,
    r: 900,
    a: 0,
    duration: 800,
    ease: 'Cubic.easeOut',
    onUpdate: () => {
      g.clear();
      g.lineStyle(14 * state.a + 2, 0xffd76a, state.a);
      g.strokeCircle(x, y, state.r);
      g.lineStyle(4, 0xffffff, state.a * 0.8);
      g.strokeCircle(x, y, state.r * 0.85);
    },
    onComplete: () => g.destroy(),
  });
}

// A broken house door flies open and dust puffs out.
export function doorBurst(scene, door, dustEmitter) {
  const s = door.s;
  const glow = scene.add
    .rectangle(door.sx, door.sy, 12 * s, 22 * s, 0xff3b30, 0.5)
    .setOrigin(0.5, 1)
    .setDepth(door.sy - 1);
  scene.tweens.add({ targets: glow, alpha: 0, duration: 500, onComplete: () => glow.destroy() });

  const plank = scene.add
    .rectangle(door.sx - 6 * s, door.sy, 12 * s, 20 * s, 0x4a3624)
    .setOrigin(0, 1)
    .setStrokeStyle(Math.max(1, s * 1.5), 0x0b0d16)
    .setDepth(door.sy + 1);
  const dir = door.x < 0 ? 1 : -1;
  scene.tweens.add({
    targets: plank,
    angle: 100 * dir,
    x: plank.x + 18 * s * dir,
    y: plank.y + 6 * s,
    alpha: 0,
    duration: 600,
    ease: 'Quad.easeOut',
    onComplete: () => plank.destroy(),
  });
  dustEmitter.explode(Math.round(6 + s * 4), door.sx, door.sy - 6 * s);
}

export function explosionFx(scene, x, y, radius) {
  const g = scene.add.graphics().setDepth(4996);
  const state = { r: radius * 0.2, a: 1 };
  scene.tweens.add({
    targets: state,
    r: radius,
    a: 0,
    duration: 320,
    ease: 'Quad.easeOut',
    onUpdate: () => {
      g.clear();
      g.fillStyle(0xff7a1a, state.a * 0.7).fillCircle(x, y, state.r);
      g.fillStyle(0xffe14d, state.a).fillCircle(x, y, state.r * 0.5);
    },
    onComplete: () => g.destroy(),
  });
}
