import type { CityState } from './city';
import { uptime } from './city';
import type { LevelConfig } from '../levels/types';

export interface Score {
  /** The number the level is judged on (deliveries, or average consumer uptime 0-1). */
  value: number;
  stars: number;
  passed: boolean;
  /** Share of all shortcut time spent joining two districts. */
  mixups: number;
  tooManyMixups: boolean;
  perConsumer: { id: string; name: string; uptime: number }[];
}

export function scoreRun(level: LevelConfig, city: CityState): Score {
  const consumers = level.buildings.filter((b) => b.role === 'consumer');
  const perConsumer = consumers.map((c) => ({
    id: c.id,
    name: c.name,
    uptime: uptime(city, c.id),
  }));
  const service =
    perConsumer.length > 0 ? perConsumer.reduce((s, c) => s + c.uptime, 0) / perConsumer.length : 0;
  const value = level.goal.metric === 'deliveries' ? city.deliveries : service;
  const mixups = city.shortcutTime > 0 ? city.crossDistrictTime / city.shortcutTime : 0;
  const tooManyMixups = level.goal.maxMixups !== undefined && mixups > level.goal.maxMixups;
  const g = level.goal;
  const earned = value >= g.three ? 3 : value >= g.two ? 2 : value >= g.one ? 1 : 0;
  const stars = tooManyMixups ? 0 : earned;
  return { value, stars, passed: stars > 0, mixups, tooManyMixups, perConsumer };
}

export function formatValue(level: LevelConfig, value: number): string {
  return level.goal.metric === 'deliveries'
    ? `${Math.round(value)} deliveries`
    : `${Math.round(value * 100)}% running`;
}
