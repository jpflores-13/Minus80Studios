import { CHARACTERS } from '../content/characters';
import { site, withGenericWorkers } from './helpers';
import type { LevelConfig } from './types';

// The queen is gone partway through. Nothing you do causes it; it just happens, and the
// colony starts showing behaviour it never did before.
export const level4: LevelConfig = {
  id: 'level-4',
  number: 4,
  name: 'The Empty Throne',
  tagline: 'Something has changed, and it isn’t you.',
  intro: [
    'Keep the colony running, same as always.',
    'Watch Queenie. She has never done much of anything. That might not stay true.',
  ],
  buzzPulseEnabled: true,
  colony: {
    durationSeconds: 80,
    startsQueenless: false,
    disturbances: [{ at: 24, kind: 'queenLost' }],
    sites: [
      site('storage', { x: 160, y: 300 }),
      site('flower', { x: 660, y: 150 }),
      site('flower', { x: 760, y: 300 }),
      site('flower', { x: 700, y: 460 }),
      site('flower', { x: 540, y: 540 }),
      site('broodCell', { x: 250, y: 150 }),
      site('broodCell', { x: 290, y: 450 }),
      site('debris', { x: 420, y: 560 }),
      site('debris', { x: 220, y: 500 }),
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
      2,
      104,
      { x: 400, y: 300 },
    ),
  },
  stars: [45, 65, 82],
};
