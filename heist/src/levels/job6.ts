import type { JobConfig } from './types';

// JOB 06: both arms locked again, but a fourth guard on the floor and a shorter clock. With the
// room this crowded, holding both shortcuts at once (two Folder devices) buys real margin that a
// single device can't match, not just convenience.
export const job6: JobConfig = {
  id: 'job-6',
  number: 6,
  name: 'Second Shift',
  briefing: [
    'Four guards on the floor tonight, not three. Both anchors are still behind one-way locks.',
    'Thirty-four seconds to the van once the diamond is in hand. That is not much room to spare.',
    'One Folder device holds one lock. With this many eyes in the room, holding both at once is',
    'worth more here than it has been before.',
  ],
  escapeSeconds: 34,
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
        [22, 7],
        [6, 7],
      ],
      speed: 58,
    },
  ],
  cameras: [
    { sweep: [30, 110], period: 5 },
    { sweep: [55, 145], period: 5.5 },
  ],
  stars: [2400, 3600, 4600],
  map: [
    '####################################',
    '####################################',
    '##================================##',
    '##=##############################=##',
    '##=#..........G...C.............#=##',
    '##=#.*...........G..............#=##',
    '##>#....XXG...XX....XX..........#<##',
    '##=#..................G...XX....#=##',
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
