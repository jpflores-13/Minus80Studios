import { describe, expect, it } from 'vitest';
import { SIM } from '../src/config/tuning';
import { DEFAULT_GROWTH, releaseFactor, RootSystem } from '../src/systems/plant';

const grow = (plant: RootSystem, hours: number, from = 0) => {
  for (let t = from; t < from + hours; t += SIM.stepHours) plant.step(SIM.stepHours, t);
};

describe('root growth', () => {
  it('adventitious roots grow downward and lengthen over time', () => {
    const p = new RootSystem(1, { ...DEFAULT_GROWTH, pulses: false, lateralsEnabled: false });
    const r = p.addSegment('adventitious', 600, 220, Math.PI / 2, 0);
    grow(p, 30);
    const tip = p.tip(r);
    expect(r.length).toBeGreaterThan(40);
    expect(tip.y).toBeGreaterThan(240);
  });

  it('rhizomes extend horizontally and stay near their depth', () => {
    const p = new RootSystem(2, { ...DEFAULT_GROWTH, pulses: false, rhizomeRoots: false });
    const rh = p.addRhizome(100, 240, 1, 0);
    grow(p, 60);
    const tip = p.tip(rh);
    expect(tip.x - 100).toBeGreaterThan(100);
    expect(Math.abs(tip.y - 240)).toBeLessThan(40);
  });

  it('rhizome nodes schedule new adventitious roots after a delay, and a stopped rhizome makes a ramet', () => {
    const p = new RootSystem(3, {
      ...DEFAULT_GROWTH,
      pulses: false,
      adventitiousDelayHours: 20,
      rhizomeMaxLength: 300,
    });
    p.addRhizome(100, 240, 1, 0);
    grow(p, 15);
    expect(p.segments.filter((s) => s.organ === 'adventitious')).toHaveLength(0);
    grow(p, 120, 15);
    expect(p.segments.filter((s) => s.organ === 'adventitious').length).toBeGreaterThan(0);
    expect(p.ramets.length).toBe(2); // the parent shoot + a new ramet at the stopped apex
  });

  it('lateral roots emerge only after the lateral delay, as a shared cluster', () => {
    const p = new RootSystem(4, { ...DEFAULT_GROWTH, pulses: false, lateralDelayHours: 50 });
    p.addSegment('adventitious', 600, 220, Math.PI / 2, 0);
    grow(p, 40);
    expect(p.segments.some((s) => s.organ === 'lateral')).toBe(false);
    grow(p, 60, 40);
    const lats = p.segments.filter((s) => s.organ === 'lateral');
    expect(lats.length).toBeGreaterThanOrEqual(SIM.lateralsPerCluster[0]);
    expect(new Set(lats.map((l) => l.clusterId)).size).toBe(1);
  });

  it('growth comes in pulses with rest periods', () => {
    const p = new RootSystem(5, { ...DEFAULT_GROWTH, pulses: true });
    const r = p.addSegment('adventitious', 600, 220, Math.PI / 2, 0);
    const states = new Set<boolean>();
    for (let t = 0; t < SIM.pulse.period; t += 1) states.add(p.inPulse(r, t));
    expect(states).toEqual(new Set([true, false]));
  });

  it('is deterministic for a seed', () => {
    const run = (seed: number) => {
      const p = new RootSystem(seed);
      p.addRhizome(100, 240, 1, 0);
      grow(p, 200);
      return p.segments.map((s) => `${s.organ}:${s.points.length}`).join(',');
    };
    expect(run(9)).toBe(run(9));
    expect(run(9)).not.toBe(run(10));
  });
});

describe('maturation', () => {
  it('new tissue releases more than mature tissue, and mature roots stop releasing', () => {
    for (const organ of ['rhizome', 'adventitious'] as const) {
      expect(releaseFactor(organ, 2)).toBeGreaterThan(releaseFactor(organ, 60));
      expect(releaseFactor(organ, SIM.release[organ].end + 1)).toBe(0);
    }
  });

  it('lateral tissue keeps releasing far longer than adventitious tissue', () => {
    expect(releaseFactor('lateral', 200)).toBeGreaterThan(0);
    expect(releaseFactor('adventitious', 200)).toBe(0);
  });
});
