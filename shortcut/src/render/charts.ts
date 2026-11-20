import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import type { Building } from '../levels/types';
import { at, type ContactMap } from '../systems/contacts';
import { TEXT_STYLES } from '../ui/text';

export interface HeatmapOptions {
  /** 'sequential' for maps, 'diverging' for differences (orange = more, blue = less). */
  scale?: 'sequential' | 'diverging';
  /** Buildings to mark along the edges. */
  marks?: { bin: number; label: string }[];
  title?: string;
  note?: string;
  dark?: boolean;
}

const LOW = 0xfffaf0;
const HIGH = 0x7a3e10;
const BLUE = 0x2f6fa8;

function mix(a: number, b: number, t: number): number {
  const ca = Phaser.Display.Color.ValueToColor(a);
  const cb = Phaser.Display.Color.ValueToColor(b);
  const c = Phaser.Display.Color.Interpolate.ColorWithColor(ca, cb, 100, Math.round(t * 100));
  return Phaser.Display.Color.GetColor(c.r, c.g, c.b);
}

/** Draws a square heat map of a contact map. Returns a container so callers can move or destroy it. */
export function drawHeatmap(
  scene: Phaser.Scene,
  m: ContactMap,
  x: number,
  y: number,
  size: number,
  opts: HeatmapOptions = {},
): Phaser.GameObjects.Container {
  const box = scene.add.container(x, y);
  const g = scene.add.graphics();
  box.add(g);
  const cell = size / m.n;
  // Colour scale: saturate at the 95th percentile of pairs at least two apart, so the bright
  // near-diagonal doesn't wash out the dots and squares further out (as Hi-C viewers do).
  const off: number[] = [];
  for (let a = 0; a < m.n; a++) for (let b = a + 2; b < m.n; b++) off.push(Math.abs(at(m, a, b)));
  off.sort((p, q) => p - q);
  const max = off[Math.floor(off.length * 0.95)] || Math.max(...off, 0);
  g.fillStyle(0xffffff, 1).fillRect(0, 0, size, size);
  for (let a = 0; a < m.n; a++) {
    for (let b = 0; b < m.n; b++) {
      // the diagonal (an address with itself) is drawn as fully connected
      const raw = a === b && opts.scale !== 'diverging' ? max : at(m, a, b);
      const v = max > 0 ? Math.max(-1, Math.min(1, raw / max)) : 0;
      if (v === 0) continue;
      const color =
        opts.scale === 'diverging'
          ? v > 0
            ? mix(LOW, PALETTE.heat, Math.sqrt(v))
            : mix(LOW, BLUE, Math.sqrt(-v))
          : mix(LOW, HIGH, v);
      g.fillStyle(color, 1).fillRect(b * cell, a * cell, cell + 0.5, cell + 0.5);
    }
  }
  const ink = opts.dark ? '#ece8f6' : PALETTE.text;
  g.lineStyle(2, opts.dark ? 0xece8f6 : PALETTE.ink, 1).strokeRect(0, 0, size, size);
  for (const mk of opts.marks ?? []) {
    const p = (mk.bin + 0.5) * cell;
    g.lineStyle(1, PALETTE.ink, 0.3).lineBetween(p, 0, p, size).lineBetween(0, p, size, p);
    box.add(
      scene.add
        .text(-6, p, mk.label, { ...TEXT_STYLES.small, fontSize: '13px', color: ink })
        .setOrigin(1, 0.5),
    );
  }
  if (opts.title)
    box.add(
      scene.add
        .text(size / 2, -30, opts.title, {
          ...TEXT_STYLES.body,
          fontSize: '19px',
          fontStyle: 'bold',
          color: ink,
        })
        .setOrigin(0.5),
    );
  if (opts.note)
    box.add(
      scene.add
        .text(size / 2, -9, opts.note, {
          ...TEXT_STYLES.small,
          fontSize: '12px',
          color: opts.dark ? '#b3acd0' : PALETTE.textDim,
        })
        .setOrigin(0.5),
    );
  return box;
}

/** A small bar chart of a distribution (e.g. shortcut lengths). */
export function drawHistogram(
  scene: Phaser.Scene,
  values: number[],
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  overlay?: number[],
  dark = false,
): Phaser.GameObjects.Container {
  const box = scene.add.container(x, y);
  const g = scene.add.graphics();
  box.add(g);
  const max = Math.max(1e-9, ...values, ...(overlay ?? []));
  const bw = w / values.length;
  g.lineStyle(1, dark ? 0xece8f6 : PALETTE.ink, 1).lineBetween(0, h, w, h);
  values.forEach((v, i) => {
    const bh = (v / max) * h;
    g.fillStyle(PALETTE.gold, 1).fillRect(i * bw + 1, h - bh, Math.max(1, bw - 2), bh);
  });
  if (overlay) {
    g.lineStyle(2, dark ? 0x9ad7ff : PALETTE.slate, 1);
    const pts = overlay.map((v, i) => new Phaser.Math.Vector2((i + 0.5) * bw, h - (v / max) * h));
    g.strokePoints(pts);
  }
  const ink = dark ? '#ece8f6' : PALETTE.text;
  box.add(
    scene.add
      .text(0, -20, title, {
        ...TEXT_STYLES.small,
        fontSize: '14px',
        fontStyle: 'bold',
        color: ink,
      })
      .setOrigin(0, 0.5),
  );
  box.add(
    scene.add
      .text(w, h + 10, 'longer →', { ...TEXT_STYLES.small, fontSize: '12px', color: ink })
      .setOrigin(1, 0),
  );
  return box;
}

export function buildingMarks(buildings: Building[], name: (b: Building) => string) {
  return buildings.map((b) => ({ bin: b.bin, label: name(b) }));
}
