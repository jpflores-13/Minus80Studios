import type { JobConfig } from './types';

// JOB 04: same single west-side lock as Job 2, but three guards and a much shorter escape
// window. The puzzle isn't new ground, the clock is.
export const job4: JobConfig = {
  id: 'job-4',
  number: 4,
  name: 'Night Watch',
  briefing: [
    'A full night shift: three guards on rotation, two cameras on tight sweeps.',
    'The west anchor is still behind its one-way lock. The east one links clean.',
    'Thirty-six seconds to the van once you have the diamond. Plan the route before you grab it.',
  ],
  escapeSeconds: 36,
  guards: [
    {
      route: [
        [17, 5],
        [27, 5],
        [27, 4],
        [8, 4],
        [8, 5],
      ],
      speed: 72,
    },
    {
      route: [
        [10, 6],
        [20, 6],
      ],
      speed: 60,
    },
    {
      route: [
        [14, 4],
        [23, 4],
        [23, 6],
        [14, 6],
      ],
      speed: 66,
    },
  ],
  cameras: [
    { sweep: [30, 110], period: 5 },
    { sweep: [60, 150], period: 5.5 },
  ],
  stars: [2000, 3000, 3800],
  map: [
    '####################################',
    '####################################',
    '##================================##',
    '##=##############################=##',
    '##=#..........G...C.............#=##',
    '##=#.*...........G..............#=##',
    '##>#....XXG...XX....XX..........#=##',
    '##=#......................XX....#=##',
    '##=#....XX....XX....XX..........#=##',
    '##=#............................#=##',
    '##A#............................#A##',
    '##=#####.###################.####=##',
    '##...........#############........##',
    '##...........#############........##',
    '##...........#############.*..C...##',
    '##...........#############....D...##',
    '##...........#############........##',
    '######.#############################',
    '#..................................#',
    '#.V.P..............................#',
    '#..................................#',
    '####################################',
  ],
};
