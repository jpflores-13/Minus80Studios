import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';

/**
 * Creates placeholder textures in code, so the prototype needs no image files.
 * When real art arrives, load it here instead (this.load.image(...) in preload()).
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.makeTexture('bottle', 40, 16, (g) => {
      g.fillStyle(PALETTE.bottle, 1);
      g.fillRoundedRect(0, 2, 32, 12, 4);
      g.fillRect(32, 5, 8, 6);
    });
    this.makeTexture('bag', 30, 30, (g) => {
      g.fillStyle(PALETTE.bag, 0.9);
      g.fillTriangle(2, 28, 15, 2, 28, 28);
    });
    this.makeTexture('fragment', 14, 14, (g) => {
      g.fillStyle(PALETTE.fragment, 1);
      g.fillRect(0, 0, 14, 14);
    });
    this.makeTexture('ripple', 24, 4, (g) => {
      g.fillStyle(PALETTE.waterLight, 1);
      g.fillRect(0, 0, 24, 4);
    });
    this.scene.start(this.firstScene());
  }

  private makeTexture(
    key: string,
    w: number,
    h: number,
    draw: (g: Phaser.GameObjects.Graphics) => void,
  ): void {
    const g = this.add.graphics();
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  /** Dev-only shortcut: open http://localhost:8082/?scene=Play to skip the title. */
  private firstScene(): string {
    const requested = new URLSearchParams(window.location.search).get('scene');
    const known = requested !== null && this.scene.get(requested) !== null;
    return import.meta.env.DEV && known ? requested : 'Title';
  }
}
