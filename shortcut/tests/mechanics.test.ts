import { describe, expect, it } from 'vitest';
import { TUNING } from '../src/config/tuning';
import { getLevel } from '../src/levels';
import { createCity, isOpen, stepCity, uptime } from '../src/systems/city';
import {
  contactMap,
  difference,
  expectedByDistance,
  similarity,
  toCsv,
} from '../src/systems/contacts';
import { createEngine, setDepots, stepEngine, type EngineParams } from '../src/systems/extrusion';
import { checkpoint, policyCost, simulate, startRun, stepRun } from '../src/systems/run';

const BASE: EngineParams = {
  speed: 4,
  lifetimeMean: 1e9,
  loadInterval: 1,
  bypassPerSecond: 0,
  fleet: 1,
};
const DT = 0.05;

describe('traffic', () => {
  it('trucks shove free machine ends along in the direction they drive', () => {
    const e = createEngine(40, { ...BASE, speed: 0, truckSpeed: 10, trafficPush: 1 }, 3);
    setDepots(e, [{ bin: 20 }]);
    stepEngine(e, DT);
    e.machines[0]!.left = 15;
    e.machines[0]!.right = 25;
    e.routes = [{ from: 39, to: 0, rate: 2 }];
    for (let t = 0; t < 10; t += DT) stepEngine(e, DT);
    expect(e.machines[0]!.right).toBeLessThan(25);
  });

  it('an end held at a reliable checkpoint resists the push', () => {
    const e = createEngine(40, { ...BASE, speed: 0, truckSpeed: 10, trafficPush: 1 }, 3);
    setDepots(e, [{ bin: 20 }]);
    stepEngine(e, DT);
    const m = e.machines[0]!;
    m.left = 15;
    m.right = 25;
    m.rightStalled = true;
    e.checkpoints = [{ bin: 25, facing: -1, reliability: 1 }];
    e.routes = [
      { from: 39, to: 30, rate: 2 },
      { from: 26, to: 0, rate: 0 },
    ];
    // trucks from the right stop at 30; send one through the held end by hand
    e.vehicles.push({ id: 999, pos: 26, dir: -1, route: 1 });
    for (let t = 0; t < 2; t += DT) stepEngine(e, DT);
    expect(m.right).toBe(25);
  });

  it('with no push chance, trucks drive past and change nothing', () => {
    const e = createEngine(40, { ...BASE, speed: 0, truckSpeed: 10, trafficPush: 0 }, 3);
    setDepots(e, [{ bin: 20 }]);
    stepEngine(e, DT);
    e.machines[0]!.left = 15;
    e.machines[0]!.right = 25;
    e.routes = [{ from: 39, to: 0, rate: 2 }];
    for (let t = 0; t < 10; t += DT) stepEngine(e, DT);
    expect(e.machines[0]).toMatchObject({ left: 15, right: 25 });
  });

  it('trucks leave the road at the end of their route', () => {
    const e = createEngine(40, { ...BASE, truckSpeed: 10 }, 3);
    e.routes = [{ from: 30, to: 20, rate: 5 }];
    for (let t = 0; t < 10; t += DT) stepEngine(e, DT);
    for (const v of e.vehicles) expect(v.pos).toBeGreaterThanOrEqual(20);
  });
});

describe('weather, opening times and policies', () => {
  it('a heat advisory makes checkpoints leakier and customers hungrier from its start time', () => {
    const level = getLevel('level-7');
    const run = startRun(level, level.startLayout!, 1);
    const before = run.engine.checkpoints.map((c) => c.reliability);
    while (run.engine.time < 19) stepRun(run, DT);
    expect(run.weatherStarted).toBe(false);
    while (run.engine.time < 21) stepRun(run, DT);
    expect(run.weatherStarted).toBe(true);
    run.engine.checkpoints.forEach((c, i) =>
      expect(c.reliability).toBeCloseTo((before[i] ?? 0) * 0.8),
    );
    expect(run.cityParams.runningWindow).toBe(2);
  });

  it('a building that opens later only counts from when it opens', () => {
    const level = getLevel('level-7');
    const cooling = level.buildings.find((b) => b.id === 'cooling')!;
    expect(isOpen(cooling, 10)).toBe(false);
    expect(isOpen(cooling, 25)).toBe(true);
    const run = simulate(level, level.startLayout!, 2);
    expect(run.city.activeTime.cooling).toBeCloseTo(40, 0);
  });

  it('closed buildings never get deliveries or count toward the goal', () => {
    const level = getLevel('level-8');
    const city = createCity(level);
    const e = createEngine(level.bins, TUNING.engine, 1);
    e.machines = [
      {
        id: 1,
        left: 3,
        right: 29,
        loadedAt: 0,
        age: 0,
        lifetime: 1e9,
        leftStalled: false,
        rightStalled: false,
      },
    ];
    for (let t = 0; t < 20; t += DT) stepCity(city, level, e, TUNING.city, DT);
    expect(city.deliveries).toBe(0);
    expect(uptime(city, 'factory')).toBe(0);
  });

  it('policy choices set the machine settings and add up their cost', () => {
    const level = getLevel('level-6');
    const run = startRun(
      level,
      { depots: [], checkpoints: [], policy: { lifetime: 2, loading: 1, fleet: 2 } },
      1,
    );
    expect(run.engine.params.lifetimeMean).toBe(60);
    expect(run.engine.params.loadInterval).toBe(1);
    expect(run.engine.params.fleet).toBe(3);
    expect(policyCost(level, { lifetime: 2, loading: 1, fleet: 2 })).toBe(6);
  });
});

describe('connectivity maps', () => {
  const run = () =>
    simulate(
      getLevel('level-2'),
      { depots: [], checkpoints: [checkpoint(6, 1), checkpoint(25, -1)] },
      5,
    );

  it('are symmetric, with nothing on the diagonal', () => {
    const m = contactMap(run().engine);
    for (let a = 0; a < m.n; a++) {
      expect(m.values[a * m.n + a]).toBe(0);
      for (let b = 0; b < m.n; b++)
        expect(m.values[a * m.n + b]).toBeCloseTo(m.values[b * m.n + a] ?? 0);
    }
  });

  it('fall off with distance along the road', () => {
    const free = simulate(getLevel('level-2'), { depots: [], checkpoints: [] }, 5);
    const exp = expectedByDistance(contactMap(free.engine));
    expect(exp[1]).toBeGreaterThan(exp[5] ?? 0);
    expect(exp[5]).toBeGreaterThan(exp[20] ?? 0);
  });

  it('show a held shortcut as a bright dot between its anchors', () => {
    const m = contactMap(run().engine);
    const anchor = m.values[6 * m.n + 25] ?? 0;
    const nearby = m.values[2 * m.n + 29] ?? 0;
    expect(anchor).toBeGreaterThan(nearby * 2);
  });

  it('similarity is 100 for a map against itself and lower for a different city', () => {
    const a = contactMap(run().engine);
    expect(similarity(a, a)).toBe(100);
    const other = contactMap(
      simulate(getLevel('level-2'), { depots: [], checkpoints: [] }, 5).engine,
    );
    expect(similarity(a, other)).toBeLessThan(90);
  });

  it('difference maps and CSV export have the right shape', () => {
    const a = contactMap(run().engine);
    expect(difference(a, a).values.every((v) => v === 0)).toBe(true);
    const csv = toCsv(a).split('\n');
    expect(csv).toHaveLength(a.n + 1);
    expect(csv[1]?.split(',')).toHaveLength(a.n + 1);
  });
});
