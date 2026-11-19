import { TUNING, type Intensity } from '../config/tuning';
import type { LevelConfig, WeatherEvent } from '../levels/types';

export type Conditions = 'dry' | Intensity;

/** Weather at time t (seconds into the flow). */
export function conditionsAt(level: LevelConfig, t: number): Conditions {
  const e = level.weather.find((w) => t >= w.at && t < w.at + w.duration);
  return e?.intensity ?? 'dry';
}

/** The next rain that starts within the forecast window (or is already underway). */
export function forecast(
  level: LevelConfig,
  t: number,
): (WeatherEvent & { inSeconds: number }) | null {
  const upcoming = level.weather
    .filter((w) => t < w.at + w.duration && w.at - t <= TUNING.weather.forecastLead)
    .sort((a, b) => a.at - b.at)[0];
  return upcoming ? { ...upcoming, inSeconds: Math.max(0, upcoming.at - t) } : null;
}

// Water speed multiplier for the current weather.
export function flowFactor(c: Conditions): number {
  return TUNING.weather[c].flow;
}

// Chance per second that land litter washes into the drains. `response` (0-1) is how
// much a place sheds when it rains: paved lots near 1, parks much lower.
export function washRate(c: Conditions, response: number): number {
  return TUNING.weather[c].wash * response;
}

// How much more often snagged litter breaks free in this weather.
export function remobilizeFactor(c: Conditions): number {
  return TUNING.weather[c].remobilize;
}

export const INTENSITY_LABEL: Record<Conditions, string> = {
  dry: 'Dry',
  light: 'Light rain',
  moderate: 'Moderate rain',
  heavy: 'Heavy storm',
};
