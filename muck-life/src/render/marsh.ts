import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import type { Colormap } from '../config/progress';
import { SIM } from '../config/tuning';
import type { Distractor } from '../systems/distractors';
import type { OxygenField } from '../systems/oxygen';
import type { Ramet, RootSystem, Segment } from '../systems/plant';
import { WORLD } from '../systems/session';
import { colorFor, LEGEND_MAX } from './colormap';

// Placeholder art, drawn procedurally. Every piece here maps to an entry in docs/ASSET_MANIFEST.csv
// so an artist can replace it with sprites without touching gameplay code.

export type ViewMode = 'natural' | 'imaging' | 'combined';

export const VIEW_LABEL: Record<ViewMode, string> = {
  natural: 'NATURAL SEDIMENT',
  imaging: 'OXYGEN IMAGING',
  combined: 'ROOTS + OXYGEN',
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function mixColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  return (
    (Math.round(lerp(ar, br, t)) << 16) |
    (Math.round(lerp(ag, bg, t)) << 8) |
    Math.round(lerp(ab, bb, t))
  );
}

/** Draws the sky, water and the aboveground cattails. */
export class Aboveground {
  private readonly sky: Phaser.GameObjects.Graphics;
  private readonly plants: Phaser.GameObjects.Graphics;
  private readonly stars: { x: number; y: number; r: number }[] = [];
  private t = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly opts: { flowerSpikes: boolean; reducedMotion: boolean } = {
      flowerSpikes: false,
      reducedMotion: false,
    },
  ) {
    this.sky = scene.add.graphics().setDepth(0);
    this.plants = scene.add.graphics().setDepth(2);
    for (let i = 0; i < 40; i++)
      this.stars.push({
        x: (i * 137) % WORLD.width,
        y: 8 + ((i * 53) % 120),
        r: 1 + (i % 3) * 0.5,
      });
  }

  /** light: 0 night … 1 day. */
  draw(dt: number, light: number, ramets: { x: number; bornAt: number }[], simHour: number): void {
    this.t += this.opts.reducedMotion ? 0 : dt;
    const g = this.sky;
    g.clear();
    const top = mixColor(0x0d1322, 0x8fc3cf, light);
    const bottom = mixColor(0x1d2436, 0xe9dcb4, light);
    const bands = 10;
    for (let i = 0; i < bands; i++) {
      g.fillStyle(mixColor(top, bottom, i / (bands - 1)), 1);
      g.fillRect(0, (i * 160) / bands, WORLD.width, 160 / bands + 1);
    }
    // Stars and moon at night, sun by day.
    if (light < 0.6) {
      for (const s of this.stars) {
        g.fillStyle(PALETTE.cream, (0.6 - light) * (0.5 + 0.5 * Math.sin(this.t * 2 + s.x)));
        g.fillCircle(s.x, s.y, s.r);
      }
      g.fillStyle(0xeef0e0, 1 - light);
      g.fillCircle(820, 70, 18);
      g.fillStyle(mixColor(top, bottom, 0.2), 1 - light);
      g.fillCircle(829, 64, 15);
    }
    if (light > 0.05) {
      g.fillStyle(0xffe9a8, light * 0.35);
      g.fillCircle(470, 70, 40);
      g.fillStyle(0xfff2c4, light);
      g.fillCircle(470, 70, 22);
    }
    // Distant marsh grasses.
    g.fillStyle(mixColor(0x142018, 0x5e7d4a, light), 1);
    for (let x = 0; x < WORLD.width; x += 9) {
      const h = 18 + ((x * 31) % 23);
      const sway = Math.sin(this.t * 0.9 + x * 0.05) * 2;
      g.fillTriangle(x, 162, x + 6, 162, x + 3 + sway, 162 - h);
    }
    // Water surface over the sediment.
    g.fillStyle(mixColor(0x1a2a33, 0x6b9a9e, light), 0.95);
    g.fillRect(0, 160, WORLD.width, WORLD.soilTop - 160);
    g.lineStyle(2, mixColor(0x3b5560, 0xd6efe9, light), 0.8);
    g.beginPath();
    for (let x = 0; x <= WORLD.width; x += 16) {
      const y = 161 + Math.sin(this.t * 1.6 + x * 0.04) * 1.5;
      if (x === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.strokePath();

    const p = this.plants;
    p.clear();
    for (const r of ramets)
      this.cattail(p, r.x, Math.min(1, (simHour - r.bornAt) / 40 + 0.35), light);
  }

  /** One cattail ramet: slender strap leaves (and, optionally, a brown flower spike). */
  private cattail(
    g: Phaser.GameObjects.Graphics,
    x: number,
    maturity: number,
    light: number,
  ): void {
    const base = WORLD.soilTop - 2;
    const height = lerp(40, 150, Math.max(0, Math.min(1, maturity)));
    const leaf = mixColor(0x243621, PALETTE.cattail, 0.35 + light * 0.65);
    const leafDark = mixColor(0x1a2818, 0x4d6b3f, 0.35 + light * 0.65);
    const leaves = [-0.5, -0.25, 0, 0.2, 0.42, 0.6];
    leaves.forEach((lean, i) => {
      const h = height * (0.72 + ((i * 37) % 30) / 100);
      const sway = Math.sin(this.t * 1.1 + x * 0.02 + i) * (3 + i * 0.6);
      const tipX = x + lean * 46 + sway;
      const tipY = base - h;
      g.fillStyle(i % 2 === 0 ? leaf : leafDark, 1);
      g.beginPath();
      g.moveTo(x - 3, base);
      g.lineTo(lerp(x, tipX, 0.55) - 2, lerp(base, tipY, 0.55));
      g.lineTo(tipX, tipY);
      g.lineTo(lerp(x, tipX, 0.55) + 2, lerp(base, tipY, 0.55));
      g.lineTo(x + 3, base);
      g.closePath();
      g.fillPath();
    });
    if (this.opts.flowerSpikes && maturity >= 1) {
      const sway = Math.sin(this.t * 0.8 + x) * 3;
      const top = base - height * 1.05;
      g.lineStyle(3, leafDark, 1);
      g.lineBetween(x, base, x + sway, top);
      g.fillStyle(0x6b4428, 1);
      g.fillRoundedRect(x + sway * 0.8 - 6, top + 14, 12, 38, 6);
      g.lineStyle(2, 0x8a6a3a, 1);
      g.lineBetween(x + sway, top + 14, x + sway, top - 2);
    }
  }
}

/** The sediment background with grains and organic flecks. Drawn once. */
export function drawSediment(scene: Phaser.Scene, seed = 3): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setDepth(3);
  const top = WORLD.soilTop;
  const h = WORLD.height - top;
  const layers = [PALETTE.sediment, 0x4a3a2e, 0x3a2f27, PALETTE.mud];
  layers.forEach((c, i) => {
    g.fillStyle(c, 1);
    g.fillRect(0, top + (i * h) / layers.length, WORLD.width, h / layers.length + 1);
  });
  // Soften layer boundaries.
  for (let i = 0; i < 30; i++) {
    g.fillStyle(PALETTE.mud, 0.06);
    g.fillRect(0, top + i * (h / 30), WORLD.width, h / 30);
  }
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 900; i++) {
    const x = rnd() * WORLD.width;
    const y = top + 4 + rnd() * (h - 4);
    const k = rnd();
    g.fillStyle(k < 0.5 ? 0x6f5a47 : k < 0.8 ? 0x2a221c : 0x8a735c, 0.35 + rnd() * 0.4);
    g.fillCircle(x, y, 0.8 + rnd() * 2.2);
  }
  return g;
}

/** Roots and rhizomes, with young tissue pale and mature tissue browner. */
export class RootRenderer {
  readonly g: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, depth = 6) {
    this.g = scene.add.graphics().setDepth(depth);
  }

  draw(plant: RootSystem, simHour: number, alpha: number, upTo = Infinity): void {
    const g = this.g;
    g.clear();
    if (alpha <= 0) return;
    // Draw rhizomes last so they sit on top of the roots that sprout from them.
    const order = [...plant.segments].sort((a, b) => rank(a) - rank(b));
    for (const seg of order) this.segment(seg, simHour, alpha, upTo);
  }

  private segment(seg: Segment, now: number, alpha: number, upTo: number): void {
    const g = this.g;
    const pts = seg.points.filter((p) => p.born <= upTo);
    if (pts.length < 2) return;
    const width = seg.organ === 'rhizome' ? 11 : seg.organ === 'adventitious' ? 4.5 : 1.8;
    const young = seg.organ === 'rhizome' ? 0xeadcbc : 0xf4ead2;
    const old = seg.organ === 'rhizome' ? 0x9c7b52 : seg.organ === 'lateral' ? 0xb79b72 : 0xa98a5f;
    // Dark outline for readability against mud.
    g.lineStyle(width + 2.5, 0x1b1511, alpha * 0.7);
    g.beginPath();
    g.moveTo(pts[0]!.x, pts[0]!.y);
    for (const p of pts) g.lineTo(p.x, p.y);
    g.strokePath();
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]!;
      const b = pts[i]!;
      const age = Math.min(1, (now - b.born) / 120);
      const w = seg.organ === 'adventitious' ? width * (0.65 + 0.35 * (1 - i / pts.length)) : width;
      g.lineStyle(w, mixColor(young, old, age), alpha);
      g.lineBetween(a.x, a.y, b.x, b.y);
    }
    const tip = pts[pts.length - 1]!;
    if (seg.organ === 'rhizome') {
      // Nodes with papery scale leaves — what makes a rhizome a stem, not a root.
      for (
        let i = 12;
        i < pts.length - 2;
        i += Math.round(SIM.rhizomeNodeSpacing / SIM.pointSpacing)
      ) {
        const p = pts[i]!;
        g.lineStyle(2, 0x6d5236, alpha);
        g.lineBetween(p.x, p.y - 6, p.x, p.y + 6);
        g.fillStyle(0xcdb389, alpha * 0.9);
        g.fillTriangle(p.x, p.y - 5, p.x + 9, p.y - 9, p.x + 4, p.y - 2);
      }
      if (seg.growing) {
        const prev = pts[pts.length - 2]!;
        const ang = Math.atan2(tip.y - prev.y, tip.x - prev.x);
        g.fillStyle(0xf6ecd4, alpha);
        g.fillTriangle(
          tip.x + Math.cos(ang) * 12,
          tip.y + Math.sin(ang) * 12,
          tip.x + Math.cos(ang + 1.9) * 6,
          tip.y + Math.sin(ang + 1.9) * 6,
          tip.x + Math.cos(ang - 1.9) * 6,
          tip.y + Math.sin(ang - 1.9) * 6,
        );
      }
    } else if (seg.organ === 'adventitious' && seg.growing) {
      g.fillStyle(0xfff8e6, alpha);
      g.fillCircle(tip.x, tip.y, 3.2);
      g.fillStyle(0xd9b98a, alpha);
      g.fillCircle(tip.x, tip.y + 1, 1.6);
    }
  }
}

function rank(s: Segment): number {
  return s.organ === 'lateral' ? 0 : s.organ === 'adventitious' ? 1 : 2;
}

/** The optode heatmap: one pixel per grid cell, scaled up with smoothing. */
export class Heatmap {
  readonly image: Phaser.GameObjects.Image;
  private readonly tex: Phaser.Textures.CanvasTexture;
  private readonly img: ImageData;

  constructor(
    scene: Phaser.Scene,
    private readonly field: OxygenField,
    key = 'heatmap',
    depth = 5,
  ) {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    this.tex = scene.textures.createCanvas(key, field.cols, field.rows)!;
    this.tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
    this.img = this.tex.context.createImageData(field.cols, field.rows);
    this.image = scene.add
      .image(field.originX, field.originY, key)
      .setOrigin(0)
      .setDisplaySize(field.cols * field.cell, field.rows * field.cell)
      .setDepth(depth);
  }

  /**
   * mode 'imaging': opaque optode sheet. 'combined': transparent where oxygen is low so the
   * sediment and roots show through. `values` overrides the live field (time-lapse playback).
   */
  draw(
    map: Colormap,
    mode: ViewMode,
    imaging: { left: number; right: number },
    values?: (i: number) => number,
  ): void {
    this.image.setVisible(mode !== 'natural');
    if (mode === 'natural') return;
    const { cols, rows, cell, originX } = this.field;
    const d = this.img.data;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const v = values ? values(i) : this.field.o[i]!;
        const x = originX + (c + 0.5) * cell;
        const inside = x >= imaging.left && x <= imaging.right;
        const [cr, cg, cb] = colorFor(map, inside ? v : 0);
        const k = i * 4;
        d[k] = cr;
        d[k + 1] = cg;
        d[k + 2] = cb;
        d[k + 3] = !inside
          ? mode === 'imaging'
            ? 255
            : 0
          : mode === 'imaging'
            ? 255
            : Math.round(255 * Math.min(0.92, Math.max(0, (v - 1.5) / 9)));
      }
    }
    this.tex.context.putImageData(this.img, 0, 0);
    this.tex.refresh();
  }
}

/** Imaging artefacts: hard-edged or speckled, never the smooth plume shape of real pools. */
export function drawDistractors(
  g: Phaser.GameObjects.Graphics,
  items: Distractor[],
  t: number,
  mode: ViewMode,
): void {
  g.clear();
  if (mode === 'natural') return;
  for (const d of items) {
    const fade = Math.min(1, d.age / 0.3, (d.life - d.age) / 0.5);
    if (d.kind === 'particle') {
      const s = d.size * 0.5;
      g.fillStyle(0xf8f4e8, fade * 0.9);
      g.fillRect(d.x - s / 2, d.y - s / 2, s, s);
      g.lineStyle(1.5, 0xffffff, fade * 0.8);
      g.lineBetween(d.x - s * 1.4, d.y, d.x + s * 1.4, d.y);
      g.lineBetween(d.x, d.y - s * 1.4, d.x, d.y + s * 1.4);
    } else if (d.kind === 'fluorescence') {
      const flick = 0.55 + 0.45 * Math.sin(t * 14 + d.id);
      g.fillStyle(0xd9e98a, fade * flick * 0.8);
      const s = d.size;
      g.fillTriangle(d.x, d.y - s, d.x + s * 0.7, d.y, d.x, d.y + s);
      g.fillTriangle(d.x, d.y - s, d.x - s * 0.7, d.y, d.x, d.y + s);
    } else {
      for (let k = 0; k < 14; k++) {
        const ox = Math.sin(d.id * 7.1 + k * 2.3) * d.size;
        const oy = Math.cos(d.id * 3.7 + k * 1.7) * d.size;
        g.fillStyle(0xe4f6f2, fade * (0.4 + ((k * 13 + Math.floor(t * 20)) % 6) / 10));
        g.fillRect(d.x + ox, d.y + oy, 2.5, 2.5);
      }
    }
  }
}

export function legendGradient(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  map: Colormap,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  const steps = 40;
  for (let i = 0; i < steps; i++) {
    const [r, gg, b] = colorFor(map, (i / (steps - 1)) * LEGEND_MAX);
    g.fillStyle((r << 16) | (gg << 8) | b, 1);
    g.fillRect(x + (i * w) / steps, y, w / steps + 1, h);
  }
  g.lineStyle(1, PALETTE.cream, 0.6);
  g.strokeRect(x, y, w, h);
  return g;
}

export function rametsFor(plant: RootSystem): Ramet[] {
  return plant.ramets;
}
