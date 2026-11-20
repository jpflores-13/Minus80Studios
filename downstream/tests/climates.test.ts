import { describe, expect, it } from 'vitest';
import { getLevel } from '../src/levels';
import { CLIMATE_ORDER, CLIMATES, monthAt, yearWeather } from '../src/levels/climates';
import { conditionsAt } from '../src/systems/weather';

describe('climates', () => {
  it.each(CLIMATE_ORDER)('%s has twelve months with names', (id) => {
    const c = CLIMATES[id];
    expect(c.months).toHaveLength(12);
    expect(c.monthNames).toHaveLength(12);
  });

  it('turns rainy months into showers inside those months', () => {
    const c = CLIMATES.monsoon;
    const events = yearWeather(c, 72);
    expect(events).toHaveLength(c.months.filter((m) => m !== 'dry').length);
    for (const e of events) expect(c.months[monthAt(72, e.at)]).toBe(e.intensity);
  });

  it('the monsoon year starts dry and gets its rain late', () => {
    const level = getLevel('level-1', 'monsoon');
    expect(conditionsAt(level, 10)).toBe('dry');
    expect(level.weather[0]!.at).toBeGreaterThan(level.durationSeconds / 2);
  });

  it('four seasons has rain spread through the year', () => {
    const level = getLevel('level-1', 'four-seasons');
    expect(level.weather[0]!.at).toBeLessThan(level.durationSeconds / 6);
    expect(level.weather.some((w) => w.intensity === 'heavy')).toBe(true);
  });

  it('levels that are not year-long keep their own weather', () => {
    expect(getLevel('level-2', 'monsoon').weather).toEqual(
      getLevel('level-2', 'four-seasons').weather,
    );
  });
});
