import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';

type Draw = (g: Phaser.GameObjects.Graphics) => void;

/**
 * Generates placeholder pixel art in code (tiny textures, enlarged ×PIXEL in-game).
 * Replace with commissioned art later by loading files under the same keys.
 * Specs: docs/ART_DIRECTION.md.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.tex('bin', 8, 10, (g) => {
      g.fillStyle(PALETTE.accent, 1);
      g.fillRect(1, 2, 6, 8);
      g.fillStyle(0x1f5f4a, 1);
      g.fillRect(0, 1, 8, 2);
      g.fillRect(3, 0, 2, 1);
      g.fillStyle(PALETTE.cream, 1);
      g.fillRect(2, 4, 1, 4);
      g.fillRect(5, 4, 1, 4);
    });
    // Trash trap: a floating mesh frame drawn horizontally; rotated across the channel in-game.
    this.tex('trap', 18, 6, (g) => {
      g.fillStyle(0x3a3a3a, 1);
      g.fillRect(0, 0, 18, 6);
      g.fillStyle(0xd9d2c0, 1);
      for (let x = 1; x < 17; x += 2) g.fillRect(x, 1, 1, 4);
      g.fillStyle(PALETTE.warn, 1);
      g.fillRect(0, 0, 2, 6);
      g.fillRect(16, 0, 2, 6);
    });
    this.tex('bottle', 6, 3, (g) => {
      g.fillStyle(PALETTE.bottle, 1);
      g.fillRect(0, 0, 5, 3);
      g.fillRect(5, 1, 1, 1);
    });
    this.tex('bag', 4, 4, (g) => {
      g.fillStyle(PALETTE.bag, 1);
      g.fillTriangle(0, 4, 2, 0, 4, 4);
    });
    this.tex('wrapper', 3, 3, (g) => {
      g.fillStyle(PALETTE.wrapper, 1);
      g.fillRect(0, 0, 3, 3);
    });
    this.tex('house', 10, 10, (g) => {
      g.fillStyle(PALETTE.wall, 1);
      g.fillRect(1, 4, 8, 6);
      g.fillStyle(PALETTE.roof, 1);
      g.fillTriangle(0, 5, 5, 0, 10, 5);
      g.fillStyle(0x6b4b2a, 1);
      g.fillRect(4, 7, 2, 3);
    });
    this.tex('store', 14, 10, (g) => {
      g.fillStyle(PALETTE.wall, 1);
      g.fillRect(0, 2, 14, 8);
      g.fillStyle(0x3f86b0, 1);
      g.fillRect(0, 0, 14, 3);
      g.fillStyle(0xfff7d6, 1);
      g.fillRect(2, 5, 4, 3);
      g.fillRect(8, 5, 4, 3);
    });
    this.tex('school', 18, 12, (g) => {
      g.fillStyle(0xc77a4a, 1);
      g.fillRect(0, 3, 18, 9);
      g.fillStyle(PALETTE.wall, 1);
      for (let x = 2; x < 16; x += 4) g.fillRect(x, 5, 2, 2);
      g.fillStyle(0x6b4b2a, 1);
      g.fillRect(8, 8, 2, 4);
      g.fillStyle(PALETTE.roof, 1);
      g.fillRect(0, 2, 18, 2);
      g.fillRect(8, 0, 2, 2);
    });
    this.tex('tree', 8, 9, (g) => {
      g.fillStyle(0x6b4b2a, 1);
      g.fillRect(3, 6, 2, 3);
      g.fillStyle(PALETTE.tree, 1);
      g.fillCircle(4, 4, 4);
      g.fillStyle(0x5a8d48, 1);
      g.fillRect(2, 2, 2, 2);
    });
    this.tex('px', 1, 1, (g) => {
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 1, 1);
    });
    this.scene.start(this.firstScene());
  }

  private tex(key: string, w: number, h: number, draw: Draw): void {
    const g = this.add.graphics();
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  /** Dev-only shortcut: http://localhost:8082/?scene=Level skips the title. */
  private firstScene(): string {
    const requested = new URLSearchParams(window.location.search).get('scene');
    const known = requested !== null && this.scene.get(requested) !== null;
    return import.meta.env.DEV && known ? requested : 'Title';
  }
}
