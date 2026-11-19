import { describe, expect, it } from 'vitest';
import { createLitter, transition, type LitterState } from '../src/systems/litter';
import { performance, stars, tally } from '../src/systems/score';

function itemIn(state: LitterState, id: number) {
  const item = createLitter(id, 's', 'bottle', 0);
  const path: Record<LitterState, LitterState[]> = {
    generated: [],
    prevented: ['prevented'],
    onLand: ['onLand'],
    floating: ['onLand', 'floating'],
    retained: ['onLand', 'floating', 'retained'],
    intercepted: ['onLand', 'floating', 'intercepted'],
    removed: ['onLand', 'floating', 'intercepted', 'removed'],
    escaped: ['onLand', 'floating', 'escaped'],
  };
  for (const s of path[state]) transition(item, s, 0);
  return item;
}

describe('scoring', () => {
  const items = (
    ['prevented', 'intercepted', 'removed', 'retained', 'floating', 'escaped'] as const
  ).map(itemIn);

  it('puts every item in exactly one bucket', () => {
    const t = tally(items);
    expect(t.prevented + t.intercepted + t.removed + t.retained + t.mobile + t.escaped).toBe(
      t.potential,
    );
  });

  it('credits prevented, intercepted, and removed only', () => {
    expect(performance(tally(items))).toBeCloseTo(3 / 6);
  });

  it('does not double count intercepted items that are later removed', () => {
    const t = tally([itemIn('removed', 1)]);
    expect(t.intercepted).toBe(0);
    expect(t.removed).toBe(1);
    expect(performance(t)).toBe(1);
  });

  it('awards stars by configurable thresholds', () => {
    const th = { one: 0.7, two: 0.85, three: 0.95 };
    expect([0.5, 0.7, 0.9, 0.96].map((p) => stars(p, th))).toEqual([0, 1, 2, 3]);
    expect(performance(tally([]))).toBe(0);
  });
});
