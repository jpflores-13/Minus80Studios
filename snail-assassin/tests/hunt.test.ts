import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '../src/characters';
import { ATLAS } from '../src/characters/atlas';
import { CATALYST } from '../src/characters/catalyst';
import { NIGHTSHADE } from '../src/characters/nightshade';
import { OCTOPUS } from '../src/characters/octopus';
import { TUNING } from '../src/config/tuning';
import { createHunt, NO_INPUT, stepHunt, type HuntState } from '../src/systems/hunt';
import { atlasBot, catalystBot, nightshadeBot, octopusBot, play, SEEDS } from './bots';

const DT = 1 / 60;
const wins = (results: HuntState[]) => results.filter((s) => s.outcome === 'won').length;

describe('hunt core', () => {
  it('is deterministic for a given seed (restart reproduces the same reef)', () => {
    const a = play(ATLAS, 7, atlasBot());
    const b = play(ATLAS, 7, atlasBot());
    expect([a.time, a.captured]).toEqual([b.time, b.captured]);
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

  it('is lost when time runs out', () => {
    const s = createHunt(ATLAS, 4);
    while (s.outcome === 'playing') stepHunt(s, NO_INPUT, 0.5);
    expect(s.outcome).toBe('lost');
    expect(s.time).toBeGreaterThanOrEqual(TUNING.hunt.timeLimitSeconds);
  });

  it('character switching: every character starts a fresh, valid hunt on the same reef', () => {
    const reefs = CHARACTERS.map((c) => createHunt(c, 5));
    for (const s of reefs) {
      expect(s.captured).toBe(0);
      expect(s.venom.reserve).toBe(TUNING.venom.max);
      expect(s.fish.map((f) => f.pos)).toEqual(reefs[0]!.fish.map((f) => f.pos));
    }
  });
});

describe('Atlas (engulf + clouds)', () => {
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

  it('wins most hunts with Glucose Crash → System Override → Engulf', () => {
    expect(wins(SEEDS.map((seed) => play(ATLAS, seed, atlasBot())))).toBeGreaterThanOrEqual(6);
  });

  it('Glucose Crash alone is not enough', () => {
    expect(wins(SEEDS.map((seed) => play(ATLAS, seed, atlasBot(false))))).toBe(0);
  });

  it('engulfing without venom never wins', () => {
    expect(
      play(ATLAS, 11, (st) => ({ ...atlasBot()(st), primary: false, secondary: false })).outcome,
    ).toBe('lost');
  });
});

describe('Catalyst (strike + tether)', () => {
  function setup(distance: number) {
    const s = createHunt(CATALYST, 9);
    const fish = s.fish[0]!;
    fish.pos = { x: s.snail.pos.x + distance, y: s.snail.pos.y };
    return { s, fish };
  }

  it('a strike that misses wastes venom and adds a cooldown penalty', () => {
    const s = createHunt(CATALYST, 9);
    const events = stepHunt(s, { ...NO_INPUT, primary: true, aim: { x: 0, y: 0 } }, DT);
    expect(events.some((e) => e.type === 'strike-miss')).toBe(true);
    expect(s.venom.reserve).toBeLessThan(TUNING.venom.max);
    expect(s.venom.cooldowns.primary).toBeGreaterThan(2);
    expect(s.stats.strikesMissed).toBe(1);
  });

  it('a hit immobilizes and tethers exactly one fish', () => {
    const { s, fish } = setup(100);
    stepHunt(s, { ...NO_INPUT, primary: true, aim: fish.pos }, DT);
    expect(s.tether?.fishId).toBe(fish.id);
    expect(fish.neural).toBeGreaterThan(0.9);
    expect(s.fish.filter((f) => f.tethered)).toHaveLength(1);
  });

  it('Motor Lock and Reel In need a tethered fish (no venom spent otherwise)', () => {
    const s = createHunt(CATALYST, 9);
    expect(stepHunt(s, { ...NO_INPUT, secondary: true }, DT)).toContainEqual({
      type: 'denied',
      slot: 'secondary',
      reason: 'no-target',
    });
    expect(s.venom.reserve).toBe(TUNING.venom.max);
  });

  const reelFrom = (distance: number, lock: boolean) => {
    const { s, fish } = setup(distance);
    stepHunt(s, { ...NO_INPUT, primary: true, aim: { ...fish.pos } }, DT);
    if (lock) stepHunt(s, { ...NO_INPUT, secondary: true }, DT);
    stepHunt(s, { ...NO_INPUT, capture: true }, DT);
    for (let i = 0; i < 600 && s.tether; i++) stepHunt(s, NO_INPUT, DT);
    return s;
  };

  it('a long-range strike escapes without Motor Lock (the tether breaks)', () => {
    const s = reelFrom(160, false);
    expect(s.captured).toBe(0);
    expect(s.stats.tethersBroken).toBe(1);
  });

  it('the same strike is captured with Motor Lock', () => {
    expect(reelFrom(160, true).captured).toBe(1);
  });

  it('wins every hunt with Lightning Strike → Motor Lock → Reel In', () => {
    expect(wins(SEEDS.map((seed) => play(CATALYST, seed, catalystBot())))).toBe(SEEDS.length);
  });
});

describe('Cipher (pounce + paralytic bite + draw to mouth)', () => {
  it('a pounce that misses wastes venom and adds a cooldown penalty', () => {
    const s = createHunt(OCTOPUS, 9);
    const events = stepHunt(s, { ...NO_INPUT, primary: true, aim: { x: 0, y: 0 } }, DT);
    expect(events.some((e) => e.type === 'strike-miss')).toBe(true);
    expect(s.venom.reserve).toBeLessThan(TUNING.venom.max);
  });

  it('wins every hunt with Pounce → Paralytic Bite → Draw to Mouth', () => {
    expect(wins(SEEDS.map((seed) => play(OCTOPUS, seed, octopusBot())))).toBe(SEEDS.length);
  });

  it('skipping the paralytic bite loses the tether on a long reel (same tether physics as Catalyst)', () => {
    const s = createHunt(OCTOPUS, 9);
    const fish = s.fish[0]!;
    fish.pos = { x: s.snail.pos.x + 130, y: s.snail.pos.y };
    stepHunt(s, { ...NO_INPUT, primary: true, aim: { ...fish.pos } }, DT);
    stepHunt(s, { ...NO_INPUT, capture: true }, DT);
    for (let i = 0; i < 600 && s.tether; i++) stepHunt(s, NO_INPUT, DT);
    expect(s.captured).toBe(0);
    expect(s.stats.tethersBroken).toBe(1);
  });
});

describe('the shark (threatens Cipher)', () => {
  it('is tuned differently from the octopus that threatens the three snail characters', () => {
    expect(TUNING.shark.chaseSpeed).toBeGreaterThan(TUNING.predator.chaseSpeed);
    // Electroreception doesn't need the prey to move, so holding still helps much less here.
    expect(TUNING.shark.stillVisibility).toBeGreaterThan(TUNING.predator.stillVisibility);
  });

  it('a bite stuns Cipher and costs venom, using the shark tuning, not the octopus tuning', () => {
    const s = createHunt(OCTOPUS, 3);
    s.predator.pos = { x: s.snail.pos.x + 10, y: s.snail.pos.y };
    s.predator.mode = 'chase';
    s.predator.awareness = 1;
    const events = stepHunt(s, { ...NO_INPUT, move: { x: 1, y: 0 } }, DT);
    expect(events).toContainEqual({ type: 'grabbed' });
    expect(s.snail.stunned).toBeCloseTo(TUNING.shark.stunSeconds, 5);
    expect(s.venom.reserve).toBe(TUNING.venom.max - TUNING.shark.venomLost);
  });
});

describe('Nightshade (escape dampening + insulin + net)', () => {
  it('Ghost Signal lowers escape responsiveness', () => {
    const s = createHunt(NIGHTSHADE, 3);
    const fish = s.fish[0]!;
    fish.pos = { x: s.snail.pos.x + 120, y: s.snail.pos.y };
    stepHunt(s, { ...NO_INPUT, primary: true, aim: { ...fish.pos } }, DT);
    for (let i = 0; i < 60; i++) stepHunt(s, NO_INPUT, DT);
    expect(fish.responsiveness).toBeLessThan(0.8);
  });

  it('wins most hunts with Ghost Signal → Silent Tide → Phantom Net', () => {
    expect(
      wins(SEEDS.map((seed) => play(NIGHTSHADE, seed, nightshadeBot()))),
    ).toBeGreaterThanOrEqual(6);
  });

  it('either cloud alone is not enough (the combo is complementary)', () => {
    expect(wins(SEEDS.map((seed) => play(NIGHTSHADE, seed, nightshadeBot(true, false))))).toBe(0);
    expect(wins(SEEDS.map((seed) => play(NIGHTSHADE, seed, nightshadeBot(false, true))))).toBe(0);
  });
});
