/**
 * Shared gameplay tuning (the game's `params.yaml`). Level-specific values
 * (source rates, inventories, targets) live in src/levels/*.ts.
 *
 * These are FICTIONAL balancing values, not measurements of real creeks,
 * litter, or equipment. See docs/SCIENCE.md for what is and isn't evidence-based.
 */
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
    /** Items a trash trap can hold before it is full and everything bypasses it. */
    capacity: 40,
  },
  runoff: {
    /** Seconds litter sits on land before runoff carries it into the creek. */
    delayMin: 1,
    delayMax: 4,
  },
  transport: {
    /** Random drift across the channel (lateral units per √s). Makes trap coverage matter. */
    lateralDiffusion: 0.35,
  },
  litterMix: { bottle: 0.4, bag: 0.3, wrapper: 0.3 },
} as const;
