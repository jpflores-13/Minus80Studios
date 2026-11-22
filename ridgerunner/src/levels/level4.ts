import type { LevelConfig } from './types';

// No stream connects these two places. Only ground does. A rock ridge splits the crossing into
// two zigzagging lanes: an exposed clearing route on top (faster, drains hard, forced to weave
// through narrow gaps between blocks), a fallen-log route below (slower, gentler, same weaving
// the other way). A moss saddle cut through the ridge lets Moss swap lanes partway. A short
// stream pocket waits at the far side, the first water in the whole level.
export const level4: LevelConfig = {
  id: 'level-4',
  number: 4,
  name: 'Over the Ridge',
  tagline: 'Away from the water, on purpose.',
  biome: 'ridge',
  intro: [
    'No stream connects these two places. Only ground does.',
    'The open clearing is faster, but it dries you out fast. The fallen logs are slower, but kinder.',
    'A gap in the ridge lets you swap between them, if you need to.',
  ],
  timeLimit: 115,
  rain: [],
  stars: [450, 680, 950],
  map: [
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'X..........................................X',
    'X.CCCCCCCCCCC.CCCCCCCCCCC.CCCCCCCCCCC......X',
    'X.CCCCCCCCCCC.CCCCCCCCCCC.CCCCCCCCCCC......X',
    'X.CCCCCCCCCCC.CCCCCCCCCCC.CCCCCCCCCCC......X',
    'X.CCCCCCCCCCC.CCCCCCCCCCC.CCCCCCCCCCC......X',
    'X.CCCCCCCCCCC.CCCCCCCCCCC.CCCCCCCCCCC......X',
    'X.CCCCCCCCCCC.CCCCCCCCCCC.CCCCCCCCCCC......X',
    'X..X....X....X....XMMM.X....X....X.........X',
    'XPXXXXXXXXXXXXXXXXXMMMXXXXXXXXXXXXXXXX~~~~EX',
    'X....X....X....X...MMM...X....X....X..~~~~~X',
    'X..................MMM.....................X',
    'X.LLLLLLLLLLL.LLLLLLLLLLL.LLLLLLLLLLL......X',
    'X.LLLLLLLLLLL.LLLLLLLLLLL.LLLLLLLLLLL......X',
    'X.LLLLLLLLLLL.LLLLLLLLLLL.LLLLLLLLLLL......X',
    'X.LLLLLLLLLLL.LLLLLLLLLLL.LLLLLLLLLLL......X',
    'X.LLLLLLLLLLL.LLLLLLLLLLL.LLLLLLLLLLL......X',
    'X.LLLLLLLLLLL.LLLLLLLLLLL.LLLLLLLLLLL......X',
    'X..........................................X',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  ],
};
