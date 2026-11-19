/**
 * Gameplay tuning parameters.
 *
 * Think of this file as the game's `params.yaml`: every number a designer might
 * want to tweak during playtesting lives here, not buried inside scene code.
 * Units are pixels and seconds unless noted.
 *
 * These are placeholder values chosen for feel, NOT measurements of real rivers
 * or plastic transport. Anything meant to reflect research must be documented
 * and validated in docs/SCIENCE.md first.
 */
export const TUNING = {
  river: {
    /** Current speed at the middle of the channel (px/s). Speed falls to zero at the banks. */
    maxCurrentSpeed: 140,
    /** Fraction of screen height used for the river channel (0–1). */
    channelHeightFraction: 0.6,
  },
  debris: {
    /** Seconds between new pieces of debris entering upstream. */
    spawnIntervalSeconds: 0.9,
    /** Debris never drifts slower than this (px/s), so nothing gets stuck at the banks. */
    minDriftSpeed: 20,
    /** Extra tap/click radius around debris (px). Generous for touch screens. */
    tapPadding: 18,
  },
} as const;
