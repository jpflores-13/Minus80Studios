import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/levels';
import {
  canPlace,
  move,
  place,
  remaining,
  remove,
  type Deployment,
} from '../src/systems/equipment';

const level = LEVELS[0]!;

describe('equipment placement', () => {
  it('respects inventory limits', () => {
    const dep: Deployment = {};
    const bins = level.slots.filter((s) => s.kind === 'bin');
    for (const s of bins.slice(0, level.inventory.bin))
      expect(place(level, dep, 'deploy', s.id, 'bin').ok).toBe(true);
    expect(remaining(level, dep, 'bin')).toBe(0);
    expect(place(level, dep, 'deploy', bins[level.inventory.bin]!.id, 'bin')).toEqual({
      ok: false,
      reason: 'none-left',
    });
  });

  it('validates slot type and occupancy', () => {
    const dep: Deployment = {};
    expect(canPlace(level, dep, 'deploy', 'trap-lower', 'bin')).toEqual({
      ok: false,
      reason: 'wrong-kind',
    });
    place(level, dep, 'deploy', 'trap-lower', 'trap');
    expect(canPlace(level, dep, 'deploy', 'trap-lower', 'trap').ok).toBe(false);
    expect(canPlace(level, dep, 'deploy', 'nowhere', 'trap')).toEqual({
      ok: false,
      reason: 'no-slot',
    });
  });

  it('allows repositioning during deployment', () => {
    const dep: Deployment = { 'trap-upper': 'trap' };
    expect(move(level, dep, 'deploy', 'trap-upper', 'trap-lower').ok).toBe(true);
    expect(dep).toEqual({ 'trap-lower': 'trap' });
  });

  it('locks placed equipment once the flow is released, but remaining items can still be placed', () => {
    const dep: Deployment = { 'trap-upper': 'trap' };
    expect(remove(dep, 'flow', 'trap-upper')).toBe(false);
    expect(move(level, dep, 'flow', 'trap-upper', 'trap-lower').ok).toBe(false);
    expect(dep['trap-upper']).toBe('trap');
    expect(place(level, dep, 'flow', 'bin-school', 'bin').ok).toBe(true);
  });

  it('forbids placement while investigating or after the level ends', () => {
    expect(canPlace(level, {}, 'investigate', 'bin-school', 'bin').ok).toBe(false);
    expect(canPlace(level, {}, 'results', 'bin-school', 'bin').ok).toBe(false);
  });
});
