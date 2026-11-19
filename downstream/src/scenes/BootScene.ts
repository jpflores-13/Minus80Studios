import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';

type Draw = (g: Phaser.GameObjects.Graphics) => void;

// Placeholder pixel art, drawn small and scaled up in game.
// Replace by loading real images under the same keys.
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
    this.tex('filter', 10, 8, (g) => {
      g.fillStyle(0x3a3a3a, 1);
      g.fillRect(0, 0, 10, 8);
      g.fillStyle(0x9a9a9a, 1);
      for (let x = 1; x < 10; x += 2) g.fillRect(x, 1, 1, 6);
      g.fillStyle(PALETTE.accent, 1);
      g.fillRect(0, 0, 10, 1);
    });
    this.tex('trap', 18, 6, (g) => {
      g.fillStyle(0x3a3a3a, 1);
      g.fillRect(0, 0, 18, 6);
      g.fillStyle(0xd9d2c0, 1);
      for (let x = 1; x < 17; x += 2) g.fillRect(x, 1, 1, 4);
      g.fillStyle(PALETTE.warn, 1);
      g.fillRect(0, 0, 2, 6);
      g.fillRect(16, 0, 2, 6);
    });
    this.tex('boom', 16, 4, (g) => {
      g.fillStyle(0xf2c94c, 1);
      for (let x = 0; x < 16; x += 4) g.fillRect(x, 0, 3, 4);
      g.fillStyle(0x2d2a26, 1);
      for (let x = 3; x < 16; x += 4) g.fillRect(x, 1, 1, 2);
    });
    this.tex('gps', 7, 3, (g) => {
      g.fillStyle(PALETTE.gpsPink, 1);
      g.fillRect(0, 0, 6, 3);
      g.fillRect(6, 1, 1, 1);
      g.fillStyle(0xffffff, 1);
      g.fillRect(2, 1, 2, 1);
    });
    this.tex('crew', 7, 9, (g) => {
      g.fillStyle(0xf2b632, 1);
      g.fillRect(1, 3, 5, 5);
      g.fillStyle(0xe8c9a0, 1);
      g.fillRect(2, 0, 3, 3);
      g.fillStyle(0x3f6b35, 1);
      g.fillRect(1, 8, 2, 1);
      g.fillRect(4, 8, 2, 1);
    });
    this.tex('cleanup', 9, 9, (g) => {
      g.fillStyle(0x6b4b2a, 1);
      g.fillRect(4, 0, 1, 6);
      g.fillStyle(0xf2b632, 1);
      g.fillRect(1, 6, 7, 3);
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
    this.tex('market', 16, 10, (g) => {
      g.fillStyle(PALETTE.wall, 1);
      g.fillRect(0, 3, 16, 7);
      for (let x = 0; x < 16; x += 4) {
        g.fillStyle(x % 8 === 0 ? 0xd9603b : 0xf4ead2, 1);
        g.fillRect(x, 0, 4, 3);
      }
      g.fillStyle(0x6b4b2a, 1);
      g.fillRect(7, 6, 2, 4);
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
    this.tex('apartments', 12, 16, (g) => {
      g.fillStyle(0xb9ab8c, 1);
      g.fillRect(0, 0, 12, 16);
      g.fillStyle(0xfff7d6, 1);
      for (let y = 2; y < 14; y += 3) for (let x = 2; x < 11; x += 3) g.fillRect(x, y, 2, 2);
    });
    this.tex('lot', 20, 12, (g) => {
      g.fillStyle(0x6e6e6e, 1);
      g.fillRect(0, 0, 20, 12);
      g.fillStyle(0xf2f2f2, 1);
      for (let x = 2; x < 20; x += 4) g.fillRect(x, 1, 1, 4);
      for (let x = 2; x < 20; x += 4) g.fillRect(x, 7, 1, 4);
    });
    this.tex('tree', 8, 9, (g) => {
      g.fillStyle(0x6b4b2a, 1);
      g.fillRect(3, 6, 2, 3);
      g.fillStyle(PALETTE.tree, 1);
      g.fillCircle(4, 4, 4);
      g.fillStyle(0x5a8d48, 1);
      g.fillRect(2, 2, 2, 2);
    });
    this.tex('log', 20, 5, (g) => {
      g.fillStyle(0x6b4b2a, 1);
      g.fillRect(0, 1, 20, 3);
      g.fillStyle(0x8a6a3a, 1);
      g.fillRect(0, 1, 20, 1);
      g.fillRect(14, 0, 2, 1);
      g.fillRect(5, 4, 2, 1);
    });
    this.tex('reeds', 14, 8, (g) => {
      g.fillStyle(0x4f7a3a, 1);
      for (let x = 0; x < 14; x += 2) g.fillRect(x, (x * 3) % 4, 1, 8 - ((x * 3) % 4));
      g.fillStyle(0x8a6a3a, 1);
      g.fillRect(3, 0, 1, 2);
      g.fillRect(9, 1, 1, 2);
    });
    this.tex('px', 1, 1, (g) => {
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 1, 1);
    });

    // Dev shortcut: ?scene=Level&level=level-3 (also Ending, LevelSelect).
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('scene');
    if (import.meta.env.DEV && requested && this.scene.get(requested)) {
      this.scene.start(requested, { levelId: params.get('level') ?? 'level-1' });
    } else {
      this.scene.start('Splash');
    }
  }

  private tex(key: string, w: number, h: number, draw: Draw): void {
    const g = this.add.graphics();
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }
}
