import { describe, expect, it } from 'vitest';
import { TUNING } from '../src/config/tuning';
import { shouldFlee, stepAwareness } from '../src/systems/escape';

const settle = (dist: number, motion: number, responsiveness = 1) => {
  let a = 0;
  for (let i = 0; i < 400; i++) a = stepAwareness(a, dist, motion, responsiveness, 1, 0.05);
  return a;
};

describe('escape module', () => {
  it('ignores a snail outside the detection radius', () => {
    expect(settle(TUNING.escape.detectionRadius + 10, 1)).toBe(0);
  });

  it('notices a nearby moving snail more than a still one', () => {
    expect(settle(120, 1)).toBeGreaterThan(settle(120, 0));
    expect(settle(120, 1)).toBeGreaterThan(TUNING.escape.fleeAbove);
    expect(settle(120, 0)).toBeLessThan(TUNING.escape.fleeAbove);
  });

  it('reduced responsiveness dampens awareness', () => {
    expect(settle(40, 1, 0.2)).toBeLessThan(settle(40, 1, 1));
  });

  it('stays bounded and decays when the snail leaves', () => {
    let a = 1;
    for (let i = 0; i < 400; i++) a = stepAwareness(a, 999, 1, 1, 1, 0.05);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(0.01);
  });

  it('flees with hysteresis', () => {
    expect(shouldFlee(0.5, false)).toBe(false);
    expect(shouldFlee(0.5, true)).toBe(true);
    expect(shouldFlee(0.1, true)).toBe(false);
  });
});
