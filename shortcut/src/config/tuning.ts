import type { EngineParams } from '../systems/extrusion';
import type { CityParams } from '../systems/city';

// Every gameplay number lives here. Levels can override the machine settings.

export const TUNING = {
  /** Default machine behaviour (see systems/extrusion.ts). */
  engine: {
    speed: 2,
    lifetimeMean: 14,
    loadInterval: 2,
    bypassPerSecond: 0.03,
    fleet: 1,
  } satisfies EngineParams,
  /** How often a checkpoint stops an end that meets it head on. */
  checkpointReliability: 0.9,
  city: {
    reach: 1,
    deliverPerSecond: 1.2,
    runningWindow: 3,
  } satisfies CityParams,
  /** Simulation step (s). Small enough that speed * step stays well under 1. */
  step: 0.05,
  /** How much faster than real time the "fast" button runs. */
  fastForward: 3,
};
