import type { LevelConfig } from './types';

// WORMAGEDDON's arena. Not one of the six campaign levels, so it's never added to LEVELS: it
// skips level-select, star thresholds and the "every level cleared" achievements entirely.
// The initial scatter of food just gets you started; src/systems/wormageddon.ts keeps spawning
// more (and eventually predators) for as long as you last.
export const wormageddon: LevelConfig = {
  id: 'wormageddon',
  number: 0,
  name: 'WORMAGEDDON',
  objective: { kind: 'endless' },
  timeLimit: Infinity,
  prompts: [
    {
      at: 'start',
      text: 'No way to win this one. Eat, dig and swim for as long as you can survive.',
    },
    { at: 'firstEat', text: 'Keep eating. More food keeps turning up the longer you last.' },
    {
      at: 'firstPredator',
      text: 'Something new is loose in here. More of these will show up over time.',
    },
    { at: 'special', text: 'Special charged. Spend it when it matters.' },
  ],
  stars: [0, 0, 0],
  map: [
    'OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO',
    'O...##...##...##.T.##...##...##..w##..l##...###O',
    'O.P.##.w.##.l........o..##........##........###O',
    'O...##o..##...##.w.##...##..b##...##..w##...###O',
    'O#.####.####.#########.####.####.####T####.####O',
    'O#.####.####.#########.####o####.####.####.####O',
    'O...##.l.##...##...##..w##...##.w.##...##...###O',
    'O...##wb.##...##...##o.......##b.......##..o###O',
    'O...##...##...##...##.w.##.T.##...##...##...###O',
    'O#.####.####.####.########################.####O',
    'O#T####.####.####.########################.####O',
    'O...##...##.l.##...##.w.##...##...##...##...###O',
    'Ow.w##..........T...b.w.##..................###O',
    'O..w##...##...##...##...##...##...##...##...###O',
    'O#.####.###################.##############.####O',
    'O#.####.###################.##############.####O',
    'O.T.##...##...##...##...##...##~~a##~~~##~~~###O',
    'O.o.##..o.....##........##....~~~~~~~~~##~~~###O',
    'O...##...##...##...##.l.##o..##~a~##~~~##~~~###O',
    'O#l##############.####.##############~####~####O',
    'O#.##############.####.##############~####a####O',
    'O...##l..##w.o##...##...##o..##~q~##~~~##~~~###O',
    'O..................##..l......~~~q~~~~~##q~a###O',
    'O...##...##...##...##...##...##~~a##~~~##~~~###O',
    'O##############################################O',
    'OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO',
  ],
};
