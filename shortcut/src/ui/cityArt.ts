import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import type { BuildingKind, Resource } from '../levels/types';

const v = (x: number, y: number) => new Phaser.Math.Vector2(x, y);

// Simple shapes for the city, drawn with Graphics so there are no image files to license.
// Every building has its own silhouette, so nothing depends on colour alone.

export function drawBuilding(
  g: Phaser.GameObjects.Graphics,
  kind: BuildingKind,
  x: number,
  y: number,
  lit: boolean,
): void {
  const window = lit ? 0xffe9a8 : 0x8d8578;
  g.lineStyle(2, PALETTE.ink, 1);
  switch (kind) {
    case 'bakery': {
      g.fillStyle(PALETTE.cream, 1)
        .fillRect(x - 30, y - 22, 60, 44)
        .strokeRect(x - 30, y - 22, 60, 44);
      // striped awning
      for (let i = 0; i < 6; i++) {
        g.fillStyle(i % 2 ? PALETTE.cream : PALETTE.terracotta, 1).fillRect(
          x - 34 + i * 11.3,
          y - 32,
          11.3,
          12,
        );
      }
      g.strokeRect(x - 34, y - 32, 68, 12);
      g.fillStyle(window, 1)
        .fillRect(x - 22, y - 12, 18, 14)
        .strokeRect(x - 22, y - 12, 18, 14);
      g.fillStyle(PALETTE.terracottaDark, 1)
        .fillRect(x + 6, y - 6, 14, 28)
        .strokeRect(x + 6, y - 6, 14, 28);
      // bread sign
      g.fillStyle(PALETTE.bread, 1).fillEllipse(x, y - 42, 26, 12);
      g.strokeEllipse(x, y - 42, 26, 12);
      break;
    }
    case 'cafe': {
      g.fillStyle(PALETTE.sage, 1)
        .fillRect(x - 30, y - 24, 60, 46)
        .strokeRect(x - 30, y - 24, 60, 46);
      g.fillStyle(PALETTE.terracotta, 1).fillTriangle(x - 36, y - 24, x, y - 48, x + 36, y - 24);
      g.strokeTriangle(x - 36, y - 24, x, y - 48, x + 36, y - 24);
      g.fillStyle(window, 1)
        .fillRect(x - 22, y - 14, 44, 16)
        .strokeRect(x - 22, y - 14, 44, 16);
      // cup
      g.fillStyle(PALETTE.cream, 1)
        .fillRect(x - 7, y + 6, 14, 12)
        .strokeRect(x - 7, y + 6, 14, 12);
      g.strokeCircle(x + 10, y + 12, 4);
      break;
    }
    case 'plant': {
      g.fillStyle(PALETTE.slateLight, 1)
        .fillRect(x - 32, y - 18, 64, 40)
        .strokeRect(x - 32, y - 18, 64, 40);
      g.fillStyle(PALETTE.slate, 1)
        .fillRect(x + 10, y - 50, 14, 32)
        .strokeRect(x + 10, y - 50, 14, 32);
      // lightning bolt
      g.fillStyle(lit ? 0xffd34d : 0xb7a77a, 1);
      g.fillPoints(
        [
          v(x - 10, y - 14),
          v(x + 2, y - 14),
          v(x - 4, y),
          v(x + 6, y),
          v(x - 12, y + 18),
          v(x - 6, y + 3),
          v(x - 14, y + 3),
        ],
        true,
      );
      break;
    }
    case 'factory': {
      g.fillStyle(PALETTE.creamDark, 1)
        .fillRect(x - 32, y - 16, 64, 38)
        .strokeRect(x - 32, y - 16, 64, 38);
      // saw-tooth roof
      for (let i = 0; i < 3; i++) {
        const left = x - 32 + i * 21.3;
        g.fillStyle(PALETTE.slate, 1).fillTriangle(
          left,
          y - 16,
          left + 21.3,
          y - 16,
          left + 21.3,
          y - 34,
        );
        g.strokeTriangle(left, y - 16, left + 21.3, y - 16, left + 21.3, y - 34);
      }
      g.fillStyle(window, 1);
      for (let i = 0; i < 3; i++)
        g.fillRect(x - 26 + i * 20, y - 6, 12, 10).strokeRect(x - 26 + i * 20, y - 6, 12, 10);
      break;
    }
    case 'tower': {
      g.fillStyle(PALETTE.slate, 1).fillRect(x - 3, y - 6, 6, 28);
      g.lineBetween(x - 18, y + 22, x - 8, y - 6).lineBetween(x + 18, y + 22, x + 8, y - 6);
      g.fillStyle(PALETTE.water, 1)
        .fillRoundedRect(x - 22, y - 44, 44, 38, 10)
        .strokeRoundedRect(x - 22, y - 44, 44, 38, 10);
      // a drop on the tank
      g.fillStyle(lit ? 0xe8f6ff : 0xb9c7cf, 1).fillCircle(x, y - 22, 7);
      g.fillTriangle(x - 6, y - 25, x + 6, y - 25, x, y - 36);
      break;
    }
    case 'homes': {
      for (const dx of [-22, 8]) {
        g.fillStyle(PALETTE.cream, 1)
          .fillRect(x + dx - 12, y - 12, 26, 34)
          .strokeRect(x + dx - 12, y - 12, 26, 34);
        g.fillStyle(PALETTE.terracotta, 1).fillTriangle(
          x + dx - 16,
          y - 12,
          x + dx + 1,
          y - 30,
          x + dx + 18,
          y - 12,
        );
        g.strokeTriangle(x + dx - 16, y - 12, x + dx + 1, y - 30, x + dx + 18, y - 12);
        g.fillStyle(window, 1)
          .fillRect(x + dx - 5, y - 4, 12, 10)
          .strokeRect(x + dx - 5, y - 4, 12, 10);
      }
      break;
    }
    case 'cooling': {
      g.fillStyle(PALETTE.slateLight, 1)
        .fillRect(x - 32, y - 20, 64, 42)
        .strokeRect(x - 32, y - 20, 64, 42);
      g.fillStyle(PALETTE.water, 1)
        .fillRect(x - 32, y - 28, 64, 8)
        .strokeRect(x - 32, y - 28, 64, 8);
      // snowflake sign
      g.lineStyle(3, lit ? 0xffffff : 0x8d8578, 1);
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI) / 3;
        g.lineBetween(
          x - Math.cos(a) * 11,
          y + 1 - Math.sin(a) * 11,
          x + Math.cos(a) * 11,
          y + 1 + Math.sin(a) * 11,
        );
      }
      g.lineStyle(2, PALETTE.ink, 1);
      break;
    }
    case 'workshop': {
      g.fillStyle(PALETTE.sage, 1)
        .fillRect(x - 30, y - 20, 60, 42)
        .strokeRect(x - 30, y - 20, 60, 42);
      g.fillStyle(PALETTE.slate, 1)
        .fillRect(x - 34, y - 30, 68, 10)
        .strokeRect(x - 34, y - 30, 68, 10);
      g.fillStyle(window, 1)
        .fillRect(x - 22, y - 12, 44, 14)
        .strokeRect(x - 22, y - 12, 44, 14);
      // a gear
      g.fillStyle(PALETTE.ink, 1).fillCircle(x, y + 12, 6);
      g.fillStyle(window, 1).fillCircle(x, y + 12, 2);
      break;
    }
    case 'greenhouse': {
      g.fillStyle(lit ? 0xd8eed4 : 0xc9cfc4, 1);
      g.fillPoints(
        [v(x - 32, y + 22), v(x - 32, y - 8), v(x, y - 34), v(x + 32, y - 8), v(x + 32, y + 22)],
        true,
      );
      g.strokePoints(
        [v(x - 32, y + 22), v(x - 32, y - 8), v(x, y - 34), v(x + 32, y - 8), v(x + 32, y + 22)],
        true,
      );
      g.lineBetween(x, y - 34, x, y + 22).lineBetween(x - 32, y - 8, x + 32, y - 8);
      // little plants
      g.fillStyle(PALETTE.sageDark, 1)
        .fillCircle(x - 16, y + 12, 6)
        .fillCircle(x + 16, y + 12, 6);
      break;
    }
  }
}

/** Closed buildings are boarded up, so "closed" reads without colour. */
export function drawClosedSign(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  g.fillStyle(0xf7f1e4, 0.55).fillRect(x - 38, y - 50, 76, 76);
  g.lineStyle(5, PALETTE.ink, 0.8)
    .lineBetween(x - 26, y - 30, x + 26, y + 14)
    .lineBetween(x + 26, y - 30, x - 26, y + 14);
}

/** A delivery truck on its route, pointing the way it drives. */
export function drawTruck(g: Phaser.GameObjects.Graphics, x: number, y: number, dir: 1 | -1): void {
  g.lineStyle(2, PALETTE.ink, 1).fillStyle(PALETTE.water, 1);
  g.fillRect(x - 12, y - 9, 18, 12).strokeRect(x - 12, y - 9, 18, 12);
  g.fillStyle(PALETTE.cream, 1);
  const cab = dir === 1 ? x + 6 : x - 18;
  g.fillRect(cab, y - 5, 12, 8).strokeRect(cab, y - 5, 12, 8);
  g.fillStyle(PALETTE.ink, 1)
    .fillCircle(x - 7, y + 4, 3)
    .fillCircle(x + 7, y + 4, 3);
}

/** One end of a shortcut machine, sitting on the road. */
export function drawMachineEnd(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  held: boolean,
): void {
  g.fillStyle(PALETTE.gold, 1).lineStyle(2, PALETTE.goldDark, 1);
  g.fillRoundedRect(x - 9, y - 9, 18, 14, 4).strokeRoundedRect(x - 9, y - 9, 18, 14, 4);
  g.fillStyle(PALETTE.ink, 1)
    .fillCircle(x - 5, y + 6, 3)
    .fillCircle(x + 5, y + 6, 3);
  if (held) {
    // a small "held" clamp over the machine
    g.lineStyle(3, PALETTE.slate, 1).strokeRect(x - 12, y - 13, 24, 20);
  }
}

/** A checkpoint sign above the road, its arrow showing which way it faces. */
export function drawCheckpoint(
  g: Phaser.GameObjects.Graphics,
  x: number,
  roadTop: number,
  facing: 1 | -1,
  fixed: boolean,
): void {
  g.fillStyle(PALETTE.slate, 1).fillRect(x - 2, roadTop - 30, 4, 30);
  g.fillStyle(PALETTE.slate, 1).lineStyle(2, PALETTE.ink, 1);
  g.fillRoundedRect(x - 15, roadTop - 52, 30, 24, 5).strokeRoundedRect(
    x - 15,
    roadTop - 52,
    30,
    24,
    5,
  );
  g.fillStyle(0xffffff, 1);
  const cy = roadTop - 40;
  if (facing === 1) g.fillTriangle(x - 8, cy - 7, x - 8, cy + 7, x + 9, cy);
  else g.fillTriangle(x + 8, cy - 7, x + 8, cy + 7, x - 9, cy);
  if (fixed) g.fillStyle(PALETTE.ink, 1).fillCircle(x, roadTop - 56, 3);
}

/** A machine depot: a little garage beside the road. */
export function drawDepot(
  g: Phaser.GameObjects.Graphics,
  x: number,
  roadTop: number,
  fixed: boolean,
): void {
  g.lineStyle(2, PALETTE.ink, 1);
  g.fillStyle(PALETTE.terracotta, 1)
    .fillRect(x - 15, roadTop - 26, 30, 24)
    .strokeRect(x - 15, roadTop - 26, 30, 24);
  g.fillStyle(PALETTE.terracottaDark, 1).fillTriangle(
    x - 18,
    roadTop - 26,
    x,
    roadTop - 40,
    x + 18,
    roadTop - 26,
  );
  g.strokeTriangle(x - 18, roadTop - 26, x, roadTop - 40, x + 18, roadTop - 26);
  g.fillStyle(PALETTE.gold, 1).fillRect(x - 8, roadTop - 16, 16, 14);
  g.lineStyle(1, PALETTE.goldDark, 1);
  for (let i = 0; i < 3; i++)
    g.lineBetween(x - 8, roadTop - 12 + i * 4, x + 8, roadTop - 12 + i * 4);
  if (fixed) g.fillStyle(PALETTE.ink, 1).fillCircle(x, roadTop - 44, 3);
}

/** A delivery parcel: a loaf for bread, a diamond for power, a drop for water. */
export function drawParcel(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  resource: Resource,
): void {
  g.lineStyle(2, PALETTE.ink, 1);
  if (resource === 'bread') {
    g.fillStyle(PALETTE.bread, 1).fillEllipse(x, y, 16, 10).strokeEllipse(x, y, 16, 10);
  } else if (resource === 'water') {
    g.fillStyle(PALETTE.water, 1)
      .fillCircle(x, y + 2, 6)
      .strokeCircle(x, y + 2, 6);
    g.fillTriangle(x - 5, y, x + 5, y, x, y - 9);
  } else {
    g.fillStyle(PALETTE.power, 1);
    const pts = [v(x, y - 8), v(x + 6, y), v(x, y + 8), v(x - 6, y)];
    g.fillPoints(pts, true).strokePoints(pts, true);
  }
}

/** The shortcut's arch from one end to the other. */
export function shortcutCurve(
  x1: number,
  x2: number,
  roadTop: number,
  maxRise: number,
): Phaser.Curves.CubicBezier {
  const rise = Math.min(maxRise, Math.abs(x2 - x1) * 0.6 + 12);
  return new Phaser.Curves.CubicBezier(
    new Phaser.Math.Vector2(x1, roadTop),
    new Phaser.Math.Vector2(x1, roadTop - rise * 1.33),
    new Phaser.Math.Vector2(x2, roadTop - rise * 1.33),
    new Phaser.Math.Vector2(x2, roadTop),
  );
}
