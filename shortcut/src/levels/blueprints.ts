import type { Layout, Overrides } from '../systems/run';
import { checkpoint as cp } from '../systems/run';
import type { LevelConfig } from './types';

export type Knob = 'lifetime' | 'fleet' | 'reliability';

export interface Blueprint {
  id: string;
  name: string;
  brief: string;
  /** What the player should take away once it matches. */
  lesson: string;
  /** The hidden city that made the target map. */
  hidden: { layout: Layout; overrides: Overrides };
  /** Where the player starts. */
  start: { layout: Layout; overrides: Overrides };
  knobs: Knob[];
  tools: { depots: number; checkpoints: number };
  clues: string[];
  /** Similarity (0-100) needed to solve it. */
  pass: number;
}

/** A plain road for Blueprint: no buildings, just addresses. */
export const BLUEPRINT_TOWN: LevelConfig = {
  id: 'blueprint',
  number: 0,
  name: 'Blueprint',
  tagline: '',
  intro: [],
  hint: '',
  bins: 30,
  durationSeconds: 300,
  buildings: [],
  districts: [],
  fixedDepots: [],
  fixedCheckpoints: [],
  tools: { depots: 3, checkpoints: 6 },
  engine: { fleet: 4, lifetimeMean: 20 },
  goal: { metric: 'service', one: 0, two: 0, three: 0 },
};

export const TARGET_SEED = 11;
export const PLAYER_SEED = 29;
export const SECONDS = 1200;

export const BLUEPRINTS: Blueprint[] = [
  {
    id: 'one-loop',
    name: 'One Loop',
    brief:
      'The target map has one bright spot away from the diagonal. Rebuild the city that made it.',
    lesson:
      'A bright off-diagonal dot is two addresses held together again and again: an anchored shortcut.',
    hidden: { layout: { depots: [15], checkpoints: [cp(8, 1), cp(22, -1)] }, overrides: {} },
    start: { layout: { depots: [], checkpoints: [] }, overrides: {} },
    knobs: [],
    tools: { depots: 1, checkpoints: 2 },
    clues: [
      'The bright dot sits at two addresses. Read them off the map’s edges.',
      'Something must stop the ends there. Which way should each checkpoint face?',
      'The depot has to sit between the two addresses.',
    ],
    pass: 75,
  },
  {
    id: 'two-neighbourhoods',
    name: 'Two Neighbourhoods',
    brief:
      'Two bright squares, side by side, barely touching. Make two districts that keep to themselves.',
    lesson:
      'Squares on the map are districts: stretches that connect inside far more than across their edges.',
    hidden: {
      layout: { depots: [7, 22], checkpoints: [cp(2, 1), cp(13, -1), cp(16, 1), cp(27, -1)] },
      overrides: {},
    },
    start: { layout: { depots: [], checkpoints: [] }, overrides: {} },
    knobs: [],
    tools: { depots: 2, checkpoints: 4 },
    clues: [
      'Each square needs its own depot inside it.',
      'The corners of each square are where its shortcuts are held.',
      'Inward-facing pairs of checkpoints make a square’s corners.',
    ],
    pass: 70,
  },
  {
    id: 'same-picture',
    name: 'Same Picture, Different Story',
    brief:
      'The checkpoints are already where the hidden city had them, but here they hold nothing. Tune the city until the map matches. There is more than one way.',
    lesson:
      'Fleet size and lifetime change how much connecting happens, but barely change the pattern. A good match doesn’t prove you found the hidden settings, only settings that look the same on the map.',
    hidden: {
      layout: { depots: [15], checkpoints: [cp(5, 1), cp(25, -1)] },
      overrides: { engine: { lifetimeMean: 60, fleet: 2 }, reliability: 0.9 },
    },
    start: {
      layout: { depots: [15], checkpoints: [cp(5, 1), cp(25, -1)] },
      overrides: { engine: { lifetimeMean: 60, fleet: 1 }, reliability: 0 },
    },
    knobs: ['reliability', 'lifetime', 'fleet'],
    tools: { depots: 1, checkpoints: 2 },
    clues: [
      'The target has a bright corner at the two checkpoints. Yours runs all the way to the ends of the road.',
      'How often do the checkpoints hold?',
      'Once it matches, try a different fleet or lifetime. Does the map change much?',
    ],
    pass: 75,
  },
];
