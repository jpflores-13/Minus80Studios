/**
 * Gameplay tuning parameters.
 *
 * Think of this file as the game's `params.yaml`: every number a designer might
 * want to tweak during playtesting lives here, not buried inside scene code.
 * Units are pixels and seconds unless noted.
 *
 * These are placeholder values chosen for feel, not derived from biology.
 * Any value that is meant to reflect real cone-snail behaviour must be
 * documented and validated in docs/SCIENCE.md first.
 */
export const TUNING = {
  snail: {
    /** Top crawling speed (px/s). Cone snails are slow; the game should feel deliberate. */
    maxSpeed: 90,
    /** How quickly the snail reaches top speed (px/s²). */
    acceleration: 140,
    /** How quickly the snail stops when there is no input (px/s²). */
    deceleration: 220,
    /** Pointer/touch: stop steering when this close to the target (px). */
    arrivalRadius: 12,
  },
  marineSnow: {
    /** Number of drifting particles for atmosphere. */
    count: 70,
    minFallSpeed: 4,
    maxFallSpeed: 16,
  },
} as const;
