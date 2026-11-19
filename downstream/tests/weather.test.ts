import { describe, expect, it } from 'vitest';
import { getLevel } from '../src/levels';
import { conditionsAt, forecast, weatherFactor } from '../src/systems/weather';

describe('weather', () => {
  const level = getLevel('level-3');
  const storm = level.weather[0]!;

  it('follows the level timeline', () => {
    expect(conditionsAt(level, storm.at - 1)).toBe('dry');
    expect(conditionsAt(level, storm.at + 1)).toBe(storm.intensity);
    expect(conditionsAt(level, storm.at + storm.duration + 1)).toBe('dry');
  });

  it('gives a forecast with warning before the storm', () => {
    expect(forecast(level, storm.at - 10)?.inSeconds).toBeCloseTo(10);
    expect(forecast(level, 0)).toBeNull();
  });

  it('affects sensitive places more than insensitive ones', () => {
    expect(weatherFactor('heavy', 'generation', 1)).toBeGreaterThan(
      weatherFactor('heavy', 'generation', 0.3),
    );
    expect(weatherFactor('dry', 'generation', 1)).toBe(1);
  });
});
