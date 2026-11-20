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

const [L1, L2, L3, L4, L5, L6, L7, L8] = LEVELS as LevelConfig[] as [
  LevelConfig,
  LevelConfig,
  LevelConfig,
  LevelConfig,
  LevelConfig,
  LevelConfig,
  LevelConfig,
  LevelConfig,
];
const plan = (cps: [number, 1 | -1][], depots: number[] = []): Layout => ({
  depots,
  checkpoints: cps.map(([b, f]) => cp(b, f)),
});
const none: Layout = { depots: [], checkpoints: [] };

describe('level data', () => {
  it.each(LEVELS)('$name is well formed', (level) => {
    const inRoad = (bin: number) => bin >= 0 && bin < level.bins;
    for (const b of level.buildings) expect(inRoad(b.bin)).toBe(true);
    for (const d of level.fixedDepots) expect(inRoad(d)).toBe(true);
    // every open customer has an open supplier of what it needs, and vice versa
    for (const r of ['bread', 'power', 'water'] as const) {
      const roles = new Set(
        level.buildings.filter((b) => b.active && b.resource === r).map((b) => b.role),
      );
      if (roles.size) expect([...roles].sort()).toEqual(['consumer', 'supplier']);
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

describe('balance: later levels', () => {
  it('Level 4: checkpoints facing the right way beat ones that join the wrong buildings', () => {
    expect(
      passRate(
        L4,
        plan(
          [
            [5, 1],
            [13, -1],
            [20, 1],
            [28, -1],
          ],
          [9, 24],
        ),
      ),
    ).toBeGreaterThanOrEqual(0.9);
    expect(
      passRate(
        L4,
        plan(
          [
            [5, 1],
            [13, 1],
            [20, -1],
            [28, -1],
          ],
          [16, 24],
        ),
      ),
    ).toBeLessThan(0.3);
    expect(passRate(L4, plan([], [9, 24]))).toBe(0);
  });

  it('Level 5: held shortcuts survive the trucks; an empty plan does not', () => {
    expect(
      passRate(
        L5,
        plan(
          [
            [4, 1],
            [14, -1],
            [21, 1],
            [32, -1],
          ],
          [12, 26],
        ),
      ),
    ).toBeGreaterThanOrEqual(0.85);
    expect(passRate(L5, plan([], [9, 27]))).toBeLessThan(0.1);
  });

  it('Level 6: long-lived machines are not the best policy', () => {
    const rate = (lifetime: number, loading: number, fleet: number) =>
      passRate(L6, { depots: [], checkpoints: [], policy: { lifetime, loading, fleet } });
    const best = Math.max(rate(0, 1, 2), rate(1, 1, 1));
    expect(best).toBeGreaterThanOrEqual(0.8);
    expect(rate(2, 0, 2)).toBeLessThan(best - 0.2);
    expect(rate(0, 0, 0)).toBeLessThan(0.1);
  });

  it('Level 6: every option costs something sensible and the budget allows several plans', () => {
    const p = L6.policies!;
    let affordable = 0;
    for (let a = 0; a < p.lifetime.length; a++)
      for (let b = 0; b < p.loading.length; b++)
        for (let c = 0; c < p.fleet.length; c++)
          if (p.lifetime[a]!.cost + p.loading[b]!.cost + p.fleet[c]!.cost <= p.budget) affordable++;
    expect(affordable).toBeGreaterThan(5);
  });

  it('Level 7: last week’s plan fails in the heat; looking after the Cooling Center fixes it', () => {
    expect(passRate(L7, L7.startLayout!)).toBe(0);
    const fixed = { depots: [29], checkpoints: [...L7.startLayout!.checkpoints, cp(26, 1)] };
    expect(passRate(L7, fixed)).toBeGreaterThanOrEqual(0.9);
  });

  it('Level 8: the old plan fails; a plan for the new town passes', () => {
    expect(passRate(L8, L8.startLayout!)).toBe(0);
    const fresh = plan(
      [
        [14, 1],
        [21, -1],
        [25, 1],
        [33, -1],
        [13, -1],
        [22, 1],
      ],
      [17],
    );
    expect(passRate(L8, fresh)).toBeGreaterThanOrEqual(0.9);
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
