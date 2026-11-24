import type { SessionConfig, LevelMeta } from './types';
import {
  ALL_FEATURES,
  baseConfig,
  matureRhizome,
  NO_FEATURES,
  scheduleRootWaves,
} from './builders';

// The seven-level campaign. Durations follow the brief (≈ 8.9 min straight through at standard
// timers). Growth boosts and compressed delays are gameplay abstractions, documented in
// docs/SCIENCE_TO_GAMEPLAY.md; the *ordering* of events (tips → laterals later, rhizome → roots
// later, pools fading with maturation, pools persisting at night) follows the paper.

export const CAMPAIGN_META: LevelMeta[] = [
  {
    index: 0,
    name: 'Welcome to the Muck',
    briefing: [
      'Below the marsh, sediment is waterlogged and nearly oxygen-free.',
      'Your optode camera shows oxygen as a glowing heatmap. The glow is an imaging colour, not light from the mud.',
      'Tap or click a bright pool to document it. Quick, distinct observations build a combo.',
    ],
    scienceNote:
      'Cattails carry air to their roots through spongy, air-filled tissue called aerenchyma. Some of that oxygen leaks into the mud: radial oxygen loss.',
  },
  {
    index: 1,
    name: 'Root Rush',
    briefing: [
      'New adventitious roots are pushing down from the rhizome.',
      'Oxygen pools ride along with each growing tip, and the tissue left behind matures and goes quiet.',
      'A pool that has moved far enough since you documented it counts as a new observation. Track the tips!',
    ],
    scienceNote:
      'In the study, pools around new adventitious roots appeared with the growing tip and faded from each patch of sediment after about 4 days on average (95 ± 17 h).',
  },
  {
    index: 2,
    name: 'Branching Out',
    briefing: [
      'After an adventitious root matures and goes quiet, something new happens.',
      'Clusters of fine lateral roots burst out of it, each cluster with a broad oxygen plume.',
      'Lateral plumes last far longer. Come back to them each new day for a fresh reading.',
    ],
    scienceNote:
      'Lateral-root oxygen plumes persisted for several weeks in the study: 502 ± 170 h on average, versus days for new adventitious roots and rhizomes.',
  },
  {
    index: 3,
    name: 'The Underground',
    briefing: [
      'A rhizome is an underground stem, not a root. It creeps sideways and opens new ground.',
      'Your optode window expands as it extends. Its growing apex leaves an oxygen trail.',
      'Rhizome nodes sprout new adventitious roots a little later. Predict where, and be ready.',
    ],
    scienceNote:
      'In the study, groups of new adventitious roots erupted from rhizomes 3–7 days after the rhizome was established. Here it is sped up.',
  },
  {
    index: 4,
    name: 'Night Shift',
    briefing: [
      'The sun is going down on the marsh. No light, no photosynthesis.',
      'You might expect the oxygen down here to shut off too.',
      'Keep documenting through the evening. Watch what happens.',
    ],
    scienceNote:
      'Oxygen pools around growing tissue persisted through the night in the study. Day–night swings were only a few percent saturation.',
  },
  {
    index: 5,
    name: 'Muck Chemistry',
    briefing: [
      'Mud is hungry for oxygen. Microbes and chemical reactions use it up fast.',
      'The chemistry overlay (C) sketches where oxygen-using processes can run, and where they can’t.',
      'Place ROI windows (O, then tap) to record how the oxygen at one spot changes over time.',
    ],
    scienceNote:
      'Oxygenated water injected into root-free sediment in the study was drawn back down to anoxia in about 1.5 hours.',
  },
  {
    index: 6,
    name: 'The Big Bloom',
    briefing: [
      'Two cattails, a busy root system, and a full day–night cycle.',
      'Rhizomes, adventitious roots and lateral plumes, transient and persistent signals, all at once.',
      'Build the best observation record you can.',
    ],
    scienceNote:
      'Stein & Cardon concluded that root and rhizome development, not the day–night cycle, dominated oxygen loss to sediment in Typha angustifolia.',
  },
];

export function campaignLevel(index: number, seed = 1000 + index): SessionConfig {
  const b = baseConfig();
  switch (index) {
    case 0:
      return {
        ...b,
        id: 'level1',
        title: 'Welcome to the Muck',
        duration: 50,
        hoursPerSecond: 1.6,
        warmupHours: 8,
        growth: {
          growthBoost: 2.2,
          lateralsEnabled: false,
          rhizomeRoots: false,
          maxGrowingRoots: 4,
        },
        setup: (plant, rng, t0) => {
          const { seg, nodes } = matureRhizome(plant, 160, 1120, 236, t0 - 600);
          scheduleRootWaves(plant, rng, seg, nodes, t0, 90, 11, [1, 2]);
        },
        distractorRate: 0.15,
        distractorStartSec: 22,
        objectives: [{ kind: 'observations', n: 6 }],
        targetScore: 1500,
        tips: [
          { at: 1, text: 'Tap a glowing oxygen pool to document it.' },
          { at: 9, text: 'Hover to read the optode: % oxygen saturation.' },
          {
            at: 22,
            text: 'Speckles away from roots read ~0% O₂. They’re imaging artefacts. Skip them.',
          },
          { at: 34, text: 'Already-documented pools (✓) don’t score again until they change.' },
        ],
        seed,
      };
    case 1:
      return {
        ...b,
        id: 'level2',
        title: 'Root Rush',
        duration: 65,
        hoursPerSecond: 2,
        warmupHours: 10,
        growth: {
          growthBoost: 2.6,
          lateralsEnabled: false,
          rhizomeRoots: false,
          maxGrowingRoots: 7,
        },
        setup: (plant, rng, t0) => {
          const { seg, nodes } = matureRhizome(plant, 120, 1160, 232, t0 - 600);
          scheduleRootWaves(plant, rng, seg, nodes, t0, 150, 7, [1, 3]);
        },
        distractorRate: 0.25,
        distractorStartSec: 8,
        objectives: [
          { kind: 'observations', n: 10 },
          { kind: 'tracked', n: 3 },
        ],
        targetScore: 6000,
        tips: [
          { at: 2, text: 'Root tips advance. Pools move with them.' },
          { at: 14, text: 'Re-document a tip once it has moved on: TRACKED GROWTH bonus.' },
        ],
        music: 'rush',
        seed,
      };
    case 2:
      return {
        ...b,
        id: 'level3',
        title: 'Branching Out',
        duration: 70,
        hoursPerSecond: 2,
        warmupHours: 70,
        growth: {
          growthBoost: 2.2,
          lateralDelayHours: 52,
          rhizomeRoots: false,
          maxGrowingRoots: 6,
        },
        setup: (plant, rng, t0) => {
          const { seg, nodes } = matureRhizome(plant, 140, 1140, 234, t0 - 600);
          scheduleRootWaves(plant, rng, seg, nodes, t0, 60, 18, [1, 2]);
          scheduleRootWaves(plant, rng, seg, nodes, t0 + 80, 120, 22, [1, 2]);
        },
        features: { ...NO_FEATURES, scan: true },
        distractorRate: 0.25,
        objectives: [
          { kind: 'observations', n: 10 },
          { kind: 'lateral', n: 4 },
          { kind: 'streak', n: 4 },
        ],
        targetScore: 8000,
        tips: [
          { at: 2, text: 'Lateral roots are erupting from older roots. Look for clusters.' },
          {
            at: 12,
            text: 'Optode Scan (Q or F) highlights signals worth documenting. It recharges.',
          },
          { at: 40, text: 'Lateral plumes linger. New day = new reading (PERSISTENT PLUME).' },
        ],
        seed,
      };
    case 3:
      return {
        ...b,
        id: 'level4',
        title: 'The Underground',
        duration: 75,
        hoursPerSecond: 2,
        warmupHours: 6,
        growth: {
          growthBoost: 2.8,
          adventitiousDelayHours: 22,
          lateralDelayHours: 70,
          maxGrowingRoots: 7,
        },
        setup: (plant) => {
          const start = 90;
          plant.addRhizome(start, 236, 1, -10);
        },
        imagingExpands: true,
        features: { ...NO_FEATURES, scan: true },
        distractorRate: 0.22,
        objectives: [
          { kind: 'observations', n: 9 },
          { kind: 'apex', n: 2 },
          { kind: 'fresh', n: 2 },
        ],
        targetScore: 4500,
        tips: [
          { at: 2, text: 'The rhizome apex leads the way. Its oxygen trail is a target too.' },
          {
            at: 12,
            text: 'Each node behind the apex will sprout roots. Be there when they emerge.',
          },
          { at: 30, text: 'Your imaging window grows to follow the rhizome.' },
        ],
        seed,
      };
    case 4:
      return {
        ...b,
        id: 'level5',
        title: 'Night Shift',
        duration: 75,
        hoursPerSecond: 0.6,
        startHour: 13,
        warmupHours: 30,
        dayNight: true,
        nightTwist: true,
        nightBonus: true,
        growth: { growthBoost: 6, lateralDelayHours: 28, rhizomeRoots: false, maxGrowingRoots: 7 },
        setup: (plant, rng, t0) => {
          const { seg, nodes } = matureRhizome(plant, 150, 1130, 232, t0 - 600);
          scheduleRootWaves(plant, rng, seg, nodes, t0, 30, 9, [1, 2]);
          scheduleRootWaves(plant, rng, seg, nodes, t0 + 30, 50, 12, [1, 2]);
        },
        features: { ...NO_FEATURES, scan: true, timelapse: true },
        distractorRate: 0.22,
        objectives: [
          { kind: 'observations', n: 10 },
          { kind: 'night', n: 4 },
        ],
        targetScore: 7000,
        tips: [
          { at: 2, text: 'Afternoon. Lights out at 19:00.' },
          { at: 36, text: 'Time-Lapse (L or K) replays the last two days of oxygen images.' },
        ],
        music: 'night',
        seed,
      };
    case 5:
      return {
        ...b,
        id: 'level6',
        title: 'Muck Chemistry',
        duration: 90,
        hoursPerSecond: 1.5,
        startHour: 8,
        warmupHours: 60,
        dayNight: true,
        nightBonus: true,
        growth: {
          growthBoost: 2.6,
          lateralDelayHours: 50,
          adventitiousDelayHours: 30,
          rhizomeMaxLength: 400,
        },
        field: { consumption: 2.0 },
        setup: (plant, rng, t0) => {
          const { seg, nodes } = matureRhizome(plant, 140, 760, 232, t0 - 600);
          scheduleRootWaves(plant, rng, seg, nodes, t0, 160, 30, [1, 2]);
          plant.addRhizome(760, 236, 1, t0 + 20);
        },
        features: { ...ALL_FEATURES, chemistry: true, roi: true },
        distractorRate: 0.25,
        objectives: [
          { kind: 'observations', n: 10 },
          { kind: 'roi', n: 2 },
        ],
        targetScore: 10000,
        tips: [
          {
            at: 2,
            text: 'Press O (or I, or the ROI button), then tap: place a window near a growing tip.',
          },
          { at: 16, text: 'An ROI records a change when a pool arrives or fades in its window.' },
          { at: 36, text: 'Threshold (T or G): stricter imaging, fewer targets, more points.' },
        ],
        seed,
      };
    default:
      return {
        ...b,
        id: 'level7',
        title: 'The Big Bloom',
        duration: 120,
        hoursPerSecond: 1.5,
        startHour: 9,
        warmupHours: 60,
        dayNight: true,
        nightBonus: true,
        growth: {
          growthBoost: 2.6,
          lateralDelayHours: 55,
          adventitiousDelayHours: 26,
          maxGrowingRoots: 8,
          rhizomeMaxLength: 360,
        },
        setup: (plant, rng, t0) => {
          const a = matureRhizome(plant, 80, 420, 230, t0 - 600, 0);
          const c = matureRhizome(plant, 1200, 860, 238, t0 - 600, 1);
          scheduleRootWaves(plant, rng, a.seg, a.nodes, t0, 200, 40, [1, 2]);
          scheduleRootWaves(plant, rng, c.seg, c.nodes, t0, 200, 40, [1, 2]);
          plant.addRhizome(420, 232, 1, t0 + 60, 0);
          plant.addRhizome(860, 240, -1, t0 + 75, 1);
        },
        features: ALL_FEATURES,
        distractorRate: 0.3,
        objectives: [
          { kind: 'score', n: 12000 },
          { kind: 'observations', n: 16 },
          { kind: 'lateral', n: 2 },
          { kind: 'apex', n: 1 },
          { kind: 'night', n: 3 },
        ],
        targetScore: 15000,
        tips: [
          { at: 2, text: 'Everything at once. Watch the growth, and the signals will follow.' },
        ],
        music: 'bloom',
        seed,
      };
  }
}

export const CAMPAIGN_LENGTH = CAMPAIGN_META.length;
