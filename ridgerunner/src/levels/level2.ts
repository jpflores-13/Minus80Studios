import type { LevelConfig } from './types';

// One watershed, two real branches. A dividing wall splits the map lengthwise: the stream
// loops up and over the top half, a dry floor-and-log corridor cuts straight across the
// bottom. The short dry way looks faster but drains moisture the whole way; the stream is
// longer but keeps Moss hydrated. Both routes open into a shared pool just before the exit.
export const level2: LevelConfig = {
  id: 'level-2',
  number: 2,
  name: 'Against the Current',
  tagline: 'The shortest-looking way isn’t always the fastest.',
  biome: 'headwater',
  intro: [
    'This stream loops the long way around. A dry shortcut cuts straight across below it.',
    'Watch the forest floor on the shortcut: it drains you faster than water does.',
  ],
  timeLimit: 85,
  rain: [],
  stars: [700, 1000, 1300],
  map: [
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'X..................................X',
    'X..................................X',
    'XP~~~~~............................X',
    'X.....~~~~~~~~~~~~~~~~~~~~~~~......X',
    'X...........................~......X',
    'X...........................~......X',
    'X.......................~~~~~......X',
    'X.......................~..........X',
    'X.XXXXXXXXXXXXXXXXXXXXXX~XXXXX.....X',
    'X.......................~~~~~~~~~~.X',
    'X.......MM.....LL.....LL....MM...~EX',
    'X.......MM.....LL.....LL....MM...~.X',
    'X.......MM.....LL.....LL....MM~~~~.X',
    'X..................................X',
    'X..................................X',
    'X..................................X',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  ],
};
