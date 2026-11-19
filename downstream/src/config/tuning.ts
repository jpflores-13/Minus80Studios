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
  runoff: {
    /** Seconds litter sits on land before runoff carries it into the creek (dry weather). */
    delayMin: 1,
    delayMax: 4,
  },
  transport: {
    /** Random drift across the channel (lateral units per √s). Makes trap coverage matter. */
    lateralDiffusion: 0.35,
  },
  retention: {
    /** Chance per second that litter near a hotspot's bank gets snagged (dry weather). */
    retainPerSecond: 0.6,
    /** Chance per second that snagged litter breaks free again (dry weather). */
    remobilizePerSecond: 0.02,
    /** Litter must be at least this far toward the hotspot's bank (lateral·side) to be snagged. */
    bankBand: 0.25,
  },
  weather: {
    /** Multipliers by intensity. A source's `runoffResponse` scales how much rain affects it. */
    light: { generation: 1.4, runoffDelay: 0.7, speed: 1.15, remobilize: 3 },
    moderate: { generation: 1.9, runoffDelay: 0.5, speed: 1.35, remobilize: 8 },
    heavy: { generation: 2.6, runoffDelay: 0.3, speed: 1.6, remobilize: 20 },
    /** Seconds of warning before an event begins. */
    forecastLead: 15,
  },
  gps: {
    /** Virtual research bottles travel this many seconds of simulated time at most. */
    maxSeconds: 80,
    /** Playback speed when animating a scouting run. */
    playbackSpeed: 6,
  },
  litterMix: { bottle: 0.4, bag: 0.3, wrapper: 0.3 },
};

export type Intensity = 'light' | 'moderate' | 'heavy';
