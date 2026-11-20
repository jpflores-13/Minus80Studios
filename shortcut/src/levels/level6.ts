import type { LevelConfig } from './types';

// Maintenance and depot choices from a budget. Longer-lasting machines aren't always better.
export const level6: LevelConfig = {
  id: 'level-6',
  number: 6,
  name: 'Nothing Lasts Forever',
  tagline: 'Every machine retires. When should it?',
  intro: [
    'The Power Plant and the Factory are far apart, and the old checkpoints here are worn: ends slip past them now and then.',
    'This time you set the city’s policies. Maintenance decides how long a machine works before the crews retire it.',
    'Retire them too soon and no shortcut ever reaches both buildings. Keep them too long and slipped machines sit uselessly at the edges of town.',
    'You can also speed up the depot and add machines to the fleet. Everything costs from one budget.',
  ],
  hint: 'Choose a maintenance plan, a depot speed and a fleet size within the budget, then run.',
  bins: 36,
  durationSeconds: 60,
  buildings: [
    {
      id: 'plant',
      name: 'Power Plant',
      kind: 'plant',
      role: 'supplier',
      resource: 'power',
      bin: 6,
      active: true,
    },
    {
      id: 'factory',
      name: 'Factory',
      kind: 'factory',
      role: 'consumer',
      resource: 'power',
      bin: 29,
      active: true,
    },
  ],
  districts: [],
  fixedDepots: [17],
  fixedCheckpoints: [
    { bin: 6, facing: 1, reliability: 0.75 },
    { bin: 29, facing: -1, reliability: 0.75 },
  ],
  tools: { depots: 0, checkpoints: 0 },
  engine: { bypassPerSecond: 0.15, speed: 3 },
  policies: {
    budget: 4,
    lifetime: [
      { label: 'Short (4s)', value: 4, cost: 0 },
      { label: 'Medium (12s)', value: 12, cost: 1 },
      { label: 'Long (60s)', value: 60, cost: 2 },
    ],
    loading: [
      { label: 'Normal', value: 5, cost: 0 },
      { label: 'Fast', value: 1, cost: 2 },
    ],
    fleet: [
      { label: '1 machine', value: 1, cost: 0 },
      { label: '2 machines', value: 2, cost: 1 },
      { label: '3 machines', value: 3, cost: 2 },
    ],
  },
  goal: { metric: 'service', one: 0.3, two: 0.42, three: 0.52 },
};
