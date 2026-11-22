// Gameplay tuning. Made-up balancing values, not measurements of real creeks or equipment.
// Level-specific numbers live in src/levels. Kept mutable for the dev panel.
export const TUNING = {
  sim: {
    /** Fixed simulation step (s). Results don't depend on the display frame rate. */
    fixedStep: 1 / 30,
    /** Fast-forward multiplier for accelerated playback. */
    fastForward: 3,
  },
  bin: {
    /** Fraction of a source's litter a trash bin prevents. */
    effectiveness: 0.7,
  },
  trap: {
    /** Items a trash trap holds before it is full and everything bypasses it. */
    capacity: 40,
  },
  filter: {
    /** Fraction of a source's runoff litter a storm-drain filter catches (until full). */
    efficiency: 0.65,
    capacity: 25,
  },
  boom: {
    /** How strongly a boom steers passing litter toward its target side (0–1). */
    steering: 0.85,
    /** Lateral position (−1…1) a boom guides litter toward. */
    target: 0.65,
  },
  transport: {
    /** Random drift across the channel (lateral units per √s). Makes trap coverage matter. */
    lateralDiffusion: 0.35,
  },
  retention: {
    /** Chance per second that litter near a hotspot's bank gets snagged. */
    retainPerSecond: 0.6,
    /** Base chance per second that snagged litter breaks free (scaled by the weather below). */
    remobilizePerSecond: 0.02,
    /** Litter must be at least this far toward the hotspot's bank (lateral·side) to be snagged. */
    bankBand: 0.25,
  },
  weather: {
    // Rain is what moves litter. In dry weather it piles up on land and the water barely moves.
    // flow: multiplier on water speed. wash: chance per second a piece of land litter washes
    //   into the storm drains (times the source's runoffResponse). remobilize: multiplier on
    //   how often snagged litter breaks free.
    dry: { flow: 0.2, wash: 0, remobilize: 0.1 },
    light: { flow: 1, wash: 0.25, remobilize: 3 },
    moderate: { flow: 1.3, wash: 0.5, remobilize: 8 },
    heavy: { flow: 1.7, wash: 0.9, remobilize: 20 },
    /** Seconds of warning before rain starts. */
    forecastLead: 15,
  },
  reusables: {
    /** Switching a source to reusables cuts its litter generation rate by this fraction, for the rest of the level. */
    rateMultiplier: 0.4,
  },
  gps: {
    /** Virtual research bottles travel this many seconds of simulated time at most. */
    maxSeconds: 80,
    /** Playback speed when animating a scouting run. */
    playbackSpeed: 6,
    /** A finished trail stays on the map this long (real seconds), then fades out. */
    lingerSeconds: 4,
    fadeSeconds: 1.5,
  },
  // What kind of litter each place drops (cosmetic). Schools and parks lose a lot of balls and toys.
  litterMix: {
    default: { bottle: 0.4, bag: 0.3, wrapper: 0.3, ball: 0, toy: 0 },
    school: { bottle: 0.25, bag: 0.15, wrapper: 0.2, ball: 0.25, toy: 0.15 },
    park: { bottle: 0.3, bag: 0.2, wrapper: 0.15, ball: 0.25, toy: 0.1 },
  },
};

export type Intensity = 'light' | 'moderate' | 'heavy';
