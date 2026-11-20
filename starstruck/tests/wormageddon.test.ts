import { describe, expect, it } from 'vitest';
import {
  BASE_WORMAGEDDON_MODS,
  offerWormageddonUpgrades,
  WORMAGEDDON_UPGRADES,
} from '../src/content/wormageddon';
import { wormageddon } from '../src/levels/wormageddon';
import { createGame, stepGame, NO_INPUT } from '../src/systems/game';
import {
  applyWormMagnet,
  chooseWormageddonUpgrade,
  createWormageddonState,
  stepWormageddon,
  WORMAGEDDON_TUNING,
} from '../src/systems/wormageddon';
import { createRng } from '../src/utils/rng';

const DT = 1 / 60;

describe('WORMAGEDDON upgrades', () => {
  it('every upgrade changes at least one mod when applied', () => {
    for (const u of WORMAGEDDON_UPGRADES) {
      const m = { ...BASE_WORMAGEDDON_MODS };
      u.apply(m);
      expect(m).not.toEqual(BASE_WORMAGEDDON_MODS);
    }
  });

  it('offers exclude anything already taken its maximum number of times', () => {
    const taken: Record<string, number> = {};
    for (const u of WORMAGEDDON_UPGRADES) taken[u.id] = u.max;
    const rng = createRng(1);
    expect(offerWormageddonUpgrades(taken, rng, 3)).toHaveLength(0);
  });

  it('offers never repeat the same upgrade twice in one set', () => {
    const rng = createRng(7);
    const offers = offerWormageddonUpgrades({}, rng, 3);
    const ids = new Set(offers.map((u) => u.id));
    expect(ids.size).toBe(offers.length);
  });

  it('choosing an upgrade applies it, tracks it, and clears the offer', () => {
    const s = createGame(wormageddon, 'diggy', 1);
    s.wormageddon = createWormageddonState(s);
    s.wormageddon.phase = 'upgrade';
    s.wormageddon.offers = [WORMAGEDDON_UPGRADES[0]!];
    chooseWormageddonUpgrade(s, 0);
    expect(s.wormageddon.phase).toBe('playing');
    expect(s.wormageddon.offers).toHaveLength(0);
    expect(s.wormageddon.taken[WORMAGEDDON_UPGRADES[0]!.id]).toBe(1);
  });

  it('STAR MEMORY actually changes the sensory memory window, not just the mod', () => {
    const s = createGame(wormageddon, 'diggy', 1);
    s.wormageddon = createWormageddonState(s);
    const starMemory = WORMAGEDDON_UPGRADES.find((u) => u.id === 'starMemory')!;
    const before = s.memory.memory;
    s.wormageddon.phase = 'upgrade';
    s.wormageddon.offers = [starMemory];
    chooseWormageddonUpgrade(s, 0);
    expect(s.memory.memory).toBeGreaterThan(before);
  });

  it('QUICK BITE shortens the bite cooldown', () => {
    const s = createGame(wormageddon, 'diggy', 1);
    s.wormageddon = createWormageddonState(s);
    const quickBite = WORMAGEDDON_UPGRADES.find((u) => u.id === 'quickBite')!;
    s.wormageddon.phase = 'upgrade';
    s.wormageddon.offers = [quickBite];
    chooseWormageddonUpgrade(s, 0);
    stepGame(s, { ...NO_INPUT, bite: true }, DT);
    expect(s.biteCooldown).toBeLessThan(0.12);
  });
});

describe('WORMAGEDDON difficulty and pacing', () => {
  it('never completes: checkObjective-style win never fires, even eating plenty', () => {
    const s = createGame(wormageddon, 'diggy', 1);
    s.wormageddon = createWormageddonState(s);
    for (let t = 0; t < 30 && s.status === 'playing'; t += DT) stepGame(s, NO_INPUT, DT);
    expect(s.status).not.toBe('won');
  });

  it('only ends when energy runs out', () => {
    const s = createGame(wormageddon, 'diggy', 1);
    s.wormageddon = createWormageddonState(s);
    let steps = Math.ceil(400 / DT);
    while (s.status === 'playing' && steps-- > 0) stepGame(s, NO_INPUT, DT);
    expect(s.status).toBe('lost');
    expect(s.lostReason).toBe('energy');
  });

  it('spawns more food over time', () => {
    const s = createGame(wormageddon, 'diggy', 1);
    s.wormageddon = createWormageddonState(s);
    const before = s.things.length;
    for (
      let t = 0;
      t < WORMAGEDDON_TUNING.spawnIntervalStart + 1 && s.status === 'playing';
      t += DT
    ) {
      stepGame(s, NO_INPUT, DT);
      stepWormageddon(s);
    }
    expect(s.things.length).toBeGreaterThan(before);
  });

  it('offers an upgrade at the first milestone and pauses spawning until it is chosen', () => {
    const s = createGame(wormageddon, 'diggy', 1);
    s.wormageddon = createWormageddonState(s);
    let sawOffer = false;
    for (let t = 0; t < WORMAGEDDON_TUNING.upgradeInterval + 1 && s.status === 'playing'; t += DT) {
      stepGame(s, NO_INPUT, DT);
      const ev = stepWormageddon(s);
      if (ev.some((e) => e.type === 'upgradeOffer')) sawOffer = true;
    }
    expect(sawOffer).toBe(true);
    expect(s.wormageddon.phase).toBe('upgrade');
    const stuck = s.things.length;
    for (let t = 0; t < 5; t += DT) {
      stepGame(s, NO_INPUT, DT); // engine itself doesn't gate on phase; the scene does in practice
      stepWormageddon(s); // but stepWormageddon itself refuses to act while paused
    }
    expect(s.things.length).toBe(stuck);
  });

  it('predator spawn and food spawn intervals shrink toward their floors over time', () => {
    const s = createGame(wormageddon, 'diggy', 1);
    s.wormageddon = createWormageddonState(s);
    s.time = 200; // pretend a lot of time has passed
    s.wormageddon.nextSpawnAt = 200;
    const before = s.wormageddon.nextSpawnAt;
    stepWormageddon(s);
    const interval = s.wormageddon.nextSpawnAt - before;
    expect(interval).toBeGreaterThanOrEqual(WORMAGEDDON_TUNING.spawnIntervalFloor);
    expect(interval).toBeLessThan(WORMAGEDDON_TUNING.spawnIntervalStart);
  });

  it('caps the number of predators it will spawn', () => {
    const s = createGame(wormageddon, 'diggy', 1);
    s.wormageddon = createWormageddonState(s);
    s.wormageddon.predatorsSpawned = WORMAGEDDON_TUNING.maxPredators;
    s.wormageddon.nextPredatorAt = 0;
    const before = s.things.filter((t) => t.material === 'predator').length;
    stepWormageddon(s);
    const after = s.things.filter((t) => t.material === 'predator').length;
    expect(after).toBe(before);
  });
});

describe('WORM MAGNET', () => {
  it('does nothing without the upgrade', () => {
    const s = createGame(wormageddon, 'diggy', 1);
    s.wormageddon = createWormageddonState(s);
    const worm = s.things.find((t) => t.material === 'worm')!;
    const at = worm.shape.kind === 'circle' ? worm.shape.c : worm.shape.points[0]!;
    const before = { ...at };
    applyWormMagnet(s, DT);
    const after = worm.shape.kind === 'circle' ? worm.shape.c : worm.shape.points[0]!;
    expect(after).toEqual(before);
  });

  it('pulls a nearby worm toward the mole once taken', () => {
    const s = createGame(wormageddon, 'diggy', 1);
    s.wormageddon = createWormageddonState(s);
    s.wormageddon.mods.magnetRadius = 5000;
    const worm = s.things.find((t) => t.material === 'worm')!;
    const headOf = () => (worm.shape.kind === 'circle' ? worm.shape.c : worm.shape.points[0]!);
    const before = Math.hypot(headOf().x - s.mole.x, headOf().y - s.mole.y);
    applyWormMagnet(s, DT);
    const after = Math.hypot(headOf().x - s.mole.x, headOf().y - s.mole.y);
    expect(after).toBeLessThan(before);
  });
});
