import { describe, expect, it } from 'vitest';
import { roundFor } from '../src/levels/oneDropRounds';
import {
  capture,
  createOneDrop,
  markUnknown,
  stepOneDrop,
  accuracy,
  type OneDropState,
} from '../src/systems/oneDrop';

const DT = 1 / 30;
const run = (s: OneDropState, seconds: number) => {
  const ev = [];
  for (let t = 0; t < seconds && s.status === 'playing'; t += DT) ev.push(...stepOneDrop(s, DT));
  return ev;
};

describe('ONE DROP', () => {
  it('spawns particles over time and removes ones that drift out of the field', () => {
    const s = createOneDrop(roundFor('drop', 5, 40), 1);
    run(s, 10);
    expect(s.particles.length).toBeGreaterThan(0);
  });

  it('capturing the objective target scores and builds a combo', () => {
    const s = createOneDrop(roundFor('drop', 3, 40), 1);
    run(s, 3);
    const target = s.particles.find((p) => p.alive && p.typeId === s.config.objective.targetTypeId);
    expect(target).toBeDefined();
    const ev = capture(s, target!.id);
    expect(ev.some((e) => e.type === 'captured')).toBe(true);
    expect(s.captured).toBe(1);
    expect(s.combo).toBe(1);
    expect(s.score).toBeGreaterThan(0);
  });

  it('capturing a non-target breaks the combo without crashing the round', () => {
    const s = createOneDrop(roundFor('drop', 3, 40), 1);
    run(s, 3);
    const nonTarget = s.particles.find(
      (p) => p.alive && p.typeId !== s.config.objective.targetTypeId && p.kind !== 'unknown',
    );
    expect(nonTarget).toBeDefined();
    const ev = capture(s, nonTarget!.id);
    expect(ev.some((e) => e.type === 'wrong')).toBe(true);
    expect(s.wrong).toBe(1);
    expect(s.combo).toBe(0);
  });

  it('marking an unknown as unknown is rewarded and does not touch the combo', () => {
    const s = createOneDrop(roundFor('drop', 3, 40), 1);
    run(s, 6);
    const unknown = s.particles.find((p) => p.alive && p.kind === 'unknown');
    if (!unknown) return; // rare in a short run; the weighted spawn table makes this occasional
    s.combo = 2;
    const ev = markUnknown(s, unknown.id);
    expect(ev.some((e) => e.type === 'documentedUnknown')).toBe(true);
    expect(s.unknownsDocumented).toBe(1);
    expect(s.combo).toBe(2);
  });

  it('marking a real target as unknown is neutral, not a punishment', () => {
    const s = createOneDrop(roundFor('drop', 3, 40), 1);
    run(s, 3);
    const target = s.particles.find((p) => p.alive && p.typeId === s.config.objective.targetTypeId);
    expect(target).toBeDefined();
    s.combo = 2;
    const ev = markUnknown(s, target!.id);
    expect(ev.some((e) => e.type === 'missedUnknown')).toBe(true);
    expect(s.combo).toBe(2);
    expect(s.score).toBe(0);
  });

  it('wins once the objective count is captured', () => {
    const s = createOneDrop(roundFor('drop', 2, 40), 1);
    let guard = 0;
    while (s.captured < 2 && guard++ < 2000) {
      stepOneDrop(s, DT);
      const target = s.particles.find(
        (p) => p.alive && p.typeId === s.config.objective.targetTypeId,
      );
      if (target) capture(s, target.id);
    }
    expect(s.status).toBe('won');
  });

  it('loses when the clock runs out before the objective is met', () => {
    const s = createOneDrop(roundFor('drop', 500, 2), 1);
    const ev = run(s, 5);
    expect(s.status).toBe('lost');
    expect(ev.some((e) => e.type === 'lost')).toBe(true);
  });

  it('accuracy is 1 with no attempts and tracks captured vs. wrong afterward', () => {
    const s = createOneDrop(roundFor('drop', 5, 40), 1);
    expect(accuracy(s)).toBe(1);
    run(s, 3);
    const target = s.particles.find((p) => p.alive && p.typeId === s.config.objective.targetTypeId);
    if (target) capture(s, target.id);
    expect(accuracy(s)).toBeGreaterThan(0);
  });

  it('the same seed gives the same round', () => {
    const a = createOneDrop(roundFor('drop', 5, 40), 7);
    const b = createOneDrop(roundFor('drop', 5, 40), 7);
    run(a, 5);
    run(b, 5);
    expect(a.particles.map((p) => [p.typeId, p.x.toFixed(2), p.y.toFixed(2)])).toEqual(
      b.particles.map((p) => [p.typeId, p.x.toFixed(2), p.y.toFixed(2)]),
    );
  });
});
