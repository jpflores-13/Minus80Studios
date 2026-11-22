import { bin, boom, filter, trap } from './helpers';
import type { LevelConfig, PollutionSource } from './types';

const sources: PollutionSource[] = [
  {
    id: 'houses',
    label: 'Neighborhood',
    pos: { x: 180, y: 340 },
    rate: 0.59,
    runoffResponse: 0.5,
    entry: { segmentId: 'creek', s: 150 },
    look: 'houses',
  },
  {
    id: 'school',
    label: 'School',
    pos: { x: 470, y: 170 },
    rate: 0.59,
    runoffResponse: 0.6,
    entry: { segmentId: 'creek', s: 400 },
    look: 'school',
  },
  {
    id: 'lot',
    label: 'Mall Lot',
    pos: { x: 300, y: 540 },
    rate: 0.72,
    runoffResponse: 1,
    entry: { segmentId: 'ditch', s: 70 },
    look: 'lot',
  },
  {
    id: 'apartments',
    label: 'Apartments',
    pos: { x: 640, y: 540 },
    rate: 0.52,
    runoffResponse: 0.8,
    entry: { segmentId: 'ditch', s: 230 },
    look: 'apartments',
  },
  {
    id: 'store',
    label: 'Gas Station',
    pos: { x: 900, y: 180 },
    rate: 0.52,
    runoffResponse: 0.9,
    entry: { segmentId: 'river', s: 200 },
    look: 'store',
  },
];
const [houses, school, lot, apartments, store] = sources as [
  PollutionSource,
  PollutionSource,
  PollutionSource,
  PollutionSource,
  PollutionSource,
];

/**
 * Level 3 — Storm Warning. A forecast storm sends a surge of runoff.
 * Lessons: traps overload in a storm; floating booms steer litter toward a trap that
 * spans only one side of the river; a cleanup crew can empty a full trap mid-storm.
 */
export const LEVEL_3: LevelConfig = {
  id: 'level-3',
  number: 3,
  name: 'Storm Warning',
  intro: 'A storm is coming. Traps that cope on a dry day may overflow when it hits.',
  teaches: [
    'Storms overload traps',
    'Booms guide floating litter toward a trap',
    'Cleanup crews empty a full trap',
    'A reusables program cuts a source’s litter for good',
  ],
  seed: 303,
  generationSeconds: 52,
  durationSeconds: 68,
  target: 0.9,
  stars: { one: 0.9, two: 0.94, three: 0.97 },
  inventory: { gps: 2, reusables: 1, bin: 2, filter: 1, trap: 2, boom: 1, cleanup: 1 },
  segments: [
    {
      id: 'creek',
      points: [
        { x: 60, y: 200 },
        { x: 300, y: 250 },
        { x: 520, y: 330 },
        { x: 700, y: 330 },
      ],
      speed: 60,
      halfWidth: 20,
      downstream: 'river',
    },
    {
      id: 'ditch',
      points: [
        { x: 420, y: 600 },
        { x: 560, y: 480 },
        { x: 700, y: 330 },
      ],
      speed: 75,
      halfWidth: 14,
      downstream: 'river',
    },
    {
      id: 'river',
      points: [
        { x: 700, y: 330 },
        { x: 880, y: 280 },
        { x: 1040, y: 360 },
        { x: 1200, y: 330 },
      ],
      speed: 68,
      halfWidth: 30,
      downstream: null,
    },
  ],
  sources,
  hotspots: [],
  weather: [
    { at: 8, duration: 10, intensity: 'light' },
    { at: 26, duration: 18, intensity: 'heavy' },
    { at: 50, duration: 14, intensity: 'light' },
  ],
  slots: [
    bin(houses, 0, 70),
    bin(school, 80, 0),
    bin(lot, -80, 0),
    bin(apartments, 80, 0),
    bin(store, 80, 0),
    filter(lot, 70, 50),
    filter(store, -80, 50),
    trap('creek', 'creek', 470, 0.85),
    trap('river-bank', 'river', 300, 0.5, -0.45),
    trap('river-far', 'river', 440, 0.5, 0.45),
    boom('river', 'river', 220),
  ],
};
