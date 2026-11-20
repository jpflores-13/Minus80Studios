import { describe, expect, it } from 'vitest';
import {
  BLUEPRINT_TOWN,
  BLUEPRINTS,
  PLAYER_SEED,
  SECONDS,
  TARGET_SEED,
} from '../src/levels/blueprints';
import { contactMap, similarity } from '../src/systems/contacts';
import { checkpoint as cp, measure, type Layout, type Overrides } from '../src/systems/run';

const map = (layout: Layout, o: Overrides, seed: number) =>
  contactMap(measure(BLUEPRINT_TOWN, layout, seed, SECONDS, o).engine);

describe('Blueprint challenges', () => {
  it.each(BLUEPRINTS)(
    '$name: the hidden city matches itself on a new seed, the start does not',
    (bp) => {
      const target = map(bp.hidden.layout, bp.hidden.overrides, TARGET_SEED);
      expect(
        similarity(target, map(bp.hidden.layout, bp.hidden.overrides, PLAYER_SEED)),
      ).toBeGreaterThanOrEqual(bp.pass);
      expect(
        similarity(target, map(bp.start.layout, bp.start.overrides, PLAYER_SEED)),
      ).toBeLessThan(bp.pass);
    },
  );

  it('Same Picture: a different setting from the hidden one also solves it', () => {
    const bp = BLUEPRINTS.find((b) => b.id === 'same-picture')!;
    const target = map(bp.hidden.layout, bp.hidden.overrides, TARGET_SEED);
    const alternative: Overrides = { engine: { lifetimeMean: 30, fleet: 4 }, reliability: 0.9 };
    expect(
      similarity(target, map(bp.hidden.layout, alternative, PLAYER_SEED)),
    ).toBeGreaterThanOrEqual(bp.pass);
  });

  it('One Loop: a nearby but wrong layout scores lower than the right one', () => {
    const bp = BLUEPRINTS[0]!;
    const target = map(bp.hidden.layout, {}, TARGET_SEED);
    const off = { depots: [15], checkpoints: [cp(4, 1), cp(26, -1)] };
    expect(similarity(target, map(off, {}, PLAYER_SEED))).toBeLessThan(
      similarity(target, map(bp.hidden.layout, {}, PLAYER_SEED)),
    );
  });
});
