import { describe, expect, it } from 'vitest';
import { ATLAS } from '../src/characters/atlas';
import { TUNING } from '../src/config/tuning';
import {
  createHunt,
  NO_INPUT,
  stepHunt,
  type HuntInput,
  type HuntState,
} from '../src/systems/hunt';
import { normalize } from '../src/utils/math';

const DT = 1 / 60;

/**
 * A simple scripted player for Atlas: approach the nearest school, cast
 * Glucose Crash then System Override on it, close in, and Engulf when
 * vulnerable fish are in reach. Used to check that the hunt is winnable.
 */
function atlasBot(s: HuntState, useOverride = true): HuntInput {
  const catchable = 1 - TUNING.capture.vulnerabilityThreshold;
  const live = s.fish.filter((f) => f.mode !== 'captured');
  const vulnerable = live.filter((f) => f.glucose < catchable);
  const pool = vulnerable.length > 0 ? vulnerable : live;
  const dist = (f: (typeof live)[number]) =>
    Math.hypot(f.pos.x - s.snail.pos.x, f.pos.y - s.snail.pos.y);
  const target = pool.reduce((best, f) => (dist(f) < dist(best) ? f : best));
  const d = dist(target);
  return {
    move: normalize({ x: target.pos.x - s.snail.pos.x, y: target.pos.y - s.snail.pos.y }),
    aim: target.pos,
    primary: d < 200 && vulnerable.length === 0 && target.insulin < 0.3,
    secondary: useOverride && d < 200 && target.insulin > 0.3 && target.override < 0.3,
    capture: d < ATLAS.abilities.capture.radius,
  };
}

function play(seed: number, bot: (s: HuntState) => HuntInput) {
  const s = createHunt(ATLAS, seed);
  while (s.outcome === 'playing') stepHunt(s, bot(s), DT);
  return s;
}

describe('hunt', () => {
  it('is deterministic for a given seed (restart reproduces the same reef)', () => {
    const a = play(7, atlasBot);
    const b = play(7, atlasBot);
    expect(a.time).toBe(b.time);
    expect(a.captured).toBe(b.captured);
  });

  it('places clouds no further than the ability range', () => {
    const s = createHunt(ATLAS, 1);
    stepHunt(s, { ...NO_INPUT, primary: true, aim: { x: 5000, y: s.snail.pos.y } }, DT);
    const c = s.clouds[0]!;
    const range = ATLAS.abilities.primary.kind === 'cloud' ? ATLAS.abilities.primary.range : 0;
    expect(Math.hypot(c.pos.x - s.snail.pos.x, c.pos.y - s.snail.pos.y)).toBeLessThanOrEqual(
      range + 1,
    );
  });

  it('engulf only captures vulnerable fish in range', () => {
    const s = createHunt(ATLAS, 2);
    const [healthy, weak, far] = s.fish;
    healthy!.pos = { ...s.snail.pos };
    weak!.pos = { x: s.snail.pos.x + 10, y: s.snail.pos.y };
    weak!.glucose = 0.1;
    far!.pos = { x: s.snail.pos.x + 400, y: s.snail.pos.y };
    far!.glucose = 0.1;
    const events = stepHunt(s, { ...NO_INPUT, capture: true }, DT);
    expect(events).toContainEqual({ type: 'capture', fishIds: [weak!.id] });
    expect(healthy!.mode).not.toBe('captured');
    expect(far!.mode).not.toBe('captured');
  });

  it('a capture miss reports feedback and captures nothing', () => {
    const s = createHunt(ATLAS, 3);
    expect(stepHunt(s, { ...NO_INPUT, capture: true }, DT)).toContainEqual({
      type: 'capture-miss',
    });
    expect(s.captured).toBe(0);
  });

  it('is lost when time runs out', () => {
    const s = createHunt(ATLAS, 4);
    while (s.outcome === 'playing') stepHunt(s, NO_INPUT, 0.5);
    expect(s.outcome).toBe('lost');
    expect(s.time).toBeGreaterThanOrEqual(TUNING.hunt.timeLimitSeconds);
  });

  const SEEDS = [11, 22, 33, 44, 55, 66, 77, 88];

  it('Atlas wins most hunts with the signature combo (Glucose Crash → System Override → Engulf)', () => {
    const wins = SEEDS.filter((seed) => play(seed, atlasBot).outcome === 'won');
    expect(wins.length).toBeGreaterThanOrEqual(6);
  });

  it('Glucose Crash alone is not enough: the combo is required', () => {
    const wins = SEEDS.filter((seed) => play(seed, (st) => atlasBot(st, false)).outcome === 'won');
    expect(wins).toHaveLength(0);
  });

  it('engulfing without any venom never wins', () => {
    const s = play(11, (st) => ({ ...atlasBot(st), primary: false, secondary: false }));
    expect(s.outcome).toBe('lost');
  });
});
