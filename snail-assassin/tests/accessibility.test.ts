import { describe, expect, it } from 'vitest';
import { ATLAS } from '../src/characters/atlas';
import { CATALYST } from '../src/characters/catalyst';
import { TUNING } from '../src/config/tuning';
import { applyAssist } from '../src/systems/assist';
import { createHunt, NO_INPUT, stepHunt } from '../src/systems/hunt';

const DT = 1 / 60;

describe('relaxed mode', () => {
  it('has no time limit', () => {
    const s = createHunt(ATLAS, 4, undefined, { relaxed: true });
    for (let t = 0; t < TUNING.hunt.timeLimitSeconds + 30; t += 0.5) stepHunt(s, NO_INPUT, 0.5);
    expect(s.outcome).toBe('playing');
  });

  it('the octopus never grabs', () => {
    const s = createHunt(ATLAS, 3, undefined, { relaxed: true });
    s.predator.pos = { ...s.snail.pos };
    s.predator.mode = 'chase';
    const events = stepHunt(s, NO_INPUT, DT);
    expect(events).not.toContainEqual({ type: 'grabbed' });
    expect(s.snail.stunned).toBe(0);
    expect(s.venom.reserve).toBe(TUNING.venom.max);
  });
});

describe('assist mode', () => {
  it('captures automatically when a weakened fish is in reach', () => {
    const s = createHunt(ATLAS, 2);
    const fish = s.fish[0]!;
    fish.pos = { x: s.snail.pos.x + 20, y: s.snail.pos.y };
    fish.glucose = 0.1;
    expect(applyAssist(s, NO_INPUT).capture).toBe(true);
    stepHunt(s, applyAssist(s, NO_INPUT), DT);
    expect(s.captured).toBe(1);
  });

  it('does nothing when there is nothing to catch', () => {
    const s = createHunt(ATLAS, 2);
    expect(applyAssist(s, NO_INPUT)).toEqual(NO_INPUT);
  });

  it('aims abilities at a fish without a mouse', () => {
    const s = createHunt(CATALYST, 9);
    const fish = s.fish[0]!;
    fish.pos = { x: s.snail.pos.x + 90, y: s.snail.pos.y };
    const input = applyAssist(s, { ...NO_INPUT, primary: true });
    expect(input.aim).toEqual(fish.pos);
  });

  it('for Catalyst: locks, then reels in a struck fish on its own', () => {
    const s = createHunt(CATALYST, 9);
    const fish = s.fish[0]!;
    fish.pos = { x: s.snail.pos.x + 150, y: s.snail.pos.y };
    stepHunt(s, applyAssist(s, { ...NO_INPUT, primary: true }), DT);
    expect(s.tether?.fishId).toBe(fish.id);
    for (let i = 0; i < 600 && s.captured === 0; i++) stepHunt(s, applyAssist(s, NO_INPUT), DT);
    expect(s.captured).toBe(1);
  });
});
