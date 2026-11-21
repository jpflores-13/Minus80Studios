import type { LevelConfig } from './types';

// The first real watershed crossing. A clearing (fast drain) and a line of fallen logs
// (sheltered, slower) offer two different routes across the same gap. A patch of moss sits
// between them as a place to catch your breath either way.
export const level4: LevelConfig = {
  id: 'level-4',
  number: 4,
  name: 'Over the Ridge',
  tagline: 'Away from the water, on purpose.',
  intro: [
    'No stream connects these two places. Only ground does.',
    'The open clearing is faster, but it dries you out fast. The fallen logs are slower, but kinder.',
    'A patch of moss sits between them if you need it.',
  ],
  timeLimit: 75,
  rain: [],
  stars: [700, 1000, 1250],
  map: [
    '########################################',
    '#......................................#',
    '#.P~~~~~~~~~~~......CCCCC...LLL........#',
    '#..............MMM..CCCCC...LLL........#',
    '#..............MMM..........LLL.~~~~~~E#',
    '#......................................#',
    '########################################',
  ],
};
