import type { JobConfig } from './types';

// JOB 01: a jewellery store. The long service corridor runs all the way round the back; fold it
// and the far end is right next to the vault.
export const job1: JobConfig = {
  id: 'job-1',
  number: 1,
  name: 'The Diamond District',
  briefing: [
    'An upscale jewellery store. One guard, one camera, one very large diamond.',
    'The service corridor goes the long way round, all the way to the vault.',
    'Stand in the corridor and press SPACE to deploy the Folder. Its two ends reel the corridor in from both sides.',
    'When the ends are far apart, they connect: step into one and you come out of the other.',
  ],
  escapeSeconds: 45,
  guards: [
    {
      route: [
        [17, 9],
        [29, 9],
        [29, 5],
        [5, 5],
        [5, 9],
      ],
      speed: 70,
    },
  ],
  cameras: [{ sweep: [55, 125], period: 7 }],
  stars: [1500, 2300, 3000],
  map: [
    '####################################',
    '####################################',
    '##================================##',
    '##=##############################=##',
    '##=#..............C.............#=##',
    '##=#.*..........................#=##',
    '##=#....XX....XX....XX..........#=##',
    '##=#......................XX....#=##',
    '##=#....XX....XX....XX..........#=##',
    '##=#.............G..............#=##',
    '##A#............................#A##',
    '##=#####.###################.####=##',
    '##...........#############........##',
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
