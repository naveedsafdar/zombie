import { CONFIG } from '../config.js';
import { textStyle } from './TitleScene.js';

// Overlay shown on top of the paused game.
export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  create(data) {
    const { width, height } = CONFIG;
    const bg = this.add.rectangle(0, 0, width, height, 0x200000, 0).setOrigin(0);
    this.tweens.add({ targets: bg, fillAlpha: 0.7, duration: 600 });

    this.add
      .text(width / 2, 140, 'YOU DIED', {
        fontFamily: 'Impact, "Arial Black", sans-serif',
        fontSize: '80px',
        color: '#ff3b30',
        stroke: '#000000',
        strokeThickness: 10,
      })
      .setOrigin(0.5);

    const seconds = Math.floor(data.timeMs / 1000);
    const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    this.add.text(width / 2, 235, `Kills: ${data.kills}`, textStyle(36, '#e8e2c8')).setOrigin(0.5);
    this.add
      .text(width / 2, 276, `Survived ${time}  ·  Headshots ${data.headshotPct}%`, textStyle(20, '#b8bcd0'))
      .setOrigin(0.5);
    this.add
      .text(width / 2, 304, `Gun: ${data.gun}  ·  Zombie level ${data.zombieLevel}`, textStyle(18, '#b8bcd0'))
      .setOrigin(0.5);
    this.add
      .text(
        width / 2,
        340,
        data.newBest ? 'NEW BEST!' : `Best: ${data.best} kills`,
        textStyle(22, data.newBest ? '#ffd76a' : '#b8bcd0'),
      )
      .setOrigin(0.5);

    const button = this.add
      .rectangle(width / 2, 420, 260, 64, 0x6a2f2f)
      .setStrokeStyle(3, 0x000000)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, 420, 'Play again', textStyle(28, '#ffffff')).setOrigin(0.5);

    const restart = () => this.scene.start('Game');
    // Short delay so a frantic click from the last moment doesn't skip the screen.
    this.time.delayedCall(500, () => {
      button.on('pointerdown', restart);
      this.input.keyboard.once('keydown-SPACE', restart);
      this.input.keyboard.once('keydown-ENTER', restart);
    });
  }
}
