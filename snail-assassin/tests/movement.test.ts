import { describe, expect, it } from 'vitest';
import { directionFromKeys, directionToward, stepVelocity } from '../src/systems/movement';
import { length } from '../src/utils/math';

const params = { maxSpeed: 100, acceleration: 200, deceleration: 400 };

describe('stepVelocity', () => {
  it('accelerates toward the input direction', () => {
    const v = stepVelocity({ x: 0, y: 0 }, { x: 1, y: 0 }, params, 0.1);
    expect(v).toEqual({ x: 20, y: 0 });
  });

  it('never exceeds max speed, even after a long time', () => {
    let v = { x: 0, y: 0 };
    for (let i = 0; i < 100; i++) v = stepVelocity(v, { x: 1, y: 1 }, params, 0.1);
    expect(length(v)).toBeCloseTo(params.maxSpeed);
  });

  it('decelerates to a stop with no input', () => {
    const v = stepVelocity({ x: 30, y: 0 }, { x: 0, y: 0 }, params, 0.1);
    expect(v).toEqual({ x: 0, y: 0 });
  });
});

describe('input directions', () => {
  it('normalizes diagonal keyboard input', () => {
    expect(length(directionFromKeys(false, true, true, false))).toBeCloseTo(1);
  });

  it('opposite keys cancel out', () => {
    expect(directionFromKeys(true, true, false, false)).toEqual({ x: 0, y: 0 });
  });

  it('stops steering inside the arrival radius', () => {
    expect(directionToward({ x: 0, y: 0 }, { x: 5, y: 0 }, 10)).toEqual({ x: 0, y: 0 });
    expect(directionToward({ x: 0, y: 0 }, { x: 50, y: 0 }, 10)).toEqual({ x: 1, y: 0 });
  });
});
