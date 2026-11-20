import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/levels';
import type { LevelConfig } from '../src/levels/types';
import { checkpoint as cp, simulate, type Layout } from '../src/systems/run';
import { scoreRun } from '../src/systems/score';

const SEEDS = 60;

function passRate(level: LevelConfig, layout: Layout): number {
  let passed = 0;
  for (let seed = 1; seed <= SEEDS; seed++)
    if (scoreRun(level, simulate(level, layout, seed).city).passed) passed++;
  return passed / SEEDS;
}

const [L1, L2, L3] = LEVELS as [LevelConfig, LevelConfig, LevelConfig];
const none: Layout = { depots: [], checkpoints: [] };

describe('level data', () => {
  it.each(LEVELS)('$name is well formed', (level) => {
    const inRoad = (bin: number) => bin >= 0 && bin < level.bins;
    for (const b of level.buildings) expect(inRoad(b.bin)).toBe(true);
    for (const d of level.fixedDepots) expect(inRoad(d)).toBe(true);
    for (const r of ['bread', 'power'] as const) {
      const roles = level.buildings.filter((b) => b.resource === r).map((b) => b.role);
      if (roles.length) expect(roles.sort()).toEqual(['consumer', 'supplier']);
    }
    expect(level.fixedDepots.length + level.tools.depots).toBeGreaterThan(0);
    const g = level.goal;
    expect(g.one).toBeLessThan(g.two);
    expect(g.two).toBeLessThan(g.three);
    for (const d of level.districts) expect(inRoad(d.from) && inRoad(d.to)).toBe(true);
  });
});

describe('balance: good plans pass, poor plans do not', () => {
  it('Level 1: a central depot passes reliably and beats one at the end of the road', () => {
    expect(passRate(L1, { depots: [16], checkpoints: [] })).toBeGreaterThanOrEqual(0.95);
    const mean = (d: number) => {
      let total = 0;
      for (let s = 1; s <= SEEDS; s++)
        total += simulate(L1, { depots: [d], checkpoints: [] }, s).city.deliveries;
      return total / SEEDS;
    };
    expect(mean(16)).toBeGreaterThan(mean(3) * 1.4);
  });

  it('Level 2: inward-facing checkpoints at the buildings pass; anything else fails', () => {
    expect(
      passRate(L2, { depots: [], checkpoints: [cp(6, 1), cp(25, -1)] }),
    ).toBeGreaterThanOrEqual(0.9);
    expect(passRate(L2, none)).toBe(0);
    expect(passRate(L2, { depots: [], checkpoints: [cp(6, -1), cp(25, 1)] })).toBe(0);
    expect(passRate(L2, { depots: [], checkpoints: [cp(6, 1), cp(25, 1)] })).toBeLessThan(0.1);
  });

  it('Level 3: a district for each pair, with the border guarded, passes; nothing at all fails', () => {
    const home = [cp(3, 1), cp(14, -1), cp(21, 1), cp(32, -1)];
    expect(
      passRate(L3, { depots: [], checkpoints: [...home, cp(17, -1), cp(18, 1)] }),
    ).toBeGreaterThanOrEqual(0.95);
    expect(passRate(L3, { depots: [], checkpoints: home })).toBeGreaterThanOrEqual(0.8);
    expect(passRate(L3, none)).toBe(0);
  });
});

describe('scoring', () => {
  it('fails a level with too many mix-ups however good the service', () => {
    const run = simulate(L3, none, 1);
    run.city.runningTime = { cafe: 60, factory: 60 };
    const score = scoreRun(L3, run.city);
    expect(score.value).toBeCloseTo(1);
    expect(score.tooManyMixups).toBe(true);
    expect(score.stars).toBe(0);
  });
});
