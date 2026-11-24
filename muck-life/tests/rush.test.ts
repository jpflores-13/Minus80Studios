import { describe, expect, it } from 'vitest';
import { RUSH_MODES, rushConfig, rushDifficulty, scorePredictions } from '../src/levels/rush';
import { Session } from '../src/systems/session';
import { autoplay } from './bot';

describe('O2 RUSH', () => {
  it('difficulty rises monotonically and then caps', () => {
    let prev = rushDifficulty(0);
    for (let t = 5; t <= 300; t += 5) {
      const d = rushDifficulty(t);
      expect(d.maxGrowingRoots).toBeGreaterThanOrEqual(prev.maxGrowingRoots);
      expect(d.distractorRate).toBeGreaterThanOrEqual(prev.distractorRate);
      expect(d.emergenceEveryHours).toBeLessThanOrEqual(prev.emergenceEveryHours);
      prev = d;
    }
    expect(rushDifficulty(1000)).toEqual(rushDifficulty(150));
  });

  it('offers four modes, and Classic Rush ends at 90 seconds', () => {
    expect(RUSH_MODES.map((m) => m.id)).toEqual(['classic', 'endless', 'zen', 'timelapse']);
    const s = autoplay(rushConfig('classic', 5), { reactionSec: 1.5 });
    expect(s.finished).toBe(true);
    expect(s.gameSec).toBeGreaterThanOrEqual(90);
    expect(s.stats.observations).toBeGreaterThan(10);
  });

  it('Endless Muck ends when pools fade undocumented', () => {
    const s = new Session(rushConfig('endless', 3));
    while (!s.finished && s.gameSec < 600) s.update(1 / 20);
    expect(s.endReason).toBe('gaps');
  });

  it('Zen Optode never spawns artefacts and never ends on its own', () => {
    const s = new Session(rushConfig('zen', 3));
    for (let i = 0; i < 20 * 120; i++) s.update(1 / 20);
    expect(s.distractors.items).toHaveLength(0);
    expect(s.finished).toBe(false);
  });

  it('seeds reproduce growth, and restarts never inherit director state', () => {
    const shape = (seed: number) => {
      const s = new Session(rushConfig('classic', seed));
      for (let i = 0; i < 30 * 60; i++) s.update(1 / 30);
      return s.plant.segments.length;
    };
    const cfg = rushConfig('classic', 8);
    const a = new Session(cfg);
    for (let i = 0; i < 30 * 60; i++) a.update(1 / 30);
    const b = new Session(cfg);
    for (let i = 0; i < 30 * 60; i++) b.update(1 / 30);
    expect(a.plant.segments.length).toBe(b.plant.segments.length);
    expect(shape(8)).toBe(a.plant.segments.length);
  });

  it('time-lapse predictions score by distance to newly appeared pools', () => {
    const r = scorePredictions(
      [
        { x: 0, y: 0 },
        { x: 500, y: 500 },
      ],
      [{ x: 10, y: 0 }],
    );
    expect(r.hits).toBe(1);
    expect(r.points).toBe(375);
    expect(scorePredictions([{ x: 0, y: 0 }], []).points).toBe(0);
  });
});
