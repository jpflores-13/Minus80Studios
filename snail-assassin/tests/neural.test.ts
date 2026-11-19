import { describe, expect, it } from 'vitest';
import { isImmobilized, stepNeural } from '../src/systems/neural';

const run = (lock: number, seconds: number) => {
  const s = { neural: 1, lock };
  let immobile = 0;
  for (let t = 0; t < seconds; t += 0.05) {
    stepNeural(s, 0.05);
    if (isImmobilized(s)) immobile += 0.05;
  }
  return { s, immobile };
};

describe('neural module', () => {
  it('stays within [0, 1] and recovers without a lock', () => {
    const { s } = run(0, 20);
    expect(s.neural).toBeGreaterThanOrEqual(0);
    expect(s.neural).toBeLessThan(0.05);
  });

  it('a motor lock greatly extends immobilization', () => {
    expect(run(1, 30).immobile).toBeGreaterThan(run(0, 30).immobile * 2.5);
  });
});
