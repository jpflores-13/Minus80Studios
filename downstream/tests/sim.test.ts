import { describe, expect, it } from 'vitest';
import { TUNING } from '../src/config/tuning';
import { getLevel, LEVELS } from '../src/levels';
import { CLIMATE_ORDER } from '../src/levels/climates';
import type { LevelConfig } from '../src/levels/types';
import { performance, stars, tally } from '../src/systems/score';
import {
  advance,
  cleanup,
  createSim,
  runToEnd,
  syncEquipment,
  type Strategy,
} from '../src/systems/sim';
import { allStrategies } from './strategies';

const level1 = getLevel('level-1');
const perf = (level: LevelConfig, st: Strategy, seed?: number) =>
  performance(tally(runToEnd(level, st, seed).items));

describe('transport', () => {
  it('is reproducible for the same seed and strategy', () => {
    const dep = { 'bin-school': 'bin', 'trap-lower': 'trap' } as const;
    expect(tally(runToEnd(level1, dep).items)).toEqual(tally(runToEnd(level1, dep).items));
  });

  it('does not depend on frame rate', () => {
    const a = createSim(level1, { 'trap-middle': 'trap' });
    const b = createSim(level1, { 'trap-middle': 'trap' });
    while (!a.done) advance(a, 1 / 144);
    while (!b.done) advance(b, 1 / 20);
    expect(tally(a.items)).toEqual(tally(b.items));
  });

  it('with no equipment, nothing is prevented or caught, and rain carries most of it to the ocean', () => {
    const t = tally(runToEnd(level1, {}).items);
    expect(t.prevented + t.intercepted).toBe(0);
    expect(t.escaped + t.mobile).toBe(t.potential);
    expect(t.escaped).toBeGreaterThan(t.potential * 0.7);
  });

  it('bins only prevent litter from their own source', () => {
    const items = runToEnd(level1, { 'bin-store': 'bin' }).items;
    const prevented = items.filter((i) => i.state === 'prevented');
    expect(prevented.length).toBeGreaterThan(0);
    expect(prevented.every((i) => i.sourceId === 'store')).toBe(true);
  });

  it('traps only catch litter that passes them', () => {
    const caught = runToEnd(level1, { 'trap-upper': 'trap' }).items.filter(
      (i) => i.state === 'intercepted',
    );
    expect(caught.length).toBeGreaterThan(0);
    expect(caught.every((i) => i.sourceId === 'store')).toBe(true);
  });

  it('traps fill up and then let litter past', () => {
    const busy = { ...level1, sources: level1.sources.map((s) => ({ ...s, rate: s.rate * 4 })) };
    const s = runToEnd(busy, { 'trap-lower': 'trap' });
    expect(s.containers[0]!.count).toBe(TUNING.trap.capacity);
    expect(tally(s.items).escaped).toBeGreaterThan(0);
  });

  it('equipment placed mid-flow starts working', () => {
    const dep: Record<string, 'trap'> = {};
    const s = createSim(level1, dep);
    advance(s, 20);
    dep['trap-lower'] = 'trap';
    syncEquipment(s);
    while (!s.done) advance(s, 0.5);
    expect(s.containers[0]!.count).toBeGreaterThan(0);
  });

  it('every item ends in exactly one state with a matching history', () => {
    const items = runToEnd(getLevel('level-4'), allStrategies(getLevel('level-4'))[0]!).items;
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
    for (const i of items) expect(i.history.at(-1)?.to).toBe(i.state);
  });
});

describe('filters, booms, snags, weather, cleanup', () => {
  const level2 = getLevel('level-2');
  const level3 = getLevel('level-3');
  const level4 = getLevel('level-4');

  it('a storm-drain filter catches litter on land, only from its own source', () => {
    const caught = runToEnd(level2, { 'filter-lot': 'filter' }).items.filter(
      (i) => i.holder === 'filter-lot',
    );
    expect(caught.length).toBeGreaterThan(0);
    expect(caught.every((i) => i.sourceId === 'lot')).toBe(true);
  });

  it('a boom steers litter into a one-sided trap (direction matters)', () => {
    // Light load so the trap never fills; otherwise it would cap out either way.
    const quiet = { ...level3, sources: level3.sources.map((s) => ({ ...s, rate: s.rate * 0.3 })) };
    const toward = perf(quiet, {
      deployment: { 'trap-river-bank': 'trap', 'boom-river': 'boom' },
      orientations: { 'boom-river': -1 },
    });
    const away = perf(quiet, {
      deployment: { 'trap-river-bank': 'trap', 'boom-river': 'boom' },
      orientations: { 'boom-river': 1 },
    });
    const none = perf(quiet, { deployment: { 'trap-river-bank': 'trap' } });
    expect(toward).toBeGreaterThan(none);
    expect(toward).toBeGreaterThan(away);
  });

  it('banks snag litter, and rain washes some of it loose again', () => {
    const items = runToEnd(level4, {}).items;
    const snagged = items.filter((i) => i.history.some((h) => h.to === 'retained'));
    const freed = snagged.filter((i) => i.history.filter((h) => h.to === 'floating').length > 1);
    expect(snagged.length).toBeGreaterThan(0);
    expect(freed.length).toBeGreaterThan(0);
  });

  it('in dry weather litter stays on land and nothing new reaches the water', () => {
    const dry = { ...level1, weather: [] };
    const t = tally(runToEnd(dry, {}).items);
    expect(t.potential).toBeGreaterThan(50);
    expect(t.escaped).toBe(0);
    expect(t.mobile).toBe(t.potential);
  });

  it('rain washes litter off paved lots faster than off parks', () => {
    const shower = {
      ...level4,
      generationSeconds: 20,
      durationSeconds: 26,
      weather: [{ at: 20, duration: 6, intensity: 'moderate' as const }],
    };
    const washed = (src: string) => {
      const items = runToEnd(shower, {}).items.filter((i) => i.sourceId === src);
      return items.filter((i) => i.state !== 'onLand').length / items.length;
    };
    expect(washed('lot')).toBeGreaterThan(washed('park'));
  });

  it('cleanup empties a trap, restores its capacity, and never double counts', () => {
    const s = createSim(
      { ...level1, inventory: { ...level1.inventory, cleanup: 1 } },
      { 'trap-lower': 'trap' },
    );
    advance(s, 40);
    const before = performance(tally(s.items));
    const n = cleanup(s, { kind: 'container', slotId: 'trap-lower' });
    expect(n).toBeGreaterThan(0);
    expect(s.containers[0]!.count).toBe(0);
    expect(performance(tally(s.items))).toBeCloseTo(before);
  });

  it('cleanup of a snag turns retained litter into removed (credit only once)', () => {
    const s = createSim({ ...level4, inventory: { ...level4.inventory, cleanup: 1 } }, {});
    advance(s, 30);
    const retained = s.items.filter((i) => i.state === 'retained' && i.holder === 'log').length;
    expect(retained).toBeGreaterThan(0);
    expect(cleanup(s, { kind: 'hotspot', hotspotId: 'log' })).toBe(retained);
    expect(cleanup(s, { kind: 'hotspot', hotspotId: 'log' })).toBeNull();
  });
});

const BALANCE_CASES: [string, LevelConfig][] = [
  ...LEVELS.map((l): [string, LevelConfig] => [`level ${l.number}`, l]),
  // Year-long levels must work in every climate.
  ...CLIMATE_ORDER.filter((c) => c !== 'four-seasons').flatMap((c) =>
    LEVELS.filter((l) => l.year).map((l): [string, LevelConfig] => [
      `level ${l.number} (${c})`,
      getLevel(l.id, c),
    ]),
  ),
];

describe.each(BALANCE_CASES)('%s balance', (_name, level) => {
  const results = allStrategies(level).map((st) => ({ st, p: perf(level, st) }));
  const best = results.reduce((a, b) => (a.p >= b.p ? a : b));

  it('has at least two distinct winning strategies', () => {
    expect(results.filter((r) => r.p >= level.target).length).toBeGreaterThanOrEqual(2);
  });

  it('placement matters: some full deployments still fail', () => {
    expect(results.some((r) => r.p < level.target)).toBe(true);
  });

  it('three stars are achievable', () => {
    expect(stars(best.p, level.stars)).toBe(3);
  });

  it('the best strategy is robust to the random seed', () => {
    for (const seed of [1, 2, 3])
      expect(perf(level, best.st, seed)).toBeGreaterThanOrEqual(level.target - 0.03);
  });
});
