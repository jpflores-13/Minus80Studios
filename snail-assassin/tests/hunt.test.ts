import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '../src/characters';
import { ATLAS } from '../src/characters/atlas';
import { BLUESHARK } from '../src/characters/blueshark';
import { CATALYST } from '../src/characters/catalyst';
import { NIGHTSHADE } from '../src/characters/nightshade';
import { OCTOPUS } from '../src/characters/octopus';
import { TUNING } from '../src/config/tuning';
import { createHunt, NO_INPUT, stepHunt, type HuntState } from '../src/systems/hunt';
import { normalize } from '../src/utils/math';
import {
  atlasBot,
  blueSharkBot,
  catalystBot,
  nightshadeBot,
  octopusBot,
  play,
  SEEDS,
} from './bots';

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

  it('character switching: the three fish-hunting characters start on the same reef', () => {
    const reefs = CHARACTERS.filter((c) => c.prey === 'fish').map((c) => createHunt(c, 5));
    for (const s of reefs) {
      expect(s.captured).toBe(0);
      expect(s.venom.reserve).toBe(TUNING.venom.max);
      expect(s.fish.map((f) => f.pos)).toEqual(reefs[0]!.fish.map((f) => f.pos));
    }
  });

  it('Cipher starts a fresh hunt with its own scattered cone-snail layout, not a fish school', () => {
    const s = createHunt(OCTOPUS, 5);
    expect(s.captured).toBe(0);
    expect(s.venom.reserve).toBe(TUNING.venom.max);
    expect(s.fish).toHaveLength(TUNING.hunt.scatteredPreyCount);
    // Cone snails are solitary foragers (see docs/SCIENCE.md): each one is its own "school" of
    // one, unlike the three fish characters' grouped schools.
    expect(new Set(s.fish.map((f) => f.school)).size).toBe(s.fish.length);
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

describe('Cipher (camouflage + pounce + draw to mouth)', () => {
  it('a pounce that misses wastes venom and adds a cooldown penalty', () => {
    const s = createHunt(OCTOPUS, 9);
    const events = stepHunt(s, { ...NO_INPUT, secondary: true, aim: { x: 0, y: 0 } }, DT);
    expect(events.some((e) => e.type === 'strike-miss')).toBe(true);
    expect(s.venom.reserve).toBeLessThan(TUNING.venom.max);
  });

  it('Pounce restrains its catch immediately: synchronous grip, no separate lock step', () => {
    const s = createHunt(OCTOPUS, 9);
    const fish = s.fish[0]!;
    fish.pos = { x: s.snail.pos.x + 100, y: s.snail.pos.y };
    stepHunt(s, { ...NO_INPUT, secondary: true, aim: { ...fish.pos } }, DT);
    expect(s.tether?.fishId).toBe(fish.id);
    expect(fish.neural).toBeGreaterThan(0.9);
    // Set to 1 by the pounce itself; it decays a little from lockTau within the same frame's
    // later neural step (see stepNeural), same as every other instant-lock effect in this game.
    expect(fish.lock).toBeGreaterThan(0.99);
  });

  it('Pouncing ends an active Camouflage window immediately, hit or miss', () => {
    const s = createHunt(OCTOPUS, 9);
    s.camouflage = 5;
    stepHunt(s, { ...NO_INPUT, secondary: true, aim: { x: 0, y: 0 } }, DT);
    expect(s.camouflage).toBe(0);
  });

  it('Camouflage sharply reduces how much the shark notices the octopus moving', () => {
    const withCamo = createHunt(OCTOPUS, 3);
    const withoutCamo = createHunt(OCTOPUS, 3);
    for (const s of [withCamo, withoutCamo]) {
      s.predator.pos = { x: s.snail.pos.x + 150, y: s.snail.pos.y };
    }
    withCamo.camouflage = 5;
    for (let i = 0; i < 90; i++) {
      stepHunt(withCamo, { ...NO_INPUT, move: { x: 1, y: 0 } }, DT);
      stepHunt(withoutCamo, { ...NO_INPUT, move: { x: 1, y: 0 } }, DT);
    }
    expect(withCamo.predator.awareness).toBeLessThan(withoutCamo.predator.awareness);
  });

  it('wins every hunt with Camouflage → Pounce → Draw to Mouth', () => {
    expect(wins(SEEDS.map((seed) => play(OCTOPUS, seed, octopusBot())))).toBe(SEEDS.length);
  });

  it('Camouflage alone, never pouncing, never catches anything', () => {
    const results = SEEDS.map((seed) =>
      play(OCTOPUS, seed, (st) => ({ ...octopusBot()(st), secondary: false })),
    );
    expect(wins(results)).toBe(0);
  });

  it('skipping Camouflage still wins (cone snails are slow): it is a real benefit, not a required step', () => {
    expect(wins(SEEDS.map((seed) => play(OCTOPUS, seed, octopusBot(false))))).toBe(SEEDS.length);
  });

  it('Camouflage can keep the shark from ever starting a chase, where the same movement without it would trigger one', () => {
    const withCamo = createHunt(OCTOPUS, 3);
    const withoutCamo = createHunt(OCTOPUS, 3);
    for (const s of [withCamo, withoutCamo]) {
      s.predator.pos = { x: s.snail.pos.x + 150, y: s.snail.pos.y };
    }
    withCamo.camouflage = 5;
    for (let i = 0; i < 300; i++) {
      stepHunt(withCamo, { ...NO_INPUT, move: { x: 1, y: 0 } }, DT);
      stepHunt(withoutCamo, { ...NO_INPUT, move: { x: 1, y: 0 } }, DT);
    }
    // Without camouflage the shark notices, chases, and (being much faster) catches the octopus
    // within the window — it's already moved on to 'retreat' after grabbing. Camouflaged, it
    // never even starts a chase.
    expect(withoutCamo.predator.mode).not.toBe('patrol');
    expect(withCamo.predator.mode).toBe('patrol');
  });

  it('hunts cone snails, not reef fish: scattered individuals, no schooling, slower than reef fish', () => {
    expect(OCTOPUS.prey).toBe('snail');
    expect(TUNING.snailPrey.baseSpeedMax).toBeLessThan(TUNING.fish.baseSpeedMin);
    // Cone snails are solitary foragers (see docs/SCIENCE.md): the cohesion/separation terms that
    // give TUNING.fish its schooling behaviour are zeroed out for snail prey, on top of (not
    // instead of) each one already being placed as its own unique "school" of one.
    expect(TUNING.snailPrey.cohesionWeight).toBe(0);
    expect(TUNING.snailPrey.separationWeight).toBe(0);
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

describe('Glaucus (pursuit + burst + swallow whole)', () => {
  /** Isolate a single squid at `distance`, already fleeing at top speed (the worst case for a
   *  chase), start a pursuit on it, then simulate the chase to its conclusion (caught or lost),
   *  steering toward it every frame the way a player or bot would. */
  function chase(distance: number, useBurst: boolean) {
    const s = createHunt(BLUESHARK, 9);
    const fish = s.fish[0]!;
    fish.pos = { x: s.snail.pos.x + distance, y: s.snail.pos.y };
    fish.awareness = 1; // already fleeing at top speed from the first frame
    for (const f of s.fish) if (f !== fish) f.pos = { x: s.snail.pos.x + 5000, y: s.snail.pos.y };
    stepHunt(s, { ...NO_INPUT, primary: true }, DT);
    for (let i = 0; i < 400 && s.pursuit; i++) {
      const target = s.fish.find((f) => f.id === s.pursuit?.fishId) ?? fish;
      const move = normalize({
        x: target.pos.x - s.snail.pos.x,
        y: target.pos.y - s.snail.pos.y,
      });
      stepHunt(s, { ...NO_INPUT, move, secondary: useBurst }, DT);
    }
    return s;
  }

  it('a pursuit with nothing in range wastes energy and adds a cooldown penalty', () => {
    const s = createHunt(BLUESHARK, 9);
    for (const f of s.fish) f.pos = { x: s.snail.pos.x + 5000, y: s.snail.pos.y };
    const events = stepHunt(s, { ...NO_INPUT, primary: true }, DT);
    expect(events).toContainEqual({ type: 'pursuit-miss' });
    expect(s.venom.reserve).toBeLessThan(TUNING.venom.max);
    expect(s.venom.cooldowns.primary).toBeGreaterThan(2.5);
  });

  it('once caught, the squid is immediately fully restrained: no separate lock step', () => {
    const s = createHunt(BLUESHARK, 9);
    const fish = s.fish[0]!;
    fish.pos = { x: s.snail.pos.x + 20, y: s.snail.pos.y };
    for (const f of s.fish) if (f !== fish) f.pos = { x: s.snail.pos.x + 5000, y: s.snail.pos.y };
    stepHunt(s, { ...NO_INPUT, primary: true }, DT);
    expect(s.tether?.fishId).toBe(fish.id);
    expect(fish.neural).toBe(1);
    expect(fish.lock).toBe(1);
  });

  it('a bare chase can fail to catch a squid already fleeing at top speed', () => {
    expect(chase(170, false).tether).toBeNull();
  });

  it('Burst buys enough extra time to make the same chase succeed', () => {
    expect(chase(170, true).tether).not.toBeNull();
  });

  it('wins every hunt with Pursuit → Burst → Swallow Whole, despite the orca pod', () => {
    expect(wins(SEEDS.map((seed) => play(BLUESHARK, seed, blueSharkBot())))).toBe(SEEDS.length);
  });

  it('hunts squid, not reef fish or cone snails: scattered individuals, no schooling', () => {
    expect(BLUESHARK.prey).toBe('squid');
    expect(TUNING.squidPrey.cohesionWeight).toBe(0);
    expect(TUNING.squidPrey.separationWeight).toBe(0);
    const s = createHunt(BLUESHARK, 5);
    expect(s.fish).toHaveLength(TUNING.hunt.scatteredPreyCount);
    expect(new Set(s.fish.map((f) => f.school)).size).toBe(s.fish.length);
  });
});

describe('the orca pod (threatens Glaucus)', () => {
  it('is a pod of several threats, not a lone one, tuned differently from the octopus and shark', () => {
    const s = createHunt(BLUESHARK, 1);
    expect(s.pack).toHaveLength(TUNING.orcaPod.size - 1);
    expect(TUNING.orca.chaseSpeed).toBeGreaterThan(TUNING.shark.chaseSpeed);
    expect(TUNING.orca.grabRadius).toBeGreaterThan(TUNING.shark.grabRadius);
  });

  it('other characters have no pack: a single-threat hunt behaves exactly as before', () => {
    expect(createHunt(OCTOPUS, 1).pack).toHaveLength(0);
    expect(createHunt(ATLAS, 1).pack).toHaveLength(0);
  });

  it('a bite from any pod member stuns Glaucus and costs venom, using the orca tuning', () => {
    const s = createHunt(BLUESHARK, 3);
    const member = s.pack[0]!;
    member.pos = { x: s.snail.pos.x + 10, y: s.snail.pos.y };
    member.mode = 'chase';
    member.awareness = 1;
    const events = stepHunt(s, { ...NO_INPUT, move: { x: 1, y: 0 } }, DT);
    expect(events).toContainEqual({ type: 'grabbed' });
    expect(s.snail.stunned).toBeCloseTo(TUNING.orca.stunSeconds, 5);
    expect(s.venom.reserve).toBe(TUNING.venom.max - TUNING.orca.venomLost);
  });

  it('pack coordination: once one member is chasing, a patrolling packmate is alerted toward the player', () => {
    const s = createHunt(BLUESHARK, 4);
    // Put the lead far away, patrolling, and never close enough to notice on its own this frame.
    s.predator.pos = { x: 0, y: 0 };
    s.predator.mode = 'patrol';
    s.predator.awareness = 0;
    // One packmate is already chasing (as if it spotted the player a moment ago).
    const chaser = s.pack[0]!;
    chaser.mode = 'chase';
    const before = s.predator.awareness;
    stepHunt(s, NO_INPUT, DT);
    expect(s.predator.awareness).toBeGreaterThan(before);
  });

  it('a lone threat (no pack) has nothing to coordinate with: awareness only changes from its own stimulus', () => {
    const s = createHunt(OCTOPUS, 4);
    s.predator.pos = { x: 0, y: 0 };
    s.predator.mode = 'patrol';
    s.predator.awareness = 0;
    stepHunt(s, NO_INPUT, DT);
    // Far from the player and not moving: awareness should decay toward 0, not jump up.
    expect(s.predator.awareness).toBeLessThanOrEqual(0.01);
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
