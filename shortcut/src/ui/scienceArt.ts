import Phaser from 'phaser';
import type { Building } from '../levels/types';

// Science Mode drawings: the same positions and shapes of the simulation, shown as a chromatin
// fibre with cohesin rings, CTCF sites, enhancers and genes. Schematic, not to scale.

export const SCI = {
  bg: 0x1d1b2e,
  panel: 0x2a2740,
  fiber: 0x9d8cc9,
  bead: 0xc9bce8,
  loop: 0x5ec4b6,
  loopDark: 0x2c7a70,
  cohesin: 0xf0b93a,
  ctcf: 0xe0605a,
  enhancer: 0xf2a65a,
  gene: 0x7cc0f0,
  pol: 0xd7d3e6,
  text: '#ece8f6',
  textDim: '#b3acd0',
} as const;

const v = (x: number, y: number) => new Phaser.Math.Vector2(x, y);

/** The road becomes a wavy fibre with one bead per bin. */
export function drawFiber(
  g: Phaser.GameObjects.Graphics,
  x0: number,
  x1: number,
  y: number,
  bins: number,
): void {
  const pts: Phaser.Math.Vector2[] = [];
  for (let x = x0 - 16; x <= x1 + 16; x += 4) pts.push(v(x, y + Math.sin(x / 9) * 4));
  g.lineStyle(7, SCI.fiber, 1).strokePoints(pts);
  const w = (x1 - x0) / bins;
  g.fillStyle(SCI.bead, 1);
  for (let i = 0; i < bins; i++) {
    const x = x0 + (i + 0.5) * w;
    g.fillCircle(x, y + Math.sin(x / 9) * 4, 3.5);
  }
}

/** A cohesin ring where a machine end would be. */
export function drawRing(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  held: boolean,
): void {
  g.lineStyle(4, SCI.cohesin, 1).strokeCircle(x, y, 9);
  if (held) g.lineStyle(2, SCI.ctcf, 1).strokeCircle(x, y, 13);
}

/** A CTCF site: a triangle pointing the way its motif faces. */
export function drawCtcf(
  g: Phaser.GameObjects.Graphics,
  x: number,
  top: number,
  facing: 1 | -1,
  fixed: boolean,
): void {
  const y = top - 28;
  g.fillStyle(SCI.ctcf, 1).lineStyle(2, 0xffffff, 0.9);
  const pts =
    facing === 1
      ? [v(x - 9, y - 11), v(x - 9, y + 11), v(x + 11, y)]
      : [v(x + 9, y - 11), v(x + 9, y + 11), v(x - 11, y)];
  g.fillPoints(pts, true).strokePoints(pts, true);
  g.lineStyle(2, SCI.ctcf, 0.8).lineBetween(x, y + 12, x, top + 4);
  if (fixed) g.fillStyle(0xffffff, 1).fillCircle(x, y - 16, 2.5);
}

/** A loading site: a small hexagon on the fibre. */
export function drawLoader(
  g: Phaser.GameObjects.Graphics,
  x: number,
  top: number,
  fixed: boolean,
): void {
  const y = top - 22;
  const pts = Array.from({ length: 6 }, (_, i) =>
    v(x + Math.cos((i * Math.PI) / 3) * 12, y + Math.sin((i * Math.PI) / 3) * 12),
  );
  g.fillStyle(SCI.cohesin, 0.35).fillPoints(pts, true);
  g.lineStyle(2, SCI.cohesin, 1).strokePoints(pts, true);
  if (fixed) g.fillStyle(0xffffff, 1).fillCircle(x, y, 2.5);
}

/** Enhancers are boxes; genes are boxes with a bent promoter arrow. Activity fills them in. */
export function drawElement(
  g: Phaser.GameObjects.Graphics,
  b: Building,
  x: number,
  y: number,
  on: boolean,
  open: boolean,
): void {
  const color = b.role === 'supplier' ? SCI.enhancer : SCI.gene;
  g.lineStyle(3, color, open ? 1 : 0.35);
  g.fillStyle(color, on ? 0.85 : 0.15)
    .fillRect(x - 26, y - 14, 52, 28)
    .strokeRect(x - 26, y - 14, 52, 28);
  if (b.role === 'consumer') {
    // promoter arrow
    g.lineBetween(x - 26, y - 14, x - 26, y - 30).lineBetween(x - 26, y - 30, x - 6, y - 30);
    g.fillStyle(color, open ? 1 : 0.35).fillTriangle(x - 6, y - 36, x - 6, y - 24, x + 4, y - 30);
  } else {
    g.lineBetween(x - 26, y, x + 26, y);
  }
}

export function drawPolymerase(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  dir: 1 | -1,
): void {
  g.fillStyle(SCI.pol, 1).fillEllipse(x, y - 4, 22, 14);
  // the RNA trailing behind
  g.lineStyle(2, SCI.pol, 0.8);
  const tail = [
    v(x - dir * 10, y - 4),
    v(x - dir * 16, y - 12),
    v(x - dir * 22, y - 8),
    v(x - dir * 28, y - 16),
  ];
  g.strokePoints(tail);
}
