import type { LevelConfig } from './types';

// Two watersheds that never touch. Moss's stream winds through the upper-left, then simply
// ends; a wide band of open forest floor (with one moss alcove as a halfway rest, and a short
// run of logs for cover) is the only way across to a second, unrelated stream network that
// winds down to the destination. The moment the game is about, now with real distance to it.
export const level3: LevelConfig = {
  id: 'level-3',
  number: 3,
  name: 'End of the Line',
  tagline: 'The water runs out. The forest doesn’t.',
  biome: 'end-of-stream',
  intro: [
    'This stream just... ends.',
    'But something is calling from somewhere else entirely, across open ground.',
    'Moss has never left the water for this long before.',
  ],
  timeLimit: 95,
  rain: [],
  stars: [750, 1050, 1400],
  map: [
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'X......................................X',
    'X......................................X',
    'XP~~~~~~~.....~~~~.....................X',
    'X.......~.....~........................X',
    'X.......~.....~...........LL...........X',
    'X.......~~~~~~~...........LL...........X',
    'X......................................X',
    'X....................MMM...............X',
    'X....................MMM...............X',
    'X....................MMM~~~~~~~........X',
    'X.......................~.....~........X',
    'X.......................~.LL..~........X',
    'X.......................~~~L..~........X',
    'X.............................~........X',
    'X.............................~~~~~~~.EX',
    'X......................................X',
    'X......................................X',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  ],
};
