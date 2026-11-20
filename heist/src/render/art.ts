import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import type { CrewMember } from '../content/crew';

// Placeholder art drawn in code, in a mid-century spy-film style. Replace any texture by loading
// an image under the same key.

function tex(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  draw: (g: Phaser.GameObjects.Graphics) => void,
): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

/** A thief from above, facing right. */
export function makeThief(scene: Phaser.Scene, c: CrewMember): string {
  const key = `thief-${c.id}`;
  tex(scene, key, 30, 30, (g) => {
    g.fillStyle(0x000000, 0.25).fillEllipse(15, 17, 26, 22);
    g.fillStyle(c.look.jacket, 1).fillEllipse(14, 15, 22, 20);
    g.fillStyle(c.look.accent, 1).fillRect(4, 12, 5, 7); // the Folder on the back
    g.fillStyle(0xe0b896, 1).fillCircle(19, 15, 6); // head
    g.fillStyle(c.look.hat, 1).fillCircle(17, 15, 6); // beanie
    g.fillStyle(0x111111, 1).fillRect(21, 12, 3, 6); // mask over the eyes
    g.fillStyle(c.look.jacket, 1).fillEllipse(19, 5, 8, 5).fillEllipse(19, 25, 8, 5); // arms
  });
  return key;
}

export function makeArt(scene: Phaser.Scene): void {
  tex(scene, 'guard', 30, 30, (g) => {
    g.fillStyle(0x000000, 0.25).fillEllipse(15, 17, 26, 22);
    g.fillStyle(0x2f4a6a, 1).fillEllipse(14, 15, 22, 20);
    g.fillStyle(PALETTE.gold, 1).fillRect(10, 13, 3, 3); // badge
    g.fillStyle(0xd8a888, 1).fillCircle(19, 15, 6);
    g.fillStyle(0x1c2c40, 1).fillCircle(18, 15, 6).fillRect(22, 11, 4, 8); // cap and brim
    g.fillStyle(0x2f4a6a, 1).fillEllipse(19, 5, 8, 5).fillEllipse(19, 25, 8, 5);
  });
  tex(scene, 'camera', 24, 18, (g) => {
    g.fillStyle(0x3a4a52, 1).fillRect(0, 6, 6, 6);
    g.fillStyle(PALETTE.cream, 1).fillRoundedRect(5, 2, 16, 14, 3);
    g.fillStyle(PALETTE.ink, 1).fillCircle(19, 9, 3);
    g.fillStyle(PALETTE.terracotta, 1).fillCircle(9, 5, 1.5);
  });
  tex(scene, 'diamond', 26, 26, (g) => {
    g.fillStyle(PALETTE.gold, 1).fillRect(3, 20, 20, 5); // pedestal
    g.fillStyle(0xbfe8ff, 1).fillTriangle(13, 4, 4, 11, 22, 11).fillTriangle(4, 11, 22, 11, 13, 21);
    g.fillStyle(0xffffff, 1).fillTriangle(13, 4, 9, 11, 13, 11);
    g.lineStyle(1, 0x5aa0c8, 1).strokeTriangle(4, 11, 22, 11, 13, 21);
  });
  tex(scene, 'gold', 18, 12, (g) => {
    g.fillStyle(0xb8902a, 1).fillRect(0, 4, 18, 8);
    g.fillStyle(PALETTE.gold, 1).fillRect(2, 0, 14, 8);
    g.fillStyle(0xfff0c0, 1).fillRect(4, 2, 6, 2);
  });
  tex(scene, 'van', 64, 34, (g) => {
    g.fillStyle(PALETTE.terracotta, 1).fillRoundedRect(0, 2, 60, 30, 6);
    g.fillStyle(PALETTE.cream, 1).fillRect(44, 6, 12, 22);
    g.fillStyle(PALETTE.ink, 1).fillRect(48, 8, 8, 18);
    g.fillStyle(PALETTE.gold, 1).fillRect(6, 15, 30, 4);
  });
  tex(scene, 'device', 22, 22, (g) => {
    g.fillStyle(0x000000, 0.3).fillCircle(11, 12, 10);
    g.fillStyle(PALETTE.gold, 1).fillRoundedRect(2, 2, 18, 18, 4);
    g.fillStyle(PALETTE.ink, 1).fillRoundedRect(5, 5, 12, 12, 2);
    g.fillStyle(PALETTE.mint, 1).fillCircle(11, 11, 3);
  });
  tex(scene, 'clamp', 20, 20, (g) => {
    g.lineStyle(4, PALETTE.gold, 1).strokeRect(3, 3, 14, 14);
    g.fillStyle(PALETTE.mint, 1).fillRect(8, 8, 4, 4);
  });
}

/** Floors and walls, with an Art Deco touch: chevron floors, gold trim, glass display cases. */
export function drawBuilding(
  g: Phaser.GameObjects.Graphics,
  tiles: string[],
  cols: number,
  rows: number,
  T: number,
): void {
  const at = (x: number, y: number) =>
    x < 0 || y < 0 || x >= cols || y >= rows ? 'wall' : (tiles[y * cols + x] ?? 'wall');
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const t = at(x, y);
      const px = x * T;
      const py = y * T;
      if (t === 'floor') {
        g.fillStyle((x + y) % 2 ? PALETTE.floor : PALETTE.floorLight, 1).fillRect(px, py, T, T);
        g.lineStyle(1, PALETTE.sage, 0.12)
          .lineBetween(px, py + T, px + T / 2, py + T / 2)
          .lineBetween(px + T / 2, py + T / 2, px + T, py + T);
      } else if (t === 'corridor') {
        g.fillStyle(PALETTE.corridor, 1).fillRect(px, py, T, T);
        g.lineStyle(1, 0x4a4030, 1)
          .lineBetween(px, py + T / 3, px + T, py + T / 3)
          .lineBetween(px, py + (2 * T) / 3, px + T, py + (2 * T) / 3);
      } else if (t === 'case') {
        // a glass display case: blocks you, not a guard's eyes
        g.fillStyle(PALETTE.floor, 1).fillRect(px, py, T, T);
        g.fillStyle(0x7fb8c8, 0.35).fillRect(px + 3, py + 3, T - 6, T - 6);
        g.lineStyle(2, PALETTE.gold, 1).strokeRect(px + 3, py + 3, T - 6, T - 6);
        g.fillStyle(0xbfe8ff, 0.9).fillCircle(px + T / 2, py + T / 2, 3);
      } else {
        g.fillStyle(PALETTE.wall, 1).fillRect(px, py, T, T);
        // gold trim on any edge that faces a room
        g.lineStyle(2, PALETTE.gold, 0.5);
        if (at(x, y + 1) !== 'wall') g.lineBetween(px, py + T - 1, px + T, py + T - 1);
        if (at(x, y - 1) !== 'wall') g.lineBetween(px, py + 1, px + T, py + 1);
        if (at(x + 1, y) !== 'wall') g.lineBetween(px + T - 1, py, px + T - 1, py + T);
        if (at(x - 1, y) !== 'wall') g.lineBetween(px + 1, py, px + 1, py + T);
      }
    }
}
