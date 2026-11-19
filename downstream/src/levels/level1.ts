import type { LevelConfig } from './types';

/**
 * Level 1 — The Neighborhood. One creek, four litter sources, three bins, one trap.
 * The lesson to discover: the School drains in BELOW every trap site, so only a
 * bin can stop its litter. Trap placement then decides how much of the rest is caught.
 * All rates, capacities, and thresholds are fictional balancing values.
 */
export const LEVEL_1: LevelConfig = {
  id: 'level-1',
  number: 1,
  name: 'The Neighborhood',
  intro: 'A small creek winds through town toward the sea. Where will you intervene?',
  teaches: [
    'Litter sits on the streets until rain washes it into the creek',
    'Trash bins prevent litter at its source',
    'Trash traps catch floating litter',
    'GPS research bottles reveal where litter travels',
  ],
  seed: 101,
  generationSeconds: 50,
  durationSeconds: 62,
  target: 0.75,
  stars: { one: 0.75, two: 0.8, three: 0.85 },
  inventory: { gps: 1, bin: 3, trap: 1 },
  segments: [
    {
      id: 'creek',
      points: [
        { x: 60, y: 120 },
        { x: 260, y: 170 },
        { x: 420, y: 280 },
        { x: 600, y: 300 },
        { x: 780, y: 250 },
        { x: 940, y: 330 },
        { x: 1080, y: 420 },
        { x: 1200, y: 430 },
      ],
      speed: 70,
      halfWidth: 22,
      downstream: null,
    },
  ],
  sources: [
    {
      id: 'store',
      runoffResponse: 0.9,
      label: 'Corner Store',
      pos: { x: 230, y: 300 },
      rate: 0.7,
      entry: { segmentId: 'creek', s: 240 },
      look: 'store',
    },
    {
      id: 'park',
      runoffResponse: 0.3,
      label: 'Park',
      pos: { x: 520, y: 140 },
      rate: 0.4,
      entry: { segmentId: 'creek', s: 470 },
      look: 'park',
    },
    {
      id: 'houses',
      runoffResponse: 0.5,
      label: 'Houses',
      pos: { x: 640, y: 420 },
      rate: 0.3,
      entry: { segmentId: 'creek', s: 620 },
      look: 'houses',
    },
    {
      id: 'school',
      runoffResponse: 0.7,
      label: 'School',
      pos: { x: 1060, y: 230 },
      rate: 0.6,
      entry: { segmentId: 'creek', s: 1140 },
      look: 'school',
    },
  ],
  hotspots: [],
  weather: [
    { at: 10, duration: 12, intensity: 'light' },
    { at: 34, duration: 26, intensity: 'moderate' },
  ],
  slots: [
    { id: 'bin-store', kind: 'bin', pos: { x: 230, y: 370 }, sourceId: 'store' },
    { id: 'bin-park', kind: 'bin', pos: { x: 600, y: 140 }, sourceId: 'park' },
    { id: 'bin-houses', kind: 'bin', pos: { x: 720, y: 420 }, sourceId: 'houses' },
    { id: 'bin-school', kind: 'bin', pos: { x: 1140, y: 230 }, sourceId: 'school' },
    {
      id: 'trap-upper',
      kind: 'trap',
      pos: { x: 0, y: 0 },
      segmentId: 'creek',
      s: 400,
      coverage: 0.8,
    },
    {
      id: 'trap-middle',
      kind: 'trap',
      pos: { x: 0, y: 0 },
      segmentId: 'creek',
      s: 760,
      coverage: 0.8,
    },
    {
      id: 'trap-lower',
      kind: 'trap',
      pos: { x: 0, y: 0 },
      segmentId: 'creek',
      s: 1010,
      coverage: 0.9,
    },
  ],
};
