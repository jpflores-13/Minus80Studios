import type { LevelConfig } from './types';

// Two streams that never touch. The destination's stream has no connection to the one Moss
// starts in: the only way across is a short walk over open ground. The moment the game is about.
export const level3: LevelConfig = {
  id: 'level-3',
  number: 3,
  name: 'End of the Line',
  tagline: 'The water runs out. The forest doesn’t.',
  intro: [
    'This stream just... ends.',
    'But something is calling from somewhere else entirely.',
    'Moss has never left the water before.',
  ],
  timeLimit: 60,
  rain: [],
  stars: [650, 900, 1100],
  map: [
    '####################################',
    '#..................................#',
    '#.P~~~~~~~~~~~~~~..................#',
    '#................MMM...............#',
    '#..................~~~~~~~~~~~~~~E.#',
    '#..................................#',
    '####################################',
  ],
};
