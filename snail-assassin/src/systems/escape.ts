import { TUNING } from '../config/tuning';
import { clamp } from '../utils/math';

export type EscapeParams = typeof TUNING.escape;

/**
 * Escape-responsiveness module. Awareness a ∈ [0, 1]:
 *
 *   stimulus = proximity · (still + (1 − still) · snailMotion)   within detectionRadius, else 0
 *   da/dt    = gain · stimulus · responsiveness · alertness − decay · a
 *
 * `responsiveness` (0–1) is the hook for escape-dampening abilities (Nightshade).
 * `alertness` (0–1) lets metabolic impairment dull reactions.
 */
export function stepAwareness(
  awareness: number,
  distanceToSnail: number,
  snailMotion: number,
  responsiveness: number,
  alertness: number,
  dt: number,
  p: EscapeParams = TUNING.escape,
): number {
  const proximity =
    distanceToSnail < p.detectionRadius ? 1 - distanceToSnail / p.detectionRadius : 0;
  const stimulus = proximity * (p.stillStimulus + (1 - p.stillStimulus) * clamp(snailMotion, 0, 1));
  const da = p.gain * stimulus * responsiveness * alertness - p.decay * awareness;
  return clamp(awareness + da * dt, 0, 1);
}

/** Flee with hysteresis: start above `fleeAbove`, keep fleeing until below `calmBelow`. */
export function shouldFlee(
  awareness: number,
  currentlyFleeing: boolean,
  p: EscapeParams = TUNING.escape,
): boolean {
  return currentlyFleeing ? awareness > p.calmBelow : awareness > p.fleeAbove;
}
