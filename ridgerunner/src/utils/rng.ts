/**
 * Small seeded random-number generator (mulberry32). The same seed gives the same landscape,
 * which makes Beyond the Divide's "seeded challenges" and tests reproducible.
 */
export interface Rng {
  next(): number;
  range(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
}

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const range = (min: number, max: number) => min + (max - min) * next();
  const pick = <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)] as T;
  return { next, range, pick };
}
