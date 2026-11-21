import type { JobConfig } from './types';

// JOB 07: the last job. Both locks, five guards, the fastest sweeps and the shortest clock in the
// campaign. Getting out clean (Perfect Crime) here means never once being wrong about a gap.
export const job7: JobConfig = {
  id: 'job-7',
  number: 7,
  name: 'The Last Job',
  briefing: [
    'Five guards. Two cameras on their fastest sweeps yet. Both anchors locked, same as before.',
    'Thirty seconds to the van once the diamond is in hand. There is no room left to improvise.',
    'This is everything you have learned, all at once. Plan the whole route before you move.',
  ],
  escapeSeconds: 30,
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
    {
      route: [
        [16, 7],
        [6, 7],
      ],
      speed: 58,
    },
    {
      route: [
        [19, 7],
        [24, 7],
        [24, 8],
        [19, 8],
      ],
      speed: 56,
    },
  ],
  cameras: [
    { sweep: [25, 115], period: 5 },
    { sweep: [50, 150], period: 5.5 },
  ],
  stars: [2700, 4000, 5000],
  map: [
    '####################################',
    '####################################',
    '##================================##',
    '##=##############################=##',
    '##=#..........G...C.............#=##',
    '##=#.*...........G..............#=##',
    '##>#....XXG...XX....XX..........#<##',
    '##=#......G........G......XX....#=##',
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
