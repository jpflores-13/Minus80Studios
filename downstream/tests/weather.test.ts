import { describe, expect, it } from 'vitest';
import { getLevel } from '../src/levels';
import { conditionsAt, flowFactor, forecast, washRate } from '../src/systems/weather';

describe('weather', () => {
  const level = getLevel('level-3');
  const storm = level.weather.find((w) => w.intensity === 'heavy')!;

  it('follows the level timeline', () => {
    expect(conditionsAt(level, storm.at + 1)).toBe('heavy');
    expect(conditionsAt(level, storm.at + storm.duration + 0.5)).not.toBe('heavy');
  });

  it('warns before rain starts', () => {
    expect(forecast(level, storm.at - 5)?.inSeconds).toBeCloseTo(5);
  });

  it('nothing washes off the land in dry weather, and the water barely moves', () => {
    expect(washRate('dry', 1)).toBe(0);
    expect(flowFactor('dry')).toBeLessThan(0.5);
  });

  it('harder rain washes more and flows faster; paved places shed more than parks', () => {
    expect(washRate('heavy', 1)).toBeGreaterThan(washRate('light', 1));
    expect(flowFactor('heavy')).toBeGreaterThan(flowFactor('light'));
    expect(washRate('moderate', 1)).toBeGreaterThan(washRate('moderate', 0.3));
  });
});
