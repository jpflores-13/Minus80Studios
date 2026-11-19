import { describe, expect, it } from 'vitest';
import { approach, clamp } from '../src/utils/math';
import { createRng } from '../src/utils/rng';

describe('utils', () => {
  it('clamps', () => {
    expect([clamp(-1, 0, 1), clamp(2, 0, 1), clamp(0.5, 0, 1)]).toEqual([0, 1, 0.5]);
  });
  it('approach does not overshoot', () => {
    expect(approach({ x: 0, y: 0 }, { x: 1, y: 0 }, 5)).toEqual({ x: 1, y: 0 });
  });
  it('seeded RNG is reproducible', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a.next(), a.next()]).toEqual([b.next(), b.next()]);
  });
});
