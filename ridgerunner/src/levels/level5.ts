import type { LevelConfig } from './types';

// The widest crossing yet. A broad clearing dominates the middle of the map, too wide to risk
// in dry weather. A sheltered log corridor wraps the long way around its north edge for anyone
// unwilling to risk the open ground before the rain arrives; it's slower, but never dries you
// out as fast. A moss oasis sits mid-clearing. Rain falls partway through the run: time the
// crossing around it, or take the long way and let it pass you by.
export const level5: LevelConfig = {
  id: 'level-5',
  number: 5,
  name: 'When It Rains',
  tagline: 'Weather is an opportunity too.',
  biome: 'floodplain',
  intro: [
    'This crossing is wide. Too wide to risk in dry weather.',
    'A sheltered way wraps around the long way, if you don’t want to risk the open ground.',
    'Watch the sky. When it rains, the clearing gets a little kinder.',
  ],
  timeLimit: 140,
  rain: [{ at: 40, duration: 35 }],
  stars: [600, 900, 1250],
  map: [
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'X..............................................X',
    'X.LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL.X',
    'X.LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL.X',
    'X.LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL.X',
    'X.L..........................................L.X',
    'X.L..........................................L.X',
    'X.L.....CCCCCCCCXCCCCCCCCCCCCCCCCCCCCCCC.....L.X',
    'X.L.....CCCCCCCCXCCCCCCCCCCCCCCCCCCCCCCC.....L.X',
    'X~L~~~..CCCCCCCCXCCCCCCCCCCCCCCCCCCCCCCC..~~~L~X',
    'XP~~~~..CCCCCCCCXCCCCCCCCCCCCCCCCCCCCCCC..~~~~EX',
    'X~~~~~..CCCCCCCCCCCCCMMMMMMCCCCCCCCCCCCC..~~~~~X',
    'X~~~~~..CCCCCCCCCCCCCMMMMMMCCCCCCCCCCCCC..~~~~~X',
    'X.......CCCCCCCCCCCCCMMMMMMCCCCCCCCCCCCC.......X',
    'X.......CCCCCCCCCCCCCCCCCCCCCCCXCCCCCCCC.......X',
    'X.......CCCCCCCCCCCCCCCCCCCCCCCXCCCCCCCC.......X',
    'X.......CCCCCCCCCCCCCCCCCCCCCCCXCCCCCCCC.......X',
    'X.......CCCCCCCCCCCCCCCCCCCCCCCXCCCCCCCC.......X',
    'X..............................................X',
    'X..............................................X',
    'X..............................................X',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  ],
};
