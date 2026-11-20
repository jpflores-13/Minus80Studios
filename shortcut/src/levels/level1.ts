import type { LevelConfig } from './types';

// One machine, one depot to place. Teaches that shortcuts form and fall apart on their own.
export const level1: LevelConfig = {
  id: 'level-1',
  number: 1,
  name: 'The Long Way Home',
  tagline: 'Bread goes cold on the long road.',
  intro: [
    'Welcome to Ferngate. The Bakery is at one end of Long Road and the Café is at the other. That is a long walk for a loaf of bread.',
    'Shortcut machines can help. A machine starts at a depot, then stretches a shortcut out in both directions at once, a little at a time.',
    'When one end of a shortcut is next to the Bakery and the other end is next to the Café, bread can cross. Machines wander and wear out, so every shortcut is temporary.',
    'Place the depot anywhere on the road, then press RUN. Aim for as many deliveries as you can in one minute.',
  ],
  hint: 'Tap the road to place your depot. Where will both ends reach their buildings soonest?',
  bins: 32,
  durationSeconds: 60,
  buildings: [
    {
      id: 'bakery',
      name: 'Bakery',
      kind: 'bakery',
      role: 'supplier',
      resource: 'bread',
      bin: 1,
      active: true,
    },
    {
      id: 'cafe',
      name: 'Café',
      kind: 'cafe',
      role: 'consumer',
      resource: 'bread',
      bin: 30,
      active: true,
    },
  ],
  districts: [],
  fixedDepots: [],
  fixedCheckpoints: [],
  tools: { depots: 1, checkpoints: 0 },
  engine: { fleet: 1, lifetimeMean: 12 },
  goal: { metric: 'deliveries', one: 8, two: 16, three: 24 },
};
