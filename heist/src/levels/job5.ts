import type { JobConfig } from './types';

// JOB 05: the capstone so far. Both arms locked, like Job 3. Three guards and a short escape
// window, like Job 4. Nothing new on its own, just everything at once.
export const job5: JobConfig = {
  id: 'job-5',
  number: 5,
  name: 'The Long Game',
  briefing: [
    'Everything you have learned so far, in one building: both anchors locked, three guards,',
    'two cameras, and only thirty-eight seconds to the van once the diamond is in hand.',
    'Decide which lock to commit to before you deploy. There usually is not time for both.',
  ],
  escapeSeconds: 38,
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
    { sweep: [55, 145], period: 5.5 },
  ],
  stars: [2200, 3300, 4200],
  map: [
    '####################################',
    '####################################',
    '##================================##',
    '##=##############################=##',
    '##=#..........G...C.............#=##',
    '##=#.*...........G..............#=##',
    '##>#....XXG...XX....XX..........#<##',
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
