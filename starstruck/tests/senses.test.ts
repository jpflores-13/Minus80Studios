import { describe, expect, it } from 'vitest';
import { rayCapsule, rayCircle } from '../src/systems/geometry';
import { probe, RAYS, rayLength, SensoryMemory, type Touchable } from '../src/systems/senses';

const pebble = (x: number, y: number, id = 1): Touchable => ({
  id,
  material: 'rock',
  shape: { kind: 'circle', c: { x, y }, r: 5 },
});
const pose = { x: 0, y: 0, heading: 0 };
const ray11 = RAYS.find((r) => r.number === 11 && r.side === 1)!;

describe('the 22 rays', () => {
  it('there are 22, eleven on each side', () => {
    expect(RAYS).toHaveLength(22);
    expect(RAYS.filter((r) => r.side === -1)).toHaveLength(11);
  });

  it('ray 11 is the sharp one, and the rays are not all the same length', () => {
    const others = RAYS.filter((r) => r.number !== 11);
    expect(ray11.resolution).toBeGreaterThan(Math.max(...others.map((r) => r.resolution)));
    expect(new Set(RAYS.map((r) => r.length.toFixed(1))).size).toBeGreaterThan(4);
  });

  it('focus reaches further only with ray 11', () => {
    expect(rayLength(ray11, true)).toBeGreaterThan(rayLength(ray11, false));
    const r1 = RAYS[0]!;
    expect(rayLength(r1, true)).toBe(rayLength(r1, false));
  });
});

describe('touch, not sight', () => {
  it('a ray only reports something it physically reaches', () => {
    expect(probe(ray11, pose, [pebble(30, 2)], false)).not.toBeNull();
    expect(probe(ray11, pose, [pebble(80, 0)], false)).toBeNull();
  });

  it('things behind you are never felt', () => {
    for (const r of RAYS) expect(probe(r, pose, [pebble(-30, 0)], false)).toBeNull();
  });

  it('reports the nearest of two things on the same ray', () => {
    const c = probe(ray11, pose, [pebble(36, 2, 2), pebble(26, 2, 1)], true);
    expect(c?.id).toBe(1);
  });

  it('walls are felt too', () => {
    const c = probe(ray11, pose, [], false, (x) => (x > 25 ? 'soil' : null));
    expect(c?.material).toBe('soil');
  });

  it('ray maths: circles and capsules', () => {
    expect(rayCircle({ x: 0, y: 0 }, { x: 1, y: 0 }, 50, { x: 20, y: 0 }, 5)).toBeCloseTo(15);
    expect(rayCircle({ x: 0, y: 0 }, { x: 1, y: 0 }, 10, { x: 20, y: 0 }, 5)).toBeNull();
    expect(
      rayCapsule({ x: 0, y: 0 }, { x: 1, y: 0 }, 50, { x: 20, y: -10 }, { x: 20, y: 10 }, 2),
    ).toBeCloseTo(18, 0);
  });
});

describe('sensory memory', () => {
  const touch = (res: number) => ({
    ray: { ...ray11, resolution: res },
    id: 7,
    material: 'worm',
    x: 1,
    y: 1,
    dist: 1,
  });

  it('marks fade and are pruned after the memory window', () => {
    const m = new SensoryMemory(2);
    m.add(touch(1), 0, 1);
    expect(m.fade(m.marks[0]!, 1)).toBeCloseTo(0.5);
    m.prune(3);
    expect(m.marks).toHaveLength(0);
  });

  it('sharp rays build confidence faster than ordinary ones', () => {
    const sharp = new SensoryMemory(2);
    const blunt = new SensoryMemory(2);
    sharp.add(touch(1), 0, 1);
    blunt.add(touch(0.2), 0, 1);
    expect(sharp.confidence(7, 0)).toBeGreaterThan(blunt.confidence(7, 0) * 3);
  });

  it('confidence drains once you stop touching', () => {
    const m = new SensoryMemory(2);
    m.add(touch(1), 0, 1);
    expect(m.confidence(7, 1)).toBe(1);
    expect(m.confidence(7, 3.5)).toBeLessThan(1);
    expect(m.confidence(7, 10)).toBe(0);
  });

  it('acuity (Sherlock) multiplies what each touch tells you', () => {
    const m = new SensoryMemory(2);
    m.add(touch(0.5), 0, 1.5);
    expect(m.confidence(7, 0)).toBeCloseTo(0.75);
  });
});
