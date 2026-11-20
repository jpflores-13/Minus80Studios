import type { JobConfig } from './types';

// JOB 03: both arms are locked this time, one '>' and one '<'. A single Folder can hold one
// link open at a time; two at once (Architect) is the only way to keep both shortcuts live.
export const job3: JobConfig = {
  id: 'job-3',
  number: 3,
  name: 'Double Take',
  briefing: [
    'A gallery with two wings. Both service anchors sit behind a one-way lock this time.',
    'One Folder device can hold one lock open. Two devices can hold both at once.',
    'Three guards on rotation, two cameras on their own sweeps. Watch the gaps between patrols.',
  ],
  escapeSeconds: 46,
  guards: [
    {
      route: [
        [17, 5],
        [27, 5],
        [27, 4],
        [8, 4],
        [8, 5],
      ],
      speed: 68,
    },
    {
      route: [
        [12, 5],
        [20, 5],
        [20, 6],
        [12, 6],
      ],
      speed: 60,
    },
  ],
  cameras: [
    { sweep: [40, 110], period: 6.5 },
    { sweep: [60, 130], period: 7.5 },
  ],
  stars: [1800, 2800, 3600],
  map: [
    '####################################',
    '####################################',
    '##================================##',
    '##=##############################=##',
    '##=#..............C........G....#=##',
    '##=#.*..........................#=##',
    '##>#....XX....XX....XX..........#<##',
    '##=#......G...............XX....#=##',
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
