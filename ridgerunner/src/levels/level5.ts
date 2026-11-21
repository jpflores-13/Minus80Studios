import type { LevelConfig } from './types';

// A clearing too wide to cross dry without real risk. Rain falls partway through: time the
// crossing around it, or spend the first minute getting there and wait for cover.
export const level5: LevelConfig = {
  id: 'level-5',
  number: 5,
  name: 'When It Rains',
  tagline: 'Weather is an opportunity too.',
  intro: [
    'This crossing is wide. Too wide to risk in dry weather.',
    'Watch the sky. When it rains, the clearing gets a little kinder.',
  ],
  timeLimit: 75,
  rain: [{ at: 18, duration: 22 }],
  stars: [750, 1050, 1300],
  map: [
    '############################################',
    '#..........................................#',
    '#.P~~~~~~~~~~....CCCCCCCCCCCCCCCC..........#',
    '#................MMMCCCCCCCCCCCCCCCC...~~~E#',
    '#................MMMCCCCCCCCCCCCCCCC.......#',
    '#..........................................#',
    '############################################',
  ],
};
