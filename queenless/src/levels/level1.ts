import { CHARACTERS } from '../content/characters';
import { site, withGenericWorkers } from './helpers';
import type { LevelConfig } from './types';

// Movement, foraging, resource transport, the nest. Nothing autonomous to watch yet.
export const level1: LevelConfig = {
  id: 'level-1',
  number: 1,
  name: 'The Daily Buzz',
  tagline: 'An ordinary day, for now.',
  intro: [
    'GOAL: keep the colony’s FOOD, BROOD and NEST bars (top left) high until the timer runs out. The fuller they stay, the more stars.',
    'Move with the arrows, WASD, or drag. Walk onto a flower to gather nectar, then carry it back to the honeypot to deliver it. That’s the whole job, today.',
  ],
  buzzPulseEnabled: false,
  colony: {
    durationSeconds: 45,
    startsQueenless: false,
    disturbances: [],
    sites: [
      site('storage', { x: 160, y: 300 }),
      site('flower', { x: 640, y: 210 }),
      site('flower', { x: 700, y: 380 }),
      site('flower', { x: 560, y: 470 }),
    ],
    workers: withGenericWorkers(
      [{ name: 'Buzzby', traits: CHARACTERS.buzzby.traits, isPlayer: true }],
      0,
      101,
      { x: 400, y: 300 },
    ),
  },
  stars: [40, 60, 80],
};
