import { describe, expect, it } from 'vitest';
import { TUNING } from '../src/config/tuning';
import { LEVELS } from '../src/levels';
import { advance, createSim, runToEnd, syncTraps } from '../src/systems/sim';
import { performance, stars, tally } from '../src/systems/score';
import { allFullDeployments } from './strategies';

const level = LEVELS[0]!;
const result = (dep: Record<string, 'bin' | 'trap'>, seed?: number) =>
  performance(tally(runToEnd(level, dep, seed).items));

describe('watershed simulation', () => {
  it('is reproducible for the same seed and deployment', () => {
    const dep = { 'bin-school': 'bin', 'trap-lower': 'trap' } as const;
    expect(tally(runToEnd(level, dep).items)).toEqual(tally(runToEnd(level, dep).items));
  });

  it('is independent of display frame rate', () => {
    const dep = { 'trap-middle': 'trap' } as const;
    const a = createSim(level, { ...dep });
    const b = createSim(level, { ...dep });
    while (!a.done) advance(a, 1 / 144);
    while (!b.done) advance(b, 1 / 20);
    expect(tally(a.items)).toEqual(tally(b.items));
  });

  it('with no equipment, everything generated eventually escapes or is still in transit', () => {
    const t = tally(runToEnd(level, {}).items);
    expect(t.prevented + t.intercepted).toBe(0);
    expect(t.escaped + t.mobile).toBe(t.potential);
    expect(t.potential).toBeGreaterThan(50);
  });

  it('bins prevent litter at their source only', () => {
    const items = runToEnd(level, { 'bin-store': 'bin' }).items;
    expect(items.filter((i) => i.state === 'prevented').every((i) => i.sourceId === 'store')).toBe(
      true,
    );
    expect(items.some((i) => i.state === 'prevented')).toBe(true);
  });

  it('traps fill up to capacity and then let litter bypass', () => {
    const s = runToEnd(
      { ...level, sources: level.sources.map((x) => ({ ...x, rate: x.rate * 4 })) },
      { 'trap-lower': 'trap' },
    );
    expect(s.traps[0]!.count).toBe(TUNING.trap.capacity);
    expect(tally(s.items).escaped).toBeGreaterThan(0);
  });

  it('traps only catch litter that passes them (upstream litter source matters)', () => {
    const items = runToEnd(level, { 'trap-upper': 'trap' }).items;
    const caught = items.filter((i) => i.state === 'intercepted');
    expect(caught.length).toBeGreaterThan(0);
    // Only the Corner Store drains in above the upper trap.
    expect(caught.every((i) => i.sourceId === 'store')).toBe(true);
  });

  it('equipment placed mid-flow starts working', () => {
    const dep: Record<string, 'bin' | 'trap'> = {};
    const s = createSim(level, dep);
    advance(s, 20);
    dep['trap-lower'] = 'trap';
    syncTraps(s);
    while (!s.done) advance(s, 0.5);
    expect(s.traps[0]!.count).toBeGreaterThan(0);
  });

  it('never counts an item twice: every item has one final state and a consistent history', () => {
    const items = runToEnd(level, { 'bin-school': 'bin', 'trap-lower': 'trap' }).items;
    const ids = new Set(items.map((i) => i.id));
    expect(ids.size).toBe(items.length);
    for (const i of items) expect(i.history.at(-1)?.to).toBe(i.state);
  });
});

describe('level 1 balance', () => {
  const deployments = allFullDeployments(level);

  it('has at least two distinct winning strategies', () => {
    const winners = deployments.filter((d) => result(d) >= level.target);
    expect(winners.length).toBeGreaterThanOrEqual(2);
  });

  it('placement matters: some full deployments still fail', () => {
    expect(deployments.some((d) => result(d) < level.target)).toBe(true);
  });

  it('three stars are achievable', () => {
    expect(deployments.some((d) => stars(result(d), level.stars) === 3)).toBe(true);
  });

  it('the best strategy wins robustly across random seeds', () => {
    const best = deployments.reduce((a, b) => (result(a) >= result(b) ? a : b));
    for (const seed of [1, 2, 3, 4, 5])
      expect(result(best, seed)).toBeGreaterThanOrEqual(level.target);
  });
});
