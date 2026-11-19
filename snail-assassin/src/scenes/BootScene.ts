import Phaser from 'phaser';
import { CHARACTERS } from '../characters';
import type { CharacterConfig } from '../characters/types';
import { PALETTE } from '../config/gameConfig';

type Draw = (g: Phaser.GameObjects.Graphics) => void;

/**
 * Creates the placeholder pixel art in code (tiny textures, enlarged in-game).
 * When commissioned art arrives, load it in preload() instead and keep the keys.
 * Texture specs: docs/ART_DIRECTION.md.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    for (const c of CHARACTERS)
      this.makeTexture(`snail-${c.id}`, 16, 9, (g) => drawConeSnail(g, c));
    const fishColors = [PALETTE.fishA, PALETTE.fishB, PALETTE.fishC];
    fishColors.forEach((color, i) =>
      this.makeTexture(`fish-${i}`, 8, 5, (g) => drawFish(g, color)),
    );
    this.makeTexture('px', 1, 1, (g) => {
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 1, 1);
    });
    this.scene.start(this.firstScene());
  }

  private makeTexture(key: string, w: number, h: number, draw: Draw): void {
    const g = this.add.graphics();
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  /** Dev-only shortcut: http://localhost:8081/?scene=Hunt skips the title. */
  private firstScene(): string {
    const requested = new URLSearchParams(window.location.search).get('scene');
    const known = requested !== null && this.scene.get(requested) !== null;
    return import.meta.env.DEV && known ? requested : 'Title';
  }
}

/**
 * Top-down cone snail facing right (16×9 px): spire at the back, broad shoulder,
 * shell tapering forward, foot visible beneath, and siphon reaching ahead.
 * Deliberately conical, not a garden-snail spiral.
 */
function drawConeSnail(g: Phaser.GameObjects.Graphics, c: CharacterConfig): void {
  const { shell, pattern, body, accent } = c.palette;
  g.fillStyle(body, 1); // foot
  g.fillRect(4, 2, 10, 5);
  g.fillStyle(shell, 1); // shoulder + tapering body whorl
  g.fillRect(2, 1, 4, 7);
  g.fillTriangle(5, 1, 13, 4, 5, 7);
  g.fillRect(5, 1, 6, 7);
  g.fillTriangle(10, 1, 13, 4, 10, 7);
  g.fillStyle(pattern, 1); // low spire + "map" markings
  g.fillRect(1, 3, 2, 3);
  for (const [x, y] of [
    [4, 2],
    [7, 2],
    [8, 5],
    [5, 5],
    [10, 3],
    [6, 3],
  ] as const)
    g.fillRect(x, y, 2, 1);
  g.fillStyle(accent, 1); // siphon
  g.fillRect(14, 4, 2, 1);
}

function drawFish(g: Phaser.GameObjects.Graphics, color: number): void {
  g.fillStyle(color, 1);
  g.fillEllipse(4.5, 2.5, 6, 4);
  g.fillTriangle(0, 0, 2, 2.5, 0, 5);
  g.fillStyle(0x10202a, 1);
  g.fillRect(6, 2, 1, 1);
}
