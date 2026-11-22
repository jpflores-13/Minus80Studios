import type { LevelConfig } from './types';

// A small, shaded headwater stream. Teaches movement and the stream's moisture regen, plus a
// short dead-end tributary so a branch can exist without being required. Old-growth headwater
// biome: narrow, canopy-shaded water and a dense understory (see docs/SCIENCE.md).
export const level1: LevelConfig = {
  id: 'level-1',
  number: 1,
  name: 'Little Creek',
  tagline: 'Follow the water.',
  biome: 'headwater',
  intro: [
    'Moss has always followed the water.',
    'Move with the arrow keys, WASD, or drag. The stream keeps you hydrated as you go.',
    'A neighbour is waiting just downstream.',
  ],
  timeLimit: 70,
  rain: [],
  stars: [650, 950, 1250],
  map: [
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'X..............................X',
    'X.....~~~~..........MMMM.......X',
    'X...MM~.............MMMM.......X',
    'X...MM~........................X',
    'X.....~...........~~~~~~~~~~~..X',
    'X.....~...........~.........~..X',
    'X.....~...........~.........~..X',
    'XP~~~~~~~~~.......~.........~..X',
    'X.........~.....LL~...~~~~~~~.EX',
    'X.........~.....LL~............X',
    'X.........~~~~~~~~~............X',
    'X..............................X',
    'X..............................X',
    'X..............................X',
    'X..............................X',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  ],
};
