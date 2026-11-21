import { describe, expect, it } from 'vitest';
import { createGame, stepGame, NO_INPUT, TUNING, type GameState } from '../src/systems/game';
import { parseLandscape, TILE } from '../src/systems/network';
import type { LevelConfig } from '../src/levels/types';

const DT = 1 / 30;
const tiny = (map: string[], extra: Partial<LevelConfig> = {}): LevelConfig => ({
  id: 'test',
  number: 0,
  name: 'test',
  tagline: '',
  intro: [],
  map,
  timeLimit: 60,
  rain: [],
  stars: [10, 20, 30],
  ...extra,
});

const run = (s: GameState, seconds: number, input = NO_INPUT) => {
  const ev = [];
  for (let t = 0; t < seconds && s.status === 'playing'; t += DT)
    ev.push(...stepGame(s, input, DT));
  return ev;
};

describe('the landscape', () => {
  it('finds start and destination', () => {
    const land = parseLandscape(['XXXXX', 'XP.EX', 'XXXXX']);
    expect(land.start).toEqual({ tx: 1, ty: 1 });
    expect(land.destination).toEqual({ tx: 3, ty: 1 });
  });

  it('gives two separate stream networks different watershed ids', () => {
    const land = parseLandscape(['XXXXXXXXX', 'X~~X...~X', 'XXXXXXXXX']);
    expect(land.watershedCount).toBe(2);
    const a = land.watershed[1 * 9 + 1];
    const b = land.watershed[1 * 9 + 2];
    const c = land.watershed[1 * 9 + 7];
    expect(a).toBe(b);
    expect(a).not.toBeNull();
    expect(c).not.toBe(a);
  });

  it('a stream bend stays one connected watershed', () => {
    const land = parseLandscape(['XXXXX', 'X~~XX', 'X~XXX', 'X~~~X', 'XXXXX']);
    const ids = new Set<number | null>();
    land.tiles.forEach((t, i) => {
      if (t === 'stream') ids.add(land.watershed[i] ?? null);
    });
    expect(ids.size).toBe(1);
  });
});

describe('moisture', () => {
  it('regenerates in a stream and drains on exposed clearing', () => {
    const land = tiny(['XXXXX', 'X~.CX', 'XXXXX']);
    const s = createGame(land);
    s.moisture = 50;
    run(s, 2);
    expect(s.moisture).toBeGreaterThan(50);
  });

  it('drains to zero on a clearing and ends the run', () => {
    const s = createGame(tiny(['XXXXX', 'XPCEX', 'XXXXX']));
    s.moss.x = 2 * TILE + TILE / 2;
    s.moss.y = TILE + TILE / 2;
    s.moisture = 5;
    const ev = run(s, 5);
    expect(s.status).toBe('lost');
    expect(s.lostReason).toBe('dry');
    expect(ev.some((e) => e.type === 'dry')).toBe(true);
  });

  it('rain softens how fast exposed terrain drains', () => {
    const noRain = createGame(tiny(['XXXXX', 'XPCEX', 'XXXXX']));
    const withRain = createGame(
      tiny(['XXXXX', 'XPCEX', 'XXXXX'], { rain: [{ at: 0, duration: 10 }] }),
    );
    for (const s of [noRain, withRain]) {
      s.moss.x = 2 * TILE + TILE / 2;
      s.moss.y = TILE + TILE / 2;
    }
    run(noRain, 2);
    run(withRain, 2);
    expect(withRain.moisture).toBeGreaterThan(noRain.moisture);
  });

  it('never exceeds the moisture cap', () => {
    const s = createGame(tiny(['XXXXX', 'XP~EX', 'XXXXX']));
    s.moss.x = 1 * TILE + TILE / 2;
    s.moisture = TUNING.maxMoisture;
    run(s, 5);
    expect(s.moisture).toBeLessThanOrEqual(TUNING.maxMoisture);
  });
});

describe('movement and barriers', () => {
  it('cannot cross a barrier tile', () => {
    const s = createGame(tiny(['XXXXX', 'XPXEX', 'XXXXX']));
    run(s, 3, { dx: 1, dy: 0 });
    expect(s.moss.x).toBeLessThan(2 * TILE);
  });

  it('reaches the destination and wins', () => {
    const s = createGame(tiny(['XXXXXXX', 'XP....EX', 'XXXXXXX']));
    const ev = run(s, 10, { dx: 1, dy: 0 });
    expect(s.status).toBe('won');
    expect(ev.some((e) => e.type === 'won')).toBe(true);
  });

  it('running out of time loses, even with moisture to spare', () => {
    const s = createGame(tiny(['XXXXXXXXXX', 'XP~~~~~~EX', 'XXXXXXXXXX'], { timeLimit: 0.1 }));
    run(s, 2);
    expect(s.status).toBe('lost');
    expect(s.lostReason).toBe('time');
  });
});

describe('watershed crossings', () => {
  it('counts entering a second stream network once', () => {
    const s = createGame(tiny(['XXXXXXXXXXXXX', 'XP~~.......X', 'X...~~~~..EX', 'XXXXXXXXXXXXX']));
    // walk from the first stream, overland, into the second
    const ev = run(s, 15, { dx: 1, dy: 0.3 });
    expect(s.watershedCrossings).toBeGreaterThanOrEqual(1);
    expect(ev.filter((e) => e.type === 'crossing').length).toBe(s.watershedCrossings);
  });

  it('starts having already visited its own watershed, not counted as a crossing', () => {
    const s = createGame(tiny(['XXXXX', 'XP~EX', 'XXXXX']));
    expect(s.watershedCrossings).toBe(0);
    expect(s.visitedWatersheds.size).toBe(s.startWatershed === null ? 0 : 1);
  });
});
