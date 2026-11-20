import { describe, expect, it } from 'vitest';
import {
  connectivity,
  createEngine,
  setDepots,
  stepEngine,
  type Engine,
  type EngineParams,
} from '../src/systems/extrusion';

const PARAMS: EngineParams = {
  speed: 4,
  lifetimeMean: 1e9,
  loadInterval: 1,
  bypassPerSecond: 0,
  fleet: 1,
};
const DT = 0.05;

function run(e: Engine, seconds: number): void {
  for (let t = 0; t < seconds; t += DT) stepEngine(e, DT);
}

function engine(params: Partial<EngineParams> = {}, bins = 40, seed = 1): Engine {
  return createEngine(bins, { ...PARAMS, ...params }, seed);
}

describe('loading and moving', () => {
  it('loads a machine at the depot with both ends together', () => {
    const e = engine();
    setDepots(e, [{ bin: 20 }]);
    const events = stepEngine(e, DT);
    expect(events).toContainEqual({ type: 'loaded', machineId: 1, bin: 20 });
    expect(e.machines).toHaveLength(1);
  });

  it('moves the two ends outward until they reach the edges of the road', () => {
    const e = engine();
    setDepots(e, [{ bin: 20 }]);
    run(e, 30);
    expect(e.machines[0]).toMatchObject({ left: 0, right: 39 });
  });

  it('never loads more machines than the fleet allows', () => {
    const e = engine({ fleet: 2, loadInterval: 0.1 });
    setDepots(e, [{ bin: 10 }, { bin: 30 }]);
    run(e, 20);
    expect(e.machines.length).toBeLessThanOrEqual(2);
  });

  it('releases machines when their lifetime runs out, then loads new ones', () => {
    const e = engine({ lifetimeMean: 2 });
    setDepots(e, [{ bin: 20 }]);
    run(e, 60);
    expect(e.released).toBeGreaterThan(5);
    expect(e.nextId).toBeGreaterThan(e.released);
  });
});

describe('checkpoints', () => {
  it('a → checkpoint stops ends moving left, and lets ends moving right through', () => {
    const e = engine();
    e.checkpoints = [
      { bin: 10, facing: 1, reliability: 1 },
      { bin: 30, facing: 1, reliability: 1 },
    ];
    setDepots(e, [{ bin: 20 }]);
    run(e, 30);
    expect(e.machines[0]?.left).toBe(10);
    expect(e.machines[0]?.right).toBe(39);
  });

  it('a ← checkpoint stops ends moving right, and lets ends moving left through', () => {
    const e = engine();
    e.checkpoints = [
      { bin: 10, facing: -1, reliability: 1 },
      { bin: 30, facing: -1, reliability: 1 },
    ];
    setDepots(e, [{ bin: 20 }]);
    run(e, 30);
    expect(e.machines[0]?.left).toBe(0);
    expect(e.machines[0]?.right).toBe(30);
  });

  it('inward-facing (convergent) checkpoints hold a shortcut between them', () => {
    const e = engine();
    e.checkpoints = [
      { bin: 12, facing: 1, reliability: 1 },
      { bin: 28, facing: -1, reliability: 1 },
    ];
    setDepots(e, [{ bin: 20 }]);
    run(e, 30);
    expect(e.machines[0]).toMatchObject({ left: 12, right: 28 });
    expect(connectivity(e, 12, 28)).toBeGreaterThan(0.5);
  });

  it('ends slip past a checkpoint sometimes when bypass is allowed', () => {
    const e = engine({ bypassPerSecond: 0.5 });
    e.checkpoints = [{ bin: 12, facing: 1, reliability: 1 }];
    setDepots(e, [{ bin: 20 }]);
    run(e, 40);
    expect(e.machines[0]?.left).toBeLessThan(12);
  });

  it('a checkpoint with zero reliability never stops anything', () => {
    const e = engine();
    e.checkpoints = [{ bin: 12, facing: 1, reliability: 0 }];
    setDepots(e, [{ bin: 20 }]);
    run(e, 30);
    expect(e.machines[0]?.left).toBe(0);
  });
});

describe('independent ends and collisions', () => {
  it('one end keeps moving while the other is held', () => {
    const e = engine();
    e.checkpoints = [{ bin: 18, facing: 1, reliability: 1 }];
    setDepots(e, [{ bin: 20 }]);
    run(e, 3);
    const m = e.machines[0]!;
    expect(m.left).toBe(18);
    expect(m.right).toBeGreaterThan(24);
  });

  it('ends of different machines never share an address or pass through each other', () => {
    const e = engine({ fleet: 3, loadInterval: 0.5, lifetimeMean: 8 }, 40, 7);
    setDepots(e, [{ bin: 8 }, { bin: 20 }, { bin: 32 }]);
    for (let t = 0; t < 120; t += DT) {
      stepEngine(e, DT);
      const ends = e.machines.flatMap((m) => (m.left === m.right ? [m.left] : [m.left, m.right]));
      expect(new Set(ends).size).toBe(ends.length);
      for (const m of e.machines) expect(m.left).toBeLessThanOrEqual(m.right);
    }
  });

  it('a machine stops when it runs into another machine', () => {
    const e = engine({ fleet: 2, loadInterval: 0.01 });
    setDepots(e, [{ bin: 10 }, { bin: 30 }]);
    run(e, 30);
    const [a, b] = [...e.machines].sort((x, y) => x.left - y.left);
    expect(a?.right).toBe((b?.left ?? 0) - 1);
  });
});

describe('reproducibility', () => {
  it('the same seed gives the same history; a different seed does not', () => {
    const history = (seed: number) => {
      const e = engine({ lifetimeMean: 3, fleet: 2 }, 40, seed);
      setDepots(e, [{ bin: 12 }, { bin: 28 }]);
      e.checkpoints = [{ bin: 5, facing: 1, reliability: 0.8 }];
      const log: string[] = [];
      for (let t = 0; t < 30; t += DT)
        for (const ev of stepEngine(e, DT)) log.push(JSON.stringify(ev));
      return log.join('|');
    };
    expect(history(42)).toBe(history(42));
    expect(history(42)).not.toBe(history(43));
  });
});

describe('connectivity map', () => {
  it('is symmetric and only counts joined addresses', () => {
    const e = engine({ lifetimeMean: 4, fleet: 2 }, 30, 3);
    setDepots(e, [{ bin: 15 }]);
    run(e, 60);
    for (let a = 0; a < 30; a++)
      for (let b = 0; b < 30; b++) expect(connectivity(e, a, b)).toBeCloseTo(connectivity(e, b, a));
    expect(connectivity(e, 15, 15)).toBe(0);
  });
});
