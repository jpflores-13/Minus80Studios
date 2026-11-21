import type { LevelConfig } from './types';

// A branching headwater network, still one watershed. The short tributary isn't always faster.
export const level2: LevelConfig = {
  id: 'level-2',
  number: 2,
  name: 'Against the Current',
  tagline: 'The shortest-looking way isn’t always the fastest.',
  intro: [
    'This stream splits. Both branches reach the same place, eventually.',
    'Watch the forest floor between them: it drains you faster than water does.',
  ],
  timeLimit: 60,
  rain: [],
  stars: [700, 950, 1150],
  map: [
    '##################################',
    '#................................#',
    '#.P~~~~~~~~#######################',
    '#..........#.....................#',
    '#..........~~~~~~~~~~~~~~~~~~~~~E#',
    '#..........#.....................#',
    '#.........~~~#####################',
    '#..........#.....................#',
    '##################################',
  ],
};
