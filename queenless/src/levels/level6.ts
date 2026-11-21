import { CHARACTERS } from '../content/characters';
import { site, withGenericWorkers } from './helpers';
import type { LevelConfig } from './types';

// The capstone: everything from the last five levels, at once, for the longest stretch yet.
// Distributed interaction, not one hero worker (or one player), is what gets the colony through.
export const level6: LevelConfig = {
  id: 'level-6',
  number: 6,
  name: 'Stronger Together',
  tagline: 'No queen, no single bee holding it up.',
  intro: [
    'This is the whole colony now: every flower, every cell, every bit of debris you’ve seen.',
    'You can’t be everywhere. Trust the workers to find what needs doing, and spend your pulses where it counts.',
  ],
  buzzPulseEnabled: true,
  colony: {
    durationSeconds: 100,
    startsQueenless: true,
    disturbances: [
      { at: 25, kind: 'removeForagers', count: 2 },
      { at: 55, kind: 'resourceShortage' },
    ],
    sites: [
      site('storage', { x: 160, y: 300 }),
      site('flower', { x: 660, y: 150 }),
      site('flower', { x: 760, y: 300 }),
      site('flower', { x: 700, y: 460 }),
      site('flower', { x: 540, y: 540 }),
      site('flower', { x: 820, y: 420 }),
      site('flower', { x: 780, y: 180 }),
      site('broodCell', { x: 250, y: 150 }),
      site('broodCell', { x: 290, y: 450 }),
      site('broodCell', { x: 200, y: 560 }),
      site('debris', { x: 420, y: 560 }),
      site('debris', { x: 220, y: 500 }),
      site('debris', { x: 300, y: 200 }),
    ],
    workers: withGenericWorkers(
      [
        { name: 'Buzzby', traits: CHARACTERS.buzzby.traits, isPlayer: true },
        { name: 'Pollen', traits: CHARACTERS.pollen.traits },
        { name: 'Dash', traits: CHARACTERS.dash.traits },
        { name: 'Bumble', traits: CHARACTERS.bumble.traits },
        { name: 'Stinger', traits: CHARACTERS.stinger.traits },
        { name: 'Queenie', traits: CHARACTERS.queenie.traits },
      ],
      6,
      106,
      { x: 400, y: 300 },
    ),
  },
  stars: [40, 60, 78],
};
