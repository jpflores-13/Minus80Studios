import type { LevelConfig } from './types';

// Everything at once: lookalikes, open water, and something bigger patrolling the dark.
export const level6: LevelConfig = {
  id: 'level-6',
  number: 6,
  name: 'The Sixth Sense',
  objective: {
    kind: 'eat',
    materials: ['worm', 'larva', 'beetle', 'aquaWorm', 'aquaLarva'],
    count: 16,
  },
  timeLimit: 160,
  predators: [
    {
      route: [
        [17, 7],
        [12, 7],
        [12, 12],
        [17, 12],
      ],
    },
    {
      route: [
        [37, 9],
        [42, 9],
        [42, 14],
        [37, 14],
      ],
    },
  ],
  prompts: [
    {
      at: 'start',
      text: 'Everything you have learned, in one warren. And you are not the only hunter in it.',
    },
    { at: 'firstTouch', text: 'Touch it more than once before you trust what it is.' },
    { at: 'firstId', text: 'Soft and wriggly: food. Bite it once you are sure.' },
    { at: 'firstRock', text: 'Hard and still is never worth a bite.' },
    {
      at: 'firstPredator',
      text: 'Something big just hit you. It patrols until it notices you, then it will not stop.',
    },
    {
      at: 'firstSwim',
      text: 'Water again — mind your air, and SNIFF for what you cannot easily touch.',
    },
    { at: 'firstBubble', text: 'A bubble just reported back on something underwater.' },
    { at: 'firstEat', text: 'Energy restored. Keep the combo alive if you can.' },
    { at: 'firstDig', text: 'Soft soil gives way if you push into it.' },
    {
      at: 'focus',
      text: 'FOCUS sharpens ray 11 — your best tool for telling threat from food at a glance.',
    },
    { at: 'special', text: 'Special charged. Use it when it matters most.' },
  ],
  stars: [2200, 3600, 5200],
  map: [
    'OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO',
    'O...##...##...##...##...##...##...##...##..l##.b.O',
    'O.P.##.o...w.o..w..##..............w.............O',
    'O...##...##...##...##...##T..##o..##...##...##...O',
    'O#.####.#########.####b########################.#O',
    'O#.####.#########.####.########################.#O',
    'O...##...##.o.##...##...##...##..l##...##...##...O',
    'O.......o##...##.S.##..T##........##......w.##...O',
    'O...##...##...##...##...##.l.##...##...##...##...O',
    'O###########.####b####.####.####.####S####.####.#O',
    'O###########.####.####.####.####.#########.####.#O',
    'O...##...##.T.##...##...##..w##...##...##...##...O',
    'O.......l.l........##........##........##...##...O',
    'O...##o..##...##...##...##...##...##...##...##...O',
    'O#.##################################.####.####.#O',
    'O#.##########################~~~~~~~~~~~~~~~~~~~~O',
    'O...##...##...##...##...##...~~~~~~~~~~~~~~~~~~~~O',
    'O........##.............##...~~~~~~~~~~~~~~a~~~~~O',
    'O...##...##...##...##.o.##...~~~~~~~~~~~~~~~~~~~~O',
    'O######w####.#########.######~~~~~~~~~~~~~~~~~~~~O',
    'O######.####.#########.######~~~~~~~~~~~~~~~~~~~~O',
    'O.b.##...##...##...##...##...~~~~q~~~a~a~~~~~~~~~O',
    'O............w##..T........T.~~~~~~~~~~~~~~~~~~~~O',
    'O..o##..w##T..##...##...##...~~~a~~~~~~~q~~~~~~~~O',
    'O############################~~~~~~q~~~~~~~~~~~~~O',
    'O################################################O',
    'OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO',
  ],
};
