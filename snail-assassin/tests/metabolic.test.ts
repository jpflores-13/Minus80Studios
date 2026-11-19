import { describe, expect, it } from 'vitest';
import { TUNING } from '../src/config/tuning';
import { stepMetabolic, swimPerformance, type MetabolicState } from '../src/systems/metabolic';

const run = (s: MetabolicState, seconds: number) => {
  for (let t = 0; t < seconds; t += 0.05) stepMetabolic(s, 0.05);
  return s;
};

describe('metabolic module', () => {
  it('keeps all state variables within [0, 1]', () => {
    const s = run({ glucose: 1, insulin: 1, override: 1 }, 60);
    for (const v of [s.glucose, s.insulin, s.override]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('insulin-like exposure lowers glucose', () => {
    expect(run({ glucose: 1, insulin: 1, override: 0 }, 3).glucose).toBeLessThan(0.7);
  });

  it('glucose recovers once exposure fades', () => {
    expect(run({ glucose: 0.2, insulin: 0, override: 0 }, 20).glucose).toBeGreaterThan(0.85);
  });

  it('override alone has negligible effect on a healthy fish', () => {
    expect(run({ glucose: 1, insulin: 0, override: 1 }, 10).glucose).toBeCloseTo(1, 5);
  });

  it('override + insulin makes fish catchable when insulin alone cannot (synergy)', () => {
    const catchableSeconds = (override: number) => {
      const s = { glucose: 1, insulin: 1, override };
      let t = 0;
      for (let i = 0; i < 1200; i++) {
        // Sustained exposure for the first 6 s, like a fish lingering in a cloud.
        if (i < 120) {
          s.insulin = 1;
          s.override = override;
        }
        stepMetabolic(s, 0.05);
        if (1 - s.glucose >= TUNING.capture.vulnerabilityThreshold) t += 0.05;
      }
      return t;
    };
    expect(catchableSeconds(0)).toBe(0);
    expect(catchableSeconds(1)).toBeGreaterThan(2);
  });

  it('swim performance falls with glucose but never reaches zero', () => {
    expect(swimPerformance(1)).toBeCloseTo(1);
    expect(swimPerformance(0)).toBeCloseTo(TUNING.metabolic.minPerformance);
    expect(swimPerformance(0.3)).toBeLessThan(swimPerformance(0.7));
  });
});
