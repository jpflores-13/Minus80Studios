import { describe, expect, it } from 'vitest';
import { SCALE_ORDER } from '../src/content/organisms';
import { endlessRoundFor } from '../src/levels/oneDropRounds';

describe('endlessRoundFor', () => {
  it('cycles through every scale in order', () => {
    const scales = SCALE_ORDER.length;
    for (let lap = 0; lap < scales * 2; lap++) {
      const round = endlessRoundFor(lap);
      expect(round.name).toContain(SCALE_ORDER[lap % scales]!.toUpperCase());
    }
  });

  it('raises the objective and tightens the clock on later cycles, within sane bounds', () => {
    const lapOneScales = SCALE_ORDER.length;
    const early = endlessRoundFor(0);
    const later = endlessRoundFor(lapOneScales * 3);
    expect(later.objective.count).toBeGreaterThan(early.objective.count);
    expect(later.durationSeconds).toBeLessThanOrEqual(early.durationSeconds);
    expect(later.durationSeconds).toBeGreaterThanOrEqual(20);
    expect(later.objective.count).toBeLessThanOrEqual(16);
  });
});
