import { bin, filter, trap } from './helpers';
import type { LevelConfig, PollutionSource } from './types';

const sources: PollutionSource[] = [
  {
    id: 'apartments',
    label: 'Apartments',
    pos: { x: 190, y: 250 },
    rate: 0.55,
    runoffResponse: 0.8,
    entry: { segmentId: 'north', s: 170 },
    look: 'apartments',
  },
  {
    id: 'market',
    label: 'Market',
    pos: { x: 440, y: 140 },
    rate: 0.45,
    runoffResponse: 0.6,
    entry: { segmentId: 'north', s: 380 },
    look: 'market',
  },
  {
    id: 'lot',
    label: 'Stadium Lot',
    pos: { x: 300, y: 430 },
    rate: 0.65,
    runoffResponse: 1,
    entry: { segmentId: 'south', s: 250 },
    look: 'lot',
  },
  {
    id: 'houses',
    label: 'Houses',
    pos: { x: 520, y: 540 },
    rate: 0.3,
    runoffResponse: 0.5,
    entry: { segmentId: 'south', s: 470 },
    look: 'houses',
  },
  {
    id: 'diner',
    label: 'Diner',
    pos: { x: 880, y: 220 },
    rate: 0.4,
    runoffResponse: 0.7,
    entry: { segmentId: 'main', s: 280 },
    look: 'store',
  },
];
const [apartments, market, lot, houses, diner] = sources as [
  PollutionSource,
  PollutionSource,
  PollutionSource,
  PollutionSource,
  PollutionSource,
];

/**
 * Level 2 — Two Rivers. Two tributaries meet and flow to the sea.
 * Lessons: confluences concentrate litter (one well-placed trap can serve both forks,
 * but fills faster); storm-drain filters stop litter before it reaches water; a light
 * shower raises runoff, most of all from paved areas.
 */
export const LEVEL_2: LevelConfig = {
  id: 'level-2',
  number: 2,
  name: 'Two Rivers',
  intro: 'Two creeks meet in the middle of town. Scout first: where does the litter really go?',
  teaches: [
    'Confluences gather litter from both forks',
    'Storm-drain filters catch litter before it reaches water',
    'Rain raises runoff, most from paved areas',
  ],
  seed: 202,
  generationSeconds: 50,
  durationSeconds: 64,
  target: 0.8,
  stars: { one: 0.8, two: 0.88, three: 0.94 },
  inventory: { gps: 1, bin: 2, filter: 1, trap: 2 },
  segments: [
    {
      id: 'north',
      points: [
        { x: 60, y: 110 },
        { x: 250, y: 150 },
        { x: 420, y: 230 },
        { x: 560, y: 300 },
        { x: 640, y: 340 },
      ],
      speed: 60,
      halfWidth: 18,
      downstream: 'main',
    },
    {
      id: 'south',
      points: [
        { x: 60, y: 580 },
        { x: 260, y: 520 },
        { x: 420, y: 470 },
        { x: 560, y: 400 },
        { x: 640, y: 340 },
      ],
      speed: 55,
      halfWidth: 18,
      downstream: 'main',
    },
    {
      id: 'main',
      points: [
        { x: 640, y: 340 },
        { x: 800, y: 320 },
        { x: 960, y: 370 },
        { x: 1100, y: 350 },
        { x: 1200, y: 360 },
      ],
      speed: 72,
      halfWidth: 26,
      downstream: null,
    },
  ],
  sources,
  hotspots: [],
  weather: [{ at: 24, duration: 16, intensity: 'light' }],
  slots: [
    bin(apartments, 0, 70),
    bin(market, 70, 0),
    bin(lot, -70, 0),
    bin(houses, 80, 0),
    bin(diner, 80, 0),
    filter(lot, 60, 50),
    filter(diner, -70, 40),
    trap('north', 'north', 300, 0.85),
    trap('south', 'south', 380, 0.85),
    trap('main-upper', 'main', 120, 0.8),
    trap('main-lower', 'main', 450, 0.85),
  ],
};
