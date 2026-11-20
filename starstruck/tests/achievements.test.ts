import { describe, expect, it } from 'vitest';
import { checkAchievements } from '../src/content/achievements';
import type { Progress } from '../src/config/progress';
import { createGame, type GameState } from '../src/systems/game';
import type { LevelConfig } from '../src/levels/types';

const tiny = (rows: string[], extra: Partial<LevelConfig> = {}): LevelConfig => ({
  id: 'test',
  number: 0,
  name: 'test',
  objective: { kind: 'eat', materials: ['worm'], count: 1 },
  timeLimit: 60,
  prompts: [],
  stars: [100, 200, 300],
  map: rows,
  ...extra,
});

const baseProgress = (overrides: Partial<Progress> = {}): Progress => ({
  best: {},
  character: 'diggy',
  achievements: [],
  lifetimeDug: 0,
  lifetimeWormsEaten: 0,
  bestWormageddon: { score: 0, seconds: 0 },
  volume: 0.7,
  muted: false,
  music: true,
  reducedEffects: false,
  largeText: false,
  ambient: 1,
  memoryScale: 1,
  autoBite: false,
  haptics: true,
  seenIntro: true,
  seenEnding: false,
  ...overrides,
});

describe('achievements', () => {
  it('earns nothing from a fresh, untouched game', () => {
    const s = createGame(tiny(['OOOOO', 'OP..O', 'OOOOO']));
    expect(checkAchievements({ state: s, progress: baseProgress(), levelCount: 6 })).toEqual([]);
  });

  it('Nose Knows comes from a single touch mark', () => {
    const s = createGame(tiny(['OOOOO', 'OP..O', 'OOOOO']));
    s.memory.marks.push({ x: 0, y: 0, id: 1, material: 'worm', time: 0, resolution: 1 });
    expect(checkAchievements({ state: s, progress: baseProgress(), levelCount: 6 })).toContain(
      'noseKnows',
    );
  });

  it('Touch and Go only counts a win with zero digging', () => {
    const s = createGame(tiny(['OOOOO', 'OP..O', 'OOOOO']));
    s.status = 'won';
    s.diggedTiles = 0;
    expect(checkAchievements({ state: s, progress: baseProgress(), levelCount: 6 })).toContain(
      'touchAndGo',
    );
    s.diggedTiles = 1;
    expect(checkAchievements({ state: s, progress: baseProgress(), levelCount: 6 })).not.toContain(
      'touchAndGo',
    );
  });

  it('Dirty Dancing and Worm Whisperer read lifetime totals, not this level alone', () => {
    const s = createGame(tiny(['OOOOO', 'OP..O', 'OOOOO']));
    const under = checkAchievements({
      state: s,
      progress: baseProgress({ lifetimeDug: 49, lifetimeWormsEaten: 99 }),
      levelCount: 6,
    });
    expect(under).not.toContain('dirtyDancing');
    expect(under).not.toContain('wormWhisperer');
    const over = checkAchievements({
      state: s,
      progress: baseProgress({ lifetimeDug: 50, lifetimeWormsEaten: 100 }),
      levelCount: 6,
    });
    expect(over).toContain('dirtyDancing');
    expect(over).toContain('wormWhisperer');
  });

  it('WORMAGEDDON fires at an 8-combo, in or out of a win', () => {
    const s = createGame(tiny(['OOOOO', 'OP..O', 'OOOOO']));
    s.bestCombo = 8;
    expect(checkAchievements({ state: s, progress: baseProgress(), levelCount: 6 })).toContain(
      'wormageddon',
    );
  });

  it('Lord of the Worms needs every edible thing dead, and a win', () => {
    const s = createGame(tiny(['OOOOOOO', 'OP..w.O', 'OOOOOOO']));
    const worm = s.things[0] as GameState['things'][number];
    worm.alive = false;
    s.status = 'won';
    expect(checkAchievements({ state: s, progress: baseProgress(), levelCount: 6 })).toContain(
      'lordOfTheWorms',
    );
  });

  it('Star Performer and Diggy Stardom need every level accounted for', () => {
    const s = createGame(tiny(['OOOOO', 'OP..O', 'OOOOO']));
    const almost = checkAchievements({
      state: s,
      progress: baseProgress({
        best: { 'level-1': { score: 1, stars: 3 }, 'level-2': { score: 1, stars: 2 } },
      }),
      levelCount: 2,
    });
    expect(almost).not.toContain('starPerformer');
    // Diggy Stardom only needs every level cleared, not 3-starred, so it's already earned here
    expect(almost).toContain('diggyStardom');
    const all = checkAchievements({
      state: s,
      progress: baseProgress({
        best: { 'level-1': { score: 1, stars: 3 }, 'level-2': { score: 1, stars: 3 } },
      }),
      levelCount: 2,
    });
    expect(all).toContain('starPerformer');
    expect(all).toContain('diggyStardom');
  });

  it('never re-earns something already unlocked', () => {
    const s = createGame(tiny(['OOOOO', 'OP..O', 'OOOOO']));
    s.bestCombo = 8;
    const earned = checkAchievements({
      state: s,
      progress: baseProgress({ achievements: ['wormageddon'] }),
      levelCount: 6,
    });
    expect(earned).not.toContain('wormageddon');
  });
});
