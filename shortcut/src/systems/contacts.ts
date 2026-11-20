import type { Engine } from './extrusion';

// Connectivity maps, from the simulation. A map is an n×n matrix (row-major Float64Array) of the
// fraction of time each pair of addresses was joined by a shortcut. This is a model quantity:
// contact propensity in a simplified simulation, not a measured Hi-C map.

export interface ContactMap {
  n: number;
  values: Float64Array;
}

export function contactMap(e: Engine): ContactMap {
  const n = e.bins;
  const values = new Float64Array(n * n);
  if (e.time > 0) for (let i = 0; i < n * n; i++) values[i] = (e.contacts[i] ?? 0) / e.time;
  return { n, values };
}

export function at(m: ContactMap, a: number, b: number): number {
  return m.values[a * m.n + b] ?? 0;
}

/** Average connectivity at each separation along the road (the distance-decay baseline). */
export function expectedByDistance(m: ContactMap): Float64Array {
  const exp = new Float64Array(m.n);
  for (let d = 1; d < m.n; d++) {
    let sum = 0;
    for (let i = 0; i + d < m.n; i++) sum += at(m, i, i + d);
    exp[d] = sum / (m.n - d);
  }
  return exp;
}

/** Each entry divided by the average at its separation, so patterns aren't swamped by distance. */
export function observedOverExpected(m: ContactMap): ContactMap {
  const exp = expectedByDistance(m);
  const values = new Float64Array(m.n * m.n);
  for (let a = 0; a < m.n; a++)
    for (let b = 0; b < m.n; b++) {
      const e = exp[Math.abs(a - b)] ?? 0;
      values[a * m.n + b] = a !== b && e > 0 ? at(m, a, b) / e : 0;
    }
  return { n: m.n, values };
}

/**
 * How alike two maps are, 0-100. Both maps are first divided by their own distance baselines
 * (observed / expected), then compared with a Pearson correlation over every pair of addresses
 * at least `minSeparation` apart. Negative correlations count as 0. This rewards matching the
 * pattern (where loops and domains are), not just the overall amount of contact.
 */
export function similarity(a: ContactMap, b: ContactMap, minSeparation = 2): number {
  if (a.n !== b.n) throw new Error('maps must be the same size');
  const oa = observedOverExpected(a);
  const ob = observedOverExpected(b);
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < a.n; i++)
    for (let j = i + minSeparation; j < a.n; j++) {
      xs.push(at(oa, i, j));
      ys.push(at(ob, i, j));
    }
  const r = pearson(xs, ys);
  return Math.round(Math.max(0, r) * 100);
}

export function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n === 0) return 0;
  const mx = xs.reduce((s, x) => s + x, 0) / n;
  const my = ys.reduce((s, y) => s + y, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = (xs[i] ?? 0) - mx;
    const dy = (ys[i] ?? 0) - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : 0;
}

/** Difference map (b − a), for showing where a current map over- or under-shoots a target. */
export function difference(a: ContactMap, b: ContactMap): ContactMap {
  const values = new Float64Array(a.n * a.n);
  for (let i = 0; i < values.length; i++) values[i] = (b.values[i] ?? 0) - (a.values[i] ?? 0);
  return { n: a.n, values };
}

/** Shortcut lengths as fractions of machine-time (sums to 1), realized or potential. */
export function lengthDistribution(
  e: Engine,
  kind: 'realized' | 'potential' = 'realized',
): number[] {
  const src = kind === 'realized' ? e.lengthTime : e.potentialTime;
  const total = src.reduce((s, x) => s + x, 0);
  return Array.from(src, (x) => (total > 0 ? x / total : 0));
}

/** The map as CSV text: a header row of addresses, then one row per address. */
export function toCsv(m: ContactMap): string {
  const header = ['address', ...Array.from({ length: m.n }, (_, i) => String(i))].join(',');
  const rows = Array.from({ length: m.n }, (_, a) =>
    [String(a), ...Array.from({ length: m.n }, (_, b) => at(m, a, b).toFixed(5))].join(','),
  );
  return [header, ...rows].join('\n');
}
