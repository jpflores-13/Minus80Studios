import { bin, boom, filter, trap } from './helpers';
import type { LevelConfig, PollutionSource } from './types';

const sources: PollutionSource[] = [
  {
    id: 'houses',
    label: 'Houses',
    pos: { x: 170, y: 290 },
    rate: 0.45,
    runoffResponse: 0.5,
    entry: { segmentId: 'west', s: 120 },
    look: 'houses',
  },
  {
    id: 'park',
    label: 'Park',
    pos: { x: 430, y: 160 },
    rate: 0.3,
    runoffResponse: 0.3,
    entry: { segmentId: 'west', s: 330 },
    look: 'park',
  },
  {
    id: 'apartments',
    label: 'Apartments',
    pos: { x: 280, y: 540 },
    rate: 0.5,
    runoffResponse: 0.8,
    entry: { segmentId: 'east', s: 60 },
    look: 'apartments',
  },
  {
    id: 'lot',
    label: 'Depot Lot',
    pos: { x: 660, y: 530 },
    rate: 0.5,
    runoffResponse: 1,
    entry: { segmentId: 'east', s: 220 },
    look: 'lot',
  },
  {
    id: 'school',
    label: 'School',
    pos: { x: 900, y: 200 },
    rate: 0.45,
    runoffResponse: 0.6,
    entry: { segmentId: 'lower', s: 80 },
    look: 'school',
  },
  {
    id: 'market',
    label: 'Market',
    pos: { x: 1010, y: 540 },
    rate: 0.4,
    runoffResponse: 0.7,
    entry: { segmentId: 'lower', s: 250 },
    look: 'market',
  },
];
const [houses, park, apartments, lot, school, market] = sources as PollutionSource[] as [
  PollutionSource,
  PollutionSource,
  PollutionSource,
  PollutionSource,
  PollutionSource,
  PollutionSource,
];

/**
 * Level 4 — The Bottleneck. Two creeks squeeze through a narrow channel.
 * Lessons: banks with logs and reeds snag litter (retention), which a storm can
 * wash loose again (remobilization); a narrow bottleneck is a powerful trap site,
 * and a boom can steer litter into (or away from) a snag.
 */
export const LEVEL_4: LevelConfig = {
  id: 'level-4',
  number: 4,
  name: 'The Bottleneck',
  intro: 'Logs and reeds hold litter for a while… until the water rises.',
  teaches: [
    'Banks can snag litter',
    'High water can wash snagged litter loose',
    'Narrow channels are strong trap sites',
  ],
  seed: 404,
  generationSeconds: 52,
  durationSeconds: 70,
  target: 0.8,
  stars: { one: 0.8, two: 0.85, three: 0.88 },
  inventory: { gps: 2, bin: 2, filter: 1, trap: 1, boom: 2, cleanup: 1 },
  segments: [
    {
      id: 'west',
      points: [
        { x: 60, y: 140 },
        { x: 260, y: 200 },
        { x: 440, y: 300 },
        { x: 560, y: 330 },
      ],
      speed: 60,
      halfWidth: 20,
      downstream: 'neck',
    },
    {
      id: 'east',
      points: [
        { x: 380, y: 600 },
        { x: 470, y: 470 },
        { x: 560, y: 330 },
      ],
      speed: 62,
      halfWidth: 16,
      downstream: 'neck',
    },
    {
      id: 'neck',
      points: [
        { x: 560, y: 330 },
        { x: 700, y: 340 },
        { x: 820, y: 300 },
      ],
      speed: 85,
      halfWidth: 13,
      downstream: 'lower',
    },
    {
      id: 'lower',
      points: [
        { x: 820, y: 300 },
        { x: 960, y: 380 },
        { x: 1080, y: 430 },
        { x: 1200, y: 420 },
      ],
      speed: 62,
      halfWidth: 30,
      downstream: null,
    },
  ],
  sources,
  hotspots: [
    {
      id: 'log',
      label: 'Fallen log',
      segmentId: 'west',
      sFrom: 260,
      sTo: 380,
      side: 1,
      look: 'log',
    },
    {
      id: 'reeds',
      label: 'Reed bed',
      segmentId: 'lower',
      sFrom: 140,
      sTo: 300,
      side: -1,
      look: 'reeds',
    },
  ],
  weather: [
    { at: 8, duration: 12, intensity: 'light' },
    { at: 30, duration: 18, intensity: 'moderate' },
    { at: 54, duration: 12, intensity: 'light' },
  ],
  slots: [
    bin(houses, 0, 70),
    bin(park, 80, 0),
    bin(apartments, -80, 0),
    bin(lot, 80, 0),
    bin(school, 80, 0),
    bin(market, 80, 0),
    filter(lot, 0, 70),
    filter(market, -70, 60),
    trap('neck', 'neck', 130, 1),
    trap('lower', 'lower', 360, 0.5, 0.45),
    boom('west', 'west', 220),
    boom('lower', 'lower', 110),
  ],
};
