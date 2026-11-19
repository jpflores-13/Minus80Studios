import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { TEXT_STYLES } from './text';

/** A simple, large, touch-friendly button (rectangle + label). */
export class Button {
  readonly bg: Phaser.GameObjects.Rectangle;
  readonly label: Phaser.GameObjects.Text;
  private enabled = true;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    onClick: () => void,
    color: number = PALETTE.accent,
  ) {
    this.bg = scene.add.rectangle(x, y, w, h, color).setDepth(50).setStrokeStyle(2, PALETTE.ink);
    this.label = scene.add
      .text(x, y, text, { ...TEXT_STYLES.label, fontSize: '17px', align: 'center' })
      .setOrigin(0.5)
      .setDepth(51);
    this.bg.setInteractive({ useHandCursor: true });
    this.bg.on('pointerup', () => this.enabled && onClick());
    this.bg.on('pointerover', () => this.enabled && this.bg.setAlpha(0.85));
    this.bg.on('pointerout', () => this.bg.setAlpha(this.enabled ? 1 : 0.4));
  }

  setText(text: string): this {
    this.label.setText(text);
    return this;
  }

  setEnabled(enabled: boolean): this {
    this.enabled = enabled;
    this.bg.setAlpha(enabled ? 1 : 0.4);
    this.label.setAlpha(enabled ? 1 : 0.6);
    return this;
  }

  setVisible(visible: boolean): this {
    this.bg.setVisible(visible);
    this.label.setVisible(visible);
    return this;
  }

  destroy(): void {
    this.bg.destroy();
    this.label.destroy();
  }
}
