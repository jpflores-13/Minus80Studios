import { describe, expect, it } from 'vitest';
import { MEASURED, SIM } from '../src/config/tuning';
import { daylight, dielShape, isNight } from '../src/systems/daynight';
import { organOnly, runGrowthVsDiel } from '../src/systems/experiments';
import { DEFAULT_FIELD, OxygenField } from '../src/systems/oxygen';
import { DEFAULT_GROWTH, RootSystem } from '../src/systems/plant';

const results = runGrowthVsDiel();

describe('oxygen field', () => {
  it('oxygenation follows root development: high by a growing tip, zero in root-free mud', () => {
    const p = new RootSystem(1, { ...DEFAULT_GROWTH, pulses: false, lateralsEnabled: false });
    const r = p.addSegment('adventitious', 640, 220, Math.PI / 2, 0);
    const f = new OxygenField(0, 180, 1280, 544);
    for (let t = 0; t < 40; t += SIM.stepHours) {
      p.step(SIM.stepHours, t);
      f.step(p, t, SIM.stepHours);
    }
    const tip = p.tip(r);
    expect(f.sample(tip.x, tip.y)).toBeGreaterThan(10);
    expect(f.sample(100, 600)).toBe(0);
  });

  it('decays back to anoxia when sources stop (sediment oxygen demand)', () => {
    const f = new OxygenField(0, 180, 320, 320);
    f.o.fill(40);
    const empty = new RootSystem(1);
    for (let t = 0; t < 6; t += SIM.stepHours) f.step(empty, t, SIM.stepHours);
    expect(f.max()).toBeLessThan(1);
  });

  it('never exceeds the gradient cap, even with dense overlapping tissue', () => {
    const p = new RootSystem(2, { ...DEFAULT_GROWTH, pulses: false });
    for (let i = 0; i < 12; i++) p.addSegment('adventitious', 640 + i, 220, Math.PI / 2, 0);
    const f = new OxygenField(0, 180, 1280, 544);
    for (let t = 0; t < 40; t += SIM.stepHours) {
      p.step(SIM.stepHours, t);
      f.step(p, t, SIM.stepHours);
    }
    expect(f.max()).toBeLessThanOrEqual(SIM.internalO2Pct + 0.01);
  });

  it('snapshots round-trip within quantization error', () => {
    const f = new OxygenField(0, 180, 64, 64, DEFAULT_FIELD);
    f.o[3] = 27.3;
    expect((f.snapshot()[3]! / 255) * 50).toBeCloseTo(27.3, 0);
  });
});

describe('calibration against Stein & Cardon (2026)', () => {
  it('lateral-root pools persist far longer than new adventitious-root pools', () => {
    expect(results.lateralDuration).toBeGreaterThan(3 * results.adventitiousDuration);
  });

  it('pool durations land within ±1 SE-ish of the Table 1 means', () => {
    const d = MEASURED.poolDurationHours;
    expect(Math.abs(results.adventitiousDuration - d.adventitious.mean)).toBeLessThan(
      2 * d.adventitious.se,
    );
    expect(Math.abs(results.lateralDuration - d.lateral.mean)).toBeLessThan(d.lateral.se);
    const rh = organOnly('rhizome');
    expect(Math.abs(rh.duration - d.rhizome.mean)).toBeLessThan(d.rhizome.se);
  });

  it('day-night swings are small and do not dominate growth-associated changes', () => {
    expect(results.dielRange).toBeGreaterThan(1);
    expect(results.dielRange).toBeLessThan(MEASURED.dielAbstractPct + 1);
    expect(results.growthRise).toBeGreaterThan(3 * results.dielRange);
  });

  it('oxygen pools persist at night', () => {
    expect(results.nightMinimum).toBeGreaterThan(5);
  });
});

describe('day and night', () => {
  it('uses the study light period 05:00-19:00', () => {
    expect(isNight(4.9)).toBe(true);
    expect(isNight(5)).toBe(false);
    expect(isNight(18.9)).toBe(false);
    expect(isNight(19)).toBe(true);
    expect(daylight(12)).toBe(1);
    expect(daylight(23)).toBe(0);
  });

  it('diel shape is bounded and continuous through the day', () => {
    let prev = dielShape(0);
    for (let h = 0.1; h < 48; h += 0.1) {
      const v = dielShape(h);
      expect(Math.abs(v)).toBeLessThanOrEqual(1.0001);
      expect(Math.abs(v - prev)).toBeLessThan(0.1);
      prev = v;
    }
    expect(dielShape(7.5)).toBeGreaterThan(dielShape(18)); // peak after dawn
    expect(dielShape(21)).toBeLessThan(dielShape(4)); // drop after dusk, rise overnight
  });
});
