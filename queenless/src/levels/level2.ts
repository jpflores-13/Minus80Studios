import { CHARACTERS } from '../content/characters';
import { site, withGenericWorkers } from './helpers';
import type { LevelConfig } from './types';

// Autonomous workers, spatial preferences, local task demand, and Buzz Pulse.
export const level2: LevelConfig = {
  id: 'level-2',
  number: 2,
  name: 'Busy Bees',
  tagline: 'You are not the only one working.',
  intro: [
    'Pollen, Dash and Bumble each have their own idea of what needs doing, and go do it.',
    'Hold SPACE (or the pulse button) to ring a Buzz Pulse: nearby workers pay closer attention to what’s actually needed around them, for a few seconds.',
  ],
  buzzPulseEnabled: true,
  colony: {
    durationSeconds: 60,
    startsQueenless: false,
    disturbances: [],
    sites: [
      site('storage', { x: 160, y: 300 }),
      site('flower', { x: 660, y: 180 }),
      site('flower', { x: 740, y: 340 }),
      site('flower', { x: 600, y: 480 }),
      site('broodCell', { x: 260, y: 160 }),
      site('broodCell', { x: 300, y: 430 }),
      site('debris', { x: 420, y: 540 }),
    ],
    workers: withGenericWorkers(
      [
        { name: 'Buzzby', traits: CHARACTERS.buzzby.traits, isPlayer: true },
        { name: 'Pollen', traits: CHARACTERS.pollen.traits },
        { name: 'Dash', traits: CHARACTERS.dash.traits },
        { name: 'Bumble', traits: CHARACTERS.bumble.traits },
      ],
      0,
      102,
      { x: 400, y: 300 },
    ),
  },
  stars: [45, 65, 82],
};
