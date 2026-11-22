import { describe, expect, it } from 'vitest';
import { ATLAS } from '../src/characters/atlas';
import { TUNING } from '../src/config/tuning';
import { stepFish } from '../src/systems/fish';
import { createHunt, NO_INPUT, stepHunt } from '../src/systems/hunt';
import { createPredator, stepPredator } from '../src/systems/predator';
import { createRng } from '../src/utils/rng';

const arena = { width: 1280, height: 720 };
const DT = 1 / 60;

describe('octopus', () => {
  it('barely notices a snail that holds still', () => {
    const o = createPredator(arena, createRng(1));
    const snail = { x: o.pos.x - 80, y: o.pos.y };
    for (let i = 0; i < 300; i++) stepPredator(o, snail, 0, arena, createRng(2), DT);
    expect(o.mode).not.toBe('chase');
  });

  it('chases a snail that moves nearby', () => {
    const o = createPredator(arena, createRng(1));
    const snail = { x: o.pos.x - 80, y: o.pos.y };
    for (let i = 0; i < 120 && o.mode !== 'chase'; i++)
      stepPredator(o, snail, 1, arena, createRng(2), DT);
    expect(o.mode).toBe('chase');
  });

  it('a grab stuns the snail and costs venom, but the hunt goes on', () => {
    const s = createHunt(ATLAS, 3);
    s.predator.pos = { x: s.snail.pos.x + 10, y: s.snail.pos.y };
    s.predator.mode = 'chase';
    s.predator.awareness = 1;
    const events = stepHunt(s, { ...NO_INPUT, move: { x: 1, y: 0 } }, DT);
    expect(events).toContainEqual({ type: 'grabbed' });
    expect(s.snail.stunned).toBeGreaterThan(0);
    expect(s.venom.reserve).toBeLessThanOrEqual(TUNING.venom.max - TUNING.predator.venomLost + 1);
    expect(s.outcome).toBe('playing');
    // stunned: can't move or use abilities
    const before = { ...s.snail.pos };
    stepHunt(s, { ...NO_INPUT, move: { x: 1, y: 0 }, primary: true, aim: { x: 600, y: 300 } }, DT);
    expect(s.clouds).toHaveLength(0);
    expect(Math.hypot(s.snail.pos.x - before.x, s.snail.pos.y - before.y)).toBeLessThan(1);
  });

  it('swims away after a grab', () => {
    const s = createHunt(ATLAS, 3);
    s.predator.pos = { ...s.snail.pos };
    s.predator.mode = 'chase';
    stepHunt(s, NO_INPUT, DT);
    expect(s.predator.mode).toBe('retreat');
  });
});

describe('the shark', () => {
  it('notices a motionless target from much closer than the octopus would, not from across the sight radius', () => {
    const octopus = createPredator(arena, createRng(1));
    const shark = createPredator(arena, createRng(1));
    const stillTarget = (p: { x: number; y: number }) => ({ x: p.x - 80, y: p.y });
    for (let i = 0; i < 300; i++) {
      stepPredator(octopus, stillTarget(octopus.pos), 0, arena, createRng(2), DT, TUNING.predator);
      stepPredator(shark, stillTarget(shark.pos), 0, arena, createRng(2), DT, TUNING.shark);
    }
    // Neither chases from 80px away while motionless (electroreception in the real study worked
    // at a much shorter range than this), but the shark's awareness still climbs further.
    expect(octopus.mode).not.toBe('chase');
    expect(shark.mode).not.toBe('chase');
    expect(shark.awareness).toBeGreaterThan(octopus.awareness);
  });
});

describe('wrap-around reef', () => {
  it('a fish swimming off the right edge comes back on the left', () => {
    const s = createHunt(ATLAS, 1);
    const f = s.fish[0]!;
    f.pos = { x: arena.width - 1, y: 300 };
    f.vel = { x: 200, y: 0 };
    f.heading = 0;
    stepFish(f, [f], { x: 0, y: 0 }, 0, arena, createRng(1), 0.05);
    expect(f.pos.x).toBeLessThan(50);
  });

  it('the snail wraps too', () => {
    const s = createHunt(ATLAS, 1);
    s.snail.pos = { x: 2, y: 300 };
    s.snail.vel = { x: -60, y: 0 };
    stepHunt(s, { ...NO_INPUT, move: { x: -1, y: 0 } }, 0.1);
    expect(s.snail.pos.x).toBeGreaterThan(arena.width - 50);
  });
});
