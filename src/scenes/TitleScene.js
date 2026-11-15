import { CONFIG } from '../config.js';
import { loadBest } from '../storage.js';
import { unlockAudio } from '../sfx.js';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    const { width, height } = CONFIG;
    this.add.image(0, 0, 'bg').setOrigin(0);
    this.add.rectangle(0, 0, width, height, 0x000000, 0.55).setOrigin(0);

    this.add
      .text(width / 2, 150, 'ZOMBIE ROAD', {
        fontFamily: 'Impact, "Arial Black", sans-serif',
        fontSize: '84px',
        color: '#e8e2c8',
        stroke: '#5a0c0c',
        strokeThickness: 10,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 222, 'One road. Endless zombies.', textStyle(22, '#b8bcd0'))
      .setOrigin(0.5);

    const prompt = this.add
      .text(width / 2, 320, 'Click or tap to play', textStyle(30, '#ffd76a'))
      .setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

    const best = loadBest();
    if (best > 0) {
      this.add.text(width / 2, 372, `Best: ${best} kills`, textStyle(22, '#e8e2c8')).setOrigin(0.5);
    }

    const touch = this.sys.game.device.input.touch;
    const help = touch
      ? 'Arrows to move  ·  tap a zombie to shoot  ·  reload is automatic'
      : 'A / D or ← / → to move  ·  click to shoot  ·  R to reload';
    this.add.text(width / 2, 470, help, textStyle(18, '#8a90a8')).setOrigin(0.5);

    const start = () => {
      unlockAudio();
      this.scene.start('Game');
    };
    this.input.once('pointerdown', start);
    this.input.keyboard.once('keydown-SPACE', start);
    this.input.keyboard.once('keydown-ENTER', start);
  }
}

export function textStyle(size, color) {
  return {
    fontFamily: '"Arial Black", Arial, sans-serif',
    fontSize: `${size}px`,
    color,
    stroke: '#000000',
    strokeThickness: Math.max(3, Math.round(size / 6)),
  };
}
