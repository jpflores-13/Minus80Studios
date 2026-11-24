import { describe, expect, it } from 'vitest';
import { ARCADE } from '../src/config/tuning';
import type { Region } from '../src/systems/regions';
import {
  accuracy,
  comboMultiplier,
  efficiency,
  performanceTitle,
  Scorer,
  stars,
} from '../src/systems/scoring';

const r = (over: Partial<Region> = {}): Region => ({
  key: 'k',
  kind: 'tip',
  organ: 'adventitious',
  visible: true,
  x: 0,
  y: 0,
  radius: 10,
  strength: 25,
  cells: [],
  firstSeenSim: -100,
  firstSeenGame: 0,
  lastSeenGame: 0,
  lastDoc: null,
  docCount: 0,
  lost: false,
  ...over,
});
const ctx = (gameSec: number) => ({ simHour: 0, gameSec, night: false, nightBonus: false });

describe('scoring and combos', () => {
  it('awards +100, +125, +150 for consecutive distinct observations', () => {
    const s = new Scorer();
    expect(s.observe(r(), 'new', ctx(0)).points).toBe(100);
    expect(s.observe(r(), 'new', ctx(1)).points).toBe(125);
    expect(s.observe(r(), 'new', ctx(2)).points).toBe(150);
    expect(comboMultiplier(99)).toBe(comboMultiplier(ARCADE.comboMaxStreak));
  });

  it('the combo lapses after the combo window', () => {
    const s = new Scorer();
    s.observe(r(), 'new', ctx(0));
    s.tick(ARCADE.comboWindowSec + 0.1);
    expect(s.stats.streak).toBe(0);
  });

  it('misses break the combo and cost accuracy; repeats break the combo only', () => {
    const s = new Scorer();
    s.observe(r(), 'new', ctx(0));
    s.duplicate();
    expect(s.stats.streak).toBe(0);
    expect(accuracy(s.stats)).toBe(1);
    s.miss();
    expect(accuracy(s.stats)).toBe(0.5);
    expect(efficiency(s.stats)).toBeCloseTo(1 / 3);
  });

  it('rewards tracking, fresh emergence, persistent lateral plumes, and stricter imaging', () => {
    const s = new Scorer(() => 2);
    const fresh = s.observe(r({ firstSeenSim: 0 }), 'new', ctx(0));
    expect(fresh.bonuses.map((b) => b.label)).toContain('FRESH EMERGENCE');
    expect(s.observe(r(), 'moved', ctx(1)).bonuses.map((b) => b.label)).toContain('TRACKED GROWTH');
    const lat = s.observe(r({ kind: 'lateral', organ: 'lateral' }), 'period', ctx(2));
    expect(lat.bonuses.map((b) => b.label)).toContain('PERSISTENT PLUME');
    expect(fresh.points).toBe(
      Math.round((100 + ARCADE.freshBonus) * ARCADE.thresholdMultiplier[2]),
    );
  });

  it('score never depends on the amount of oxygen (strength) in a pool', () => {
    const a = new Scorer().observe(r({ strength: 5 }), 'new', ctx(0)).points;
    const b = new Scorer().observe(r({ strength: 35 }), 'new', ctx(0)).points;
    expect(a).toBe(b);
  });

  it('titles and stars scale with performance', () => {
    expect(performanceTitle(0, 1000, 1)).toBe('Mud Rookie');
    expect(performanceTitle(2000, 1000, 1)).toBe('Muck Master');
    expect(performanceTitle(2000, 1000, 0.3)).toBe('Oxygen Observer');
    expect(stars(1500, 1000)).toBe(3);
    expect(stars(100, 1000)).toBe(0);
  });
});
