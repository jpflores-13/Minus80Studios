import { TUNING, type Intensity } from '../config/tuning';
import type { LevelConfig, WeatherEvent } from '../levels/types';

export type Conditions = 'dry' | Intensity;

/** Weather at time t (seconds into the flow). */
export function conditionsAt(level: LevelConfig, t: number): Conditions {
  const e = level.weather.find((w) => t >= w.at && t < w.at + w.duration);
  return e?.intensity ?? 'dry';
}

/** The next event that starts within the forecast window (or is already underway). */
export function forecast(
  level: LevelConfig,
  t: number,
): (WeatherEvent & { inSeconds: number }) | null {
  const upcoming = level.weather
    .filter((w) => t < w.at + w.duration && w.at - t <= TUNING.weather.forecastLead)
    .sort((a, b) => a.at - b.at)[0];
  return upcoming ? { ...upcoming, inSeconds: Math.max(0, upcoming.at - t) } : null;
}

/** Multipliers for current conditions. `response` (0–1) scales how sensitive something is to rain. */
export function weatherFactor(
  c: Conditions,
  key: 'generation' | 'runoffDelay' | 'speed' | 'remobilize',
  response = 1,
): number {
  if (c === 'dry') return 1;
  const m = TUNING.weather[c][key];
  return 1 + (m - 1) * response;
}

export const INTENSITY_LABEL: Record<Conditions, string> = {
  dry: 'Dry',
  light: 'Light rain',
  moderate: 'Moderate rain',
  heavy: 'Heavy storm',
};
