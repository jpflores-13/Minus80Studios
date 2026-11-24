import { SIM } from '../config/tuning';
import { dielShape } from './daynight';
import { releaseFactor, type RootSystem } from './plant';

// A low-resolution spatial model of oxygen *concentration in the sediment* (% air saturation),
// which is what a planar optode reports. It is not a count of molecules leaving a root.
//
//   dO/dt = release(tissue nearby) × (1 + small diel term)   — radial oxygen loss into sediment
//           × (1 − O / O_internal)                          — leak slows as the gradient shrinks
//           − k·O − baseline                                  — microbial + abiotic consumption
//           + D·∇²O                                           — limited diffusion
//
// Explicit Euler with small steps. Qualitative only: not a calibrated or predictive model.

export interface FieldOptions {
  dielEnabled: boolean;
  dielAmplitude: number;
  consumption: number;
  baselineDemand: number;
}

export const DEFAULT_FIELD: FieldOptions = {
  dielEnabled: true,
  dielAmplitude: SIM.dielAmplitude,
  consumption: SIM.consumptionPerHour,
  baselineDemand: SIM.baselineDemandPerHour,
};

export class OxygenField {
  readonly cols: number;
  readonly rows: number;
  readonly cell = SIM.cellPx;
  /** % saturation per cell. */
  o: Float32Array;
  /** Source term per cell (% per sim hour), rebuilt every step. */
  readonly src: Float32Array;
  private readonly tmp: Float32Array;

  constructor(
    readonly originX: number,
    readonly originY: number,
    width: number,
    height: number,
    public opts: FieldOptions = DEFAULT_FIELD,
  ) {
    this.cols = Math.ceil(width / this.cell);
    this.rows = Math.ceil(height / this.cell);
    this.o = new Float32Array(this.cols * this.rows);
    this.src = new Float32Array(this.cols * this.rows);
    this.tmp = new Float32Array(this.cols * this.rows);
  }

  index(col: number, row: number): number {
    return row * this.cols + col;
  }

  cellOf(x: number, y: number): { col: number; row: number } | null {
    const col = Math.floor((x - this.originX) / this.cell);
    const row = Math.floor((y - this.originY) / this.cell);
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return null;
    return { col, row };
  }

  cellCenter(col: number, row: number): { x: number; y: number } {
    return {
      x: this.originX + (col + 0.5) * this.cell,
      y: this.originY + (row + 0.5) * this.cell,
    };
  }

  /** Optode-style reading at a world position (bilinear), % saturation. */
  sample(x: number, y: number): number {
    const fx = (x - this.originX) / this.cell - 0.5;
    const fy = (y - this.originY) / this.cell - 0.5;
    const c0 = Math.floor(fx);
    const r0 = Math.floor(fy);
    const tx = fx - c0;
    const ty = fy - r0;
    const at = (c: number, r: number) => {
      const cc = Math.min(this.cols - 1, Math.max(0, c));
      const rr = Math.min(this.rows - 1, Math.max(0, r));
      return this.o[this.index(cc, rr)]!;
    };
    const a = at(c0, r0) * (1 - tx) + at(c0 + 1, r0) * tx;
    const b = at(c0, r0 + 1) * (1 - tx) + at(c0 + 1, r0 + 1) * tx;
    return a * (1 - ty) + b * ty;
  }

  max(): number {
    let m = 0;
    for (const v of this.o) if (v > m) m = v;
    return m;
  }

  /** Release multiplier from the time of day (1 when diel is off). */
  dielFactor(simHour: number): number {
    return this.opts.dielEnabled ? 1 + this.opts.dielAmplitude * dielShape(simHour) : 1;
  }

  /** Rebuilds the source term from every tissue point's age-dependent release. */
  buildSources(plant: RootSystem, now: number): void {
    this.src.fill(0);
    const diel = this.dielFactor(now);
    for (const seg of plant.segments) {
      for (const p of seg.points) {
        const f = releaseFactor(seg.organ, now - p.born);
        if (f <= 0) continue;
        this.splat(p.x, p.y, f * SIM.releasePerPoint * diel);
      }
    }
  }

  /** Bilinear deposit of a source into the four nearest cells. */
  private splat(x: number, y: number, amount: number): void {
    const fx = (x - this.originX) / this.cell - 0.5;
    const fy = (y - this.originY) / this.cell - 0.5;
    const c0 = Math.floor(fx);
    const r0 = Math.floor(fy);
    const tx = fx - c0;
    const ty = fy - r0;
    const put = (c: number, r: number, w: number) => {
      if (c < 0 || r < 0 || c >= this.cols || r >= this.rows || w <= 0) return;
      const i = this.index(c, r);
      this.src[i] = this.src[i]! + amount * w;
    };
    put(c0, r0, (1 - tx) * (1 - ty));
    put(c0 + 1, r0, tx * (1 - ty));
    put(c0, r0 + 1, (1 - tx) * ty);
    put(c0 + 1, r0 + 1, tx * ty);
  }

  /** Integrates the field forward by dt sim hours (sources must already be built). */
  integrate(dt: number): void {
    const { cols, rows, o, src, tmp } = this;
    const D = SIM.diffusion;
    const k = this.opts.consumption;
    const base = this.opts.baselineDemand;
    const cap = SIM.internalO2Pct;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const v = o[i]!;
        // No-flux edges: a missing neighbour mirrors the cell itself.
        const l = c > 0 ? o[i - 1]! : v;
        const rt = c < cols - 1 ? o[i + 1]! : v;
        const u = r > 0 ? o[i - cols]! : v;
        const d = r < rows - 1 ? o[i + cols]! : v;
        const lap = l + rt + u + d - 4 * v;
        // Gradient-limited release S·(1 − O/cap) and first-order consumption k·O are treated
        // semi-implicitly (stable for any source strength); diffusion and baseline explicitly.
        const S = src[i]!;
        const next = (v + dt * (S - base + D * lap)) / (1 + dt * (k + S / cap));
        tmp[i] = next < 0 ? 0 : next > 100 ? 100 : next;
      }
    }
    o.set(tmp);
  }

  /** One coupled step: sources from the plant at `now`, then integration. */
  step(plant: RootSystem, now: number, dt: number): void {
    this.buildSources(plant, now);
    this.integrate(dt);
  }

  /** Quantized copy (0–255 over 0–50%) for time-lapse snapshots. */
  snapshot(): Uint8Array {
    const out = new Uint8Array(this.o.length);
    for (let i = 0; i < this.o.length; i++)
      out[i] = Math.min(255, Math.round((this.o[i]! / 50) * 255));
    return out;
  }
}

export function snapshotValue(snap: Uint8Array, i: number): number {
  return ((snap[i] ?? 0) / 255) * 50;
}
