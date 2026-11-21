import { CHARACTERS } from '../content/characters';
import { site, withGenericWorkers } from './helpers';
import type { LevelConfig } from './types';

// Remove several active foragers partway through: can the colony redistribute the work itself?
export const level3: LevelConfig = {
  id: 'level-3',
  number: 3,
  name: 'Missing in Action',
  tagline: 'Someone has to notice the flowers are piling up.',
  intro: [
    'A few of your best foragers won’t be coming back today.',
    'Nobody is going to reassign anyone. Watch for who notices the flowers filling up, and help them get there with a pulse.',
  ],
  buzzPulseEnabled: true,
  colony: {
    durationSeconds: 70,
    startsQueenless: false,
    disturbances: [{ at: 18, kind: 'removeForagers', count: 2 }],
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
      ],
      3,
      103,
      { x: 400, y: 300 },
    ),
  },
  stars: [45, 65, 82],
};
