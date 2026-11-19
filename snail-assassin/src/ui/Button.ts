import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { TEXT_STYLES } from './text';

/** Large, touch-friendly button (rectangle + label), dark-theme. */
export class Button {
  readonly bg: Phaser.GameObjects.Rectangle;
  readonly label: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    onClick: () => void,
    accent = 0x5fd3c6,
  ) {
    this.bg = scene.add
      .rectangle(x, y, w, h, 0x06192b, 0.85)
      .setStrokeStyle(2, accent)
      .setDepth(200)
      .setInteractive({ useHandCursor: true });
    this.label = scene.add
      .text(x, y, text, { ...TEXT_STYLES.small, align: 'center', wordWrap: { width: w - 16 } })
      .setOrigin(0.5)
      .setDepth(201);
    this.bg.on('pointerover', () => this.bg.setFillStyle(accent, 0.25));
    this.bg.on('pointerout', () => this.bg.setFillStyle(0x06192b, 0.85));
    this.bg.on('pointerup', () => {
      sound.unlock();
      sound.play('select');
      onClick();
    });
  }

  setVisible(v: boolean): this {
    this.bg.setVisible(v);
    this.label.setVisible(v);
    return this;
  }

  destroy(): void {
    this.bg.destroy();
    this.label.destroy();
  }
}
