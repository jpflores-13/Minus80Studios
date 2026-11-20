import type { LevelConfig } from './types';

// Checkpoints, and why their direction matters. Facing inward (→ … ←) holds a shortcut in place.
export const level2: LevelConfig = {
  id: 'level-2',
  number: 2,
  name: 'One Way Street',
  tagline: 'The Café wants bread all day, not now and then.',
  intro: [
    'The depot is fixed this time, and the machines keep overshooting. Their ends roll right past the buildings.',
    'You have two checkpoints. A checkpoint stops a machine end coming from the side its arrow points at. Ends coming from behind it roll straight through.',
    'Tap the road to place a checkpoint. Tap it again to turn it around, and once more to pick it up. Checkpoints sometimes let an end slip past.',
    'Keep the Café running for as much of the minute as you can.',
  ],
  hint: 'A checkpoint stops ends coming from the side its arrow points at. Tap to place, turn, or remove.',
  bins: 32,
  durationSeconds: 60,
  buildings: [
    {
      id: 'bakery',
      name: 'Bakery',
      kind: 'bakery',
      role: 'supplier',
      resource: 'bread',
      bin: 6,
      active: true,
    },
    {
      id: 'cafe',
      name: 'Café',
      kind: 'cafe',
      role: 'consumer',
      resource: 'bread',
      bin: 25,
      active: true,
    },
  ],
  districts: [],
  fixedDepots: [15],
  fixedCheckpoints: [],
  tools: { depots: 0, checkpoints: 2 },
  engine: { fleet: 2, lifetimeMean: 20 },
  goal: { metric: 'service', one: 0.35, two: 0.55, three: 0.7 },
};
