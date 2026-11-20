import type { JobConfig } from './types';

// JOB 02: the same long corridor, but the west arm has a one-way lock on it. The east anchor
// is still a clean two-way link; the west one holds unless you get lucky, or bring Phantom.
export const job2: JobConfig = {
  id: 'job-2',
  number: 2,
  name: 'One-Way Street',
  briefing: [
    'A bigger showroom, two guards, two cameras watching different angles.',
    'The east anchor still links cleanly, same as before.',
    'The west anchor sits behind a one-way lock. Most of the time it holds the Folder’s end short of the anchor.',
    'It isn’t perfectly reliable, and some crew members read it better than others.',
  ],
  escapeSeconds: 48,
  guards: [
    {
      route: [
        [30, 4],
        [30, 8],
        [20, 8],
        [20, 4],
      ],
      speed: 70,
    },
    {
      route: [
        [17, 8],
        [8, 8],
        [8, 5],
        [17, 5],
      ],
      speed: 75,
    },
  ],
  cameras: [
    { sweep: [35, 105], period: 6 },
    { sweep: [70, 140], period: 8 },
  ],
  stars: [1700, 2600, 3400],
  map: [
    '####################################',
    '####################################',
    '##================================##',
    '##=##############################=##',
    '##=#..............C...........G.#=##',
    '##=#.*..........................#=##',
    '##>#....XX....XX....XX..........#=##',
    '##=#......................XX....#=##',
    '##=#....XX....XX....XX..........#=##',
    '##=#.............G..............#=##',
    '##A#............................#A##',
    '##=#####.###################.####=##',
    '##...........#############...C.*..##',
    '##...........#############........##',
    '##...........#############.*......##',
    '##...........#############....D...##',
    '##...........#############........##',
    '######.#############################',
    '#..................................#',
    '#.V.P..............................#',
    '#..................................#',
    '####################################',
  ],
};
