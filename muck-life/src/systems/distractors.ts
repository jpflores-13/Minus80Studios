import type { Rng } from '../utils/rng';

// Harmless imaging distractors. Real optode images carry artefacts too; telling them apart from
// genuine oxygen signals (they sit away from roots and read ~0% O2) is part of the skill.
// None of them is "bad" — they are just not oxygen.

export type DistractorKind = 'particle' | 'fluorescence' | 'noise';

export const DISTRACTOR_LABEL: Record<DistractorKind, string> = {
  particle: 'Sediment grain glint (not oxygen)',
  fluorescence: 'Non-oxygen fluorescence (not oxygen)',
  noise: 'Imaging noise (not oxygen)',
};

export interface Distractor {
  id: number;
  kind: DistractorKind;
  x: number;
  y: number;
  age: number;
  life: number;
  size: number;
}

export class DistractorField {
  readonly items: Distractor[] = [];
  private nextId = 1;
  private timer = 0;

  constructor(
    private readonly rng: Rng,
    /** Bounds to spawn inside. */
    private readonly bounds: { left: number; right: number; top: number; bottom: number },
    /** Mean spawns per game second. */
    public rate: number,
    /** Positions to keep away from (live oxygen regions), so artefacts never sit on a signal. */
    private readonly avoid: () => { x: number; y: number; radius: number }[],
  ) {}

  update(dt: number): void {
    for (const d of this.items) d.age += dt;
    for (let i = this.items.length - 1; i >= 0; i--)
      if (this.items[i]!.age >= this.items[i]!.life) this.items.splice(i, 1);
    if (this.rate <= 0) return;
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = (1 / this.rate) * this.rng.range(0.6, 1.4);
    this.spawn();
  }

  spawn(): Distractor | null {
    const b = this.bounds;
    const kinds: DistractorKind[] = ['particle', 'fluorescence', 'noise'];
    for (let attempt = 0; attempt < 8; attempt++) {
      const x = this.rng.range(b.left + 30, b.right - 30);
      const y = this.rng.range(b.top + 30, b.bottom - 30);
      const clear = this.avoid().every((a) => Math.hypot(a.x - x, a.y - y) > a.radius + 70);
      if (!clear) continue;
      const kind = kinds[Math.floor(this.rng.range(0, kinds.length))]!;
      const d: Distractor = {
        id: this.nextId++,
        kind,
        x,
        y,
        age: 0,
        life: this.rng.range(2.5, 5),
        size: kind === 'noise' ? this.rng.range(14, 24) : this.rng.range(10, 18),
      };
      this.items.push(d);
      return d;
    }
    return null;
  }

  hit(x: number, y: number, radius: number): Distractor | null {
    let best: Distractor | null = null;
    let bestD = Infinity;
    for (const d of this.items) {
      const dist = Math.hypot(d.x - x, d.y - y);
      if (dist <= radius && dist < bestD) {
        best = d;
        bestD = dist;
      }
    }
    return best;
  }
}
