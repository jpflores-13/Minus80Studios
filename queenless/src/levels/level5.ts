import { CHARACTERS } from '../content/characters';
import { site, withGenericWorkers } from './helpers';
import type { LevelConfig } from './types';

// Queenless from the start, and everything hits at once: a resource shortage on top of the
// brood that still needs tending, while reproductive competition starts showing up.
export const level5: LevelConfig = {
  id: 'level-5',
  number: 5,
  name: 'A Society in Chaos',
  tagline: 'Everyone is figuring it out at the same time.',
  intro: [
    'No queen, and now the flowers have thinned out too.',
    'Some meetings between workers aren’t just hellos anymore. That’s not a bug, that’s the colony working something out.',
  ],
  buzzPulseEnabled: true,
  colony: {
    durationSeconds: 90,
    startsQueenless: true,
    disturbances: [{ at: 20, kind: 'resourceShortage' }],
    sites: [
      site('storage', { x: 160, y: 300 }),
      site('flower', { x: 660, y: 150 }),
      site('flower', { x: 760, y: 300 }),
      site('flower', { x: 700, y: 460 }),
      site('flower', { x: 540, y: 540 }),
      site('flower', { x: 820, y: 420 }),
      site('broodCell', { x: 250, y: 150 }),
      site('broodCell', { x: 290, y: 450 }),
      site('broodCell', { x: 200, y: 560 }),
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
      4,
      105,
      { x: 400, y: 300 },
    ),
  },
  stars: [40, 60, 78],
};
