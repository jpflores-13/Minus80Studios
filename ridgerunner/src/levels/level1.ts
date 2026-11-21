import type { LevelConfig } from './types';

// A small, shaded headwater stream. Teaches movement and the stream's moisture regen.
export const level1: LevelConfig = {
  id: 'level-1',
  number: 1,
  name: 'Little Creek',
  tagline: 'Follow the water.',
  intro: [
    'Moss has always followed the water.',
    'Move with the arrow keys, WASD, or drag. The stream keeps you hydrated as you go.',
    'A neighbour is waiting just downstream.',
  ],
  timeLimit: 45,
  rain: [],
  stars: [600, 850, 1050],
  map: [
    '############################',
    '#..........................#',
    '#.P~~~~~~~~~~~~~~~~~~~~~~E.#',
    '#..........................#',
    '############################',
  ],
};
