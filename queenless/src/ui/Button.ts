import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { TEXT_STYLES } from './text';

/** A chunky storybook button: rounded rectangle + label, big enough for thumbs. */
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
    private readonly onClick: () => void,
    color: number = PALETTE.accent,
  ) {
    this.bg = scene.add
      .rectangle(x, y, w, h, color)
      .setStrokeStyle(3, PALETTE.honey)
      .setDepth(50)
      .setScrollFactor(0);
    this.label = scene.add
      .text(x, y, text, { ...TEXT_STYLES.label, align: 'center' })
      .setOrigin(0.5)
      .setDepth(51)
      .setScrollFactor(0);
    this.bg.setInteractive({ useHandCursor: true });
    this.bg.on('pointerup', () => this.enabled && this.onClick());
    this.bg.on('pointerover', () => this.enabled && this.bg.setAlpha(0.85));
    this.bg.on('pointerout', () => this.bg.setAlpha(this.enabled ? 1 : 0.4));
  }

  press(): void {
    if (this.enabled) this.onClick();
  }

  setText(text: string): this {
    this.label.setText(text);
    return this;
  }

  setFocus(on: boolean): this {
    this.bg.setStrokeStyle(on ? 6 : 3, on ? PALETTE.moss : PALETTE.honey);
    return this;
  }

  setEnabled(enabled: boolean): this {
    this.enabled = enabled;
    this.bg.setAlpha(enabled ? 1 : 0.4);
    this.label.setAlpha(enabled ? 1 : 0.6);
    return this;
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
