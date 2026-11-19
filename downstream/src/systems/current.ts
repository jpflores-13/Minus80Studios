import { clamp } from '../utils/math';

/**
 * Placeholder river current profile: fastest mid-channel, zero at both banks,
 * using a simple parabola. This is a gameplay stand-in, not a validated
 * hydrological model. Replace or justify via docs/SCIENCE.md.
 *
 * Pure function (no Phaser), so it can be unit-tested like any numerical routine.
 */
export function currentSpeedAt(
  y: number,
  bankTop: number,
  bankBottom: number,
  maxSpeed: number,
): number {
  const width = bankBottom - bankTop;
  if (width <= 0) return 0;
  // Position across the channel: 0 at the top bank, 1 at the bottom bank.
  const t = clamp((y - bankTop) / width, 0, 1);
  return maxSpeed * 4 * t * (1 - t);
}

/** Running tally of debris outcomes. */
export interface InterceptionTally {
  intercepted: number;
  escaped: number;
}

/** Share of debris the player stopped (0–1), or 0 before any debris has resolved. */
export function interceptionRate(tally: InterceptionTally): number {
  const total = tally.intercepted + tally.escaped;
  return total === 0 ? 0 : tally.intercepted / total;
}
