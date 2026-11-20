import type { Conditions } from '../systems/weather';
import type { WeatherEvent } from './types';

// The town is made up, but players pick a climate based on real regions, which sets the shape of
// the year. Month-by-month patterns are simplified for play; see docs/SCIENCE.md.

export type ClimateId = 'four-seasons' | 'monsoon';

export interface Climate {
  id: ClimateId;
  name: string;
  basedOn: string;
  summary: string;
  /** Month names in the order the level's year runs. */
  monthNames: string[];
  /** Rain in each of those months. */
  months: Conditions[];
}

export const CLIMATES: Record<ClimateId, Climate> = {
  'four-seasons': {
    id: 'four-seasons',
    name: 'Four Seasons',
    basedOn: 'like North Carolina',
    summary:
      'Rain through most of the year, wettest in summer with thunderstorms and tropical storms, and a drier fall.',
    monthNames: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],
    months: [
      'light',
      'light',
      'moderate',
      'light',
      'light',
      'moderate',
      'heavy',
      'heavy',
      'moderate',
      'dry',
      'dry',
      'light',
    ],
  },
  monsoon: {
    id: 'monsoon',
    name: 'Monsoon',
    basedOn: 'like South Asia',
    summary:
      'Dry months while litter piles up, then the monsoon arrives in June and rain washes it all in.',
    monthNames: [
      'Dec',
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
    ],
    months: [
      'dry',
      'dry',
      'dry',
      'dry',
      'dry',
      'dry',
      'moderate',
      'heavy',
      'heavy',
      'moderate',
      'light',
      'dry',
    ],
  },
};

export const CLIMATE_ORDER: ClimateId[] = ['four-seasons', 'monsoon'];

// Turn a climate into rain showers across a level's year. Each rainy month gets one shower
// that fills most of the month, so dry gaps between months stay visible.
export function yearWeather(climate: Climate, durationSeconds: number): WeatherEvent[] {
  const monthLength = durationSeconds / 12;
  const events: WeatherEvent[] = [];
  climate.months.forEach((rain, i) => {
    if (rain === 'dry') return;
    events.push({
      at: i * monthLength + monthLength * 0.1,
      duration: monthLength * 0.8,
      intensity: rain,
    });
  });
  return events;
}

// Which month of the year (0-11) a moment in the level falls in.
export function monthAt(durationSeconds: number, t: number): number {
  return Math.min(11, Math.max(0, Math.floor((t / durationSeconds) * 12)));
}
