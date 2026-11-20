import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '../src/content/characters';
import { LEVELS } from '../src/levels';
import type { LevelConfig } from '../src/levels/types';
import {
  createGame,
  isIdentified,
  multiplier,
  comboLabel,
  NO_INPUT,
  soilAt,
  stars,
  stepGame,
  TILE,
  TUNING,
  underNose,
  type GameState,
  type Thing,
} from '../src/systems/game';

const DT = 1 / 60;
const tiny = (rows: string[], extra: Partial<LevelConfig> = {}): LevelConfig => ({
  id: 'test',
  number: 0,
  name: 'test',
  objective: { kind: 'eat', material: 'worm', count: 1 },
  timeLimit: 60,
  prompts: [],
  stars: [100, 200, 300],
  map: rows,
  ...extra,
});
const run = (s: GameState, seconds: number, input = NO_INPUT) => {
  const ev = [];
  for (let t = 0; t < seconds && s.status === 'playing'; t += DT)
    ev.push(...stepGame(s, input, DT));
  return ev;
};
/** Freeze every creature, so tests are about the mole. */
const still = (s: GameState) => s.things.forEach((t) => (t.speed = 0));
const faceThing = (s: GameState, t: Thing) => {
  const head = t.shape.kind === 'circle' ? t.shape.c : t.shape.points[0]!;
  s.mole.heading = 0;
  s.mole.x = head.x - 24;
  s.mole.y = head.y;
};

describe('moving and digging', () => {
  it('walls of rock stop you', () => {
    const s = createGame(tiny(['OOOOO', 'OP..O', 'OOOOO']));
    run(s, 2, { ...NO_INPUT, dx: -1 });
    expect(s.mole.x).toBeGreaterThan(TILE + 9);
  });

  it('pushing into soft soil digs a tunnel and costs energy', () => {
    const s = createGame(tiny(['#####', '#P###', '#####']));
    const before = s.energy;
    const ev = run(s, 2, { ...NO_INPUT, dx: 1 });
    expect(ev.some((e) => e.type === 'dig')).toBe(true);
    expect(soilAt(s, 2, 1)).toBe('tunnel');
    expect(s.energy).toBeLessThan(before - TUNING.energyDrain * 2 + 0.5);
  });

  it('rock can never be dug', () => {
    const s = createGame(tiny(['OOOO', 'OPOO', 'OOOO']));
    run(s, 3, { ...NO_INPUT, dx: 1 });
    expect(soilAt(s, 2, 1)).toBe('rock');
  });
});

describe('touch, identify, eat', () => {
  it('touching a worm builds up to identifying it', () => {
    const s = createGame(tiny(['OOOOOOO', 'OP..w.O', 'OOOOOOO']));
    still(s);
    const worm = s.things[0]!;
    faceThing(s, worm);
    const ev = run(s, 1.5, { ...NO_INPUT, focus: true });
    expect(ev.some((e) => e.type === 'touch')).toBe(true);
    expect(isIdentified(s, worm)).toBe(true);
  });

  it('things out of reach are never identified', () => {
    const s = createGame(tiny(['OOOOOOOOOOOO', 'OP........wO', 'OOOOOOOOOOOO']));
    still(s);
    run(s, 2);
    expect(isIdentified(s, s.things[0]!)).toBe(false);
  });

  it('biting a worm eats it, restores energy and scores', () => {
    const s = createGame(tiny(['OOOOOOO', 'OP..w.O', 'OOOOOOO']));
    still(s);
    const worm = s.things[0]!;
    faceThing(s, worm);
    s.mole.x += 10;
    expect(underNose(s)).toBe(worm);
    s.energy = 40;
    const ev = run(s, DT * 2, { ...NO_INPUT, bite: true });
    expect(ev.some((e) => e.type === 'eat')).toBe(true);
    expect(worm.alive).toBe(false);
    expect(s.energy).toBeGreaterThan(40);
    expect(s.status).toBe('won');
    expect(stars(s)).toBeGreaterThanOrEqual(1);
  });

  it('biting a pebble costs energy and breaks the combo', () => {
    const s = createGame(tiny(['OOOOOOO', 'OP..o.O', 'OOOOOOO']));
    const rock = s.things[0]!;
    faceThing(s, rock);
    s.mole.x += 12;
    s.combo = 3;
    s.comboTimer = 2;
    const e0 = s.energy;
    const ev = run(s, DT, { ...NO_INPUT, bite: true });
    expect(ev.some((e) => e.type === 'wrongBite')).toBe(true);
    expect(s.combo).toBe(0);
    expect(s.energy).toBeLessThan(e0 - TUNING.wrongBite + 0.1);
  });

  it('quick bites build a combo with bigger multipliers and labels', () => {
    expect(multiplier(1)).toBe(1);
    expect(multiplier(4)).toBeGreaterThan(multiplier(2));
    expect(comboLabel(2)).toBe('NICE!');
    expect(comboLabel(8)).toBe('WORMAGEDDON!');
  });

  it('the combo ends if you wait too long', () => {
    const s = createGame(tiny(['OOOO', 'OP.O', 'OOOO']));
    s.combo = 3;
    s.comboTimer = 0.5;
    run(s, 1);
    expect(s.combo).toBe(0);
  });
});

describe('energy, time, and the level', () => {
  it('running out of energy ends the attempt', () => {
    const s = createGame(tiny(['OOOO', 'OP.O', 'OOOO']));
    s.energy = 0.5;
    const ev = run(s, 2);
    expect(s.status).toBe('lost');
    expect(ev).toContainEqual({ type: 'lost', reason: 'energy' });
  });

  it('running out of time ends it too', () => {
    const s = createGame(tiny(['OOOO', 'OP.O', 'OOOO'], { timeLimit: 1 }));
    run(s, 2);
    expect(s.lostReason).toBe('time');
  });

  it('Level 1 has enough worms, a start, and a fair energy budget', () => {
    const l = LEVELS[0]!;
    const s = createGame(l);
    const worms = s.things.filter((t) => t.material === 'worm').length;
    expect(worms).toBeGreaterThanOrEqual(l.objective.count + 3);
    expect(new Set(l.map.map((r) => r.length)).size).toBe(1);
    // eating the goal's worth of worms pays for more than the time it takes
    expect(l.objective.count * 14).toBeGreaterThan(TUNING.energyDrain * 60);
  });

  it('the same seed gives the same creatures', () => {
    const a = createGame(LEVELS[0]!, 'diggy', 5);
    const b = createGame(LEVELS[0]!, 'diggy', 5);
    run(a, 5);
    run(b, 5);
    expect(a.things.map((t) => t.heading)).toEqual(b.things.map((t) => t.heading));
  });

  it('characters differ: Noseferatu remembers longer, Molezilla holds more energy', () => {
    expect(CHARACTERS.noseferatu.memory).toBeGreaterThan(CHARACTERS.diggy.memory);
    expect(CHARACTERS.molezilla.maxEnergy).toBeGreaterThan(CHARACTERS.diggy.maxEnergy);
    expect(createGame(LEVELS[0]!, 'noseferatu').memory.memory).toBe(CHARACTERS.noseferatu.memory);
  });
});
