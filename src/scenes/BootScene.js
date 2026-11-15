import { CONFIG } from '../config.js';

// SVGs are loaded at 3x their viewBox size so they stay sharp when scaled up.
const GUN_SPRITES = {
  'gun-pistol': [40, 32],
  'gun-smg': [40, 48],
  'gun-shotgun': [40, 64],
  'gun-rifle': [40, 66],
  'gun-minigun': [56, 64],
};
const GUN_CARDS = {
  'card-pistol': [200, 130],
  'card-smg': [240, 120],
  'card-shotgun': [300, 100],
  'card-rifle': [300, 120],
  'card-minigun': [300, 120],
};

// Loads the SVG art and generates the small effect textures.
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.load.svg('bg', 'assets/background.svg', { width: CONFIG.width, height: CONFIG.height });
    this.load.svg('zombie', 'assets/zombie.svg', { width: 228, height: 270 });
    this.load.svg('survivor', 'assets/survivor-back.svg', { width: 296, height: 300 });
    for (const [key, [w, h]] of Object.entries(GUN_SPRITES)) {
      this.load.svg(key, `assets/guns/${key}.svg`, { width: w * 3, height: h * 3 });
    }
    for (const [key, [w, h]] of Object.entries(GUN_CARDS)) {
      this.load.svg(key, `assets/guns/${key}.svg`, { width: w * 2, height: h * 2 });
    }
  }

  create() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Blood droplet
    g.fillStyle(0x9b1010, 1).fillCircle(6, 6, 6);
    g.generateTexture('blood', 12, 12);
    g.clear();

    // Dust puff (doors bursting open)
    g.fillStyle(0x8a8478, 1).fillCircle(8, 8, 8);
    g.generateTexture('dust', 16, 16);
    g.clear();

    // Spark / flame particle
    g.fillStyle(0xffffff, 1).fillCircle(5, 5, 5);
    g.generateTexture('spark', 10, 10);
    g.clear();

    // Muzzle flash
    g.fillStyle(0xffd23f, 1);
    g.fillPoints(starPoints(32, 32, 30, 10, 8), true);
    g.fillStyle(0xfff6c8, 1).fillCircle(32, 32, 9);
    g.generateTexture('flash', 64, 64);
    g.clear();

    // Crosshair
    g.lineStyle(3, 0xff4d3d, 1).strokeCircle(20, 20, 12);
    g.lineBetween(20, 2, 20, 12).lineBetween(20, 28, 20, 38);
    g.lineBetween(2, 20, 12, 20).lineBetween(28, 20, 38, 20);
    g.fillStyle(0xff4d3d, 1).fillCircle(20, 20, 2);
    g.generateTexture('crosshair', 40, 40);
    g.destroy();

    this.scene.start('Title');
  }
}

function starPoints(cx, cy, outer, inner, spikes) {
  const pts = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    pts.push(new Phaser.Math.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
  }
  return pts;
}
