import { TUNING } from '../config/tuning';
import { clamp } from '../utils/math';

export type EscapeParams = typeof TUNING.escape;

// How alert a fish is to the snail. Awareness rises when the snail is close (more if it's moving)
// and fades otherwise. `responsiveness` is what Ghost Signal lowers; `alertness` drops when the fish is weak.
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

// Start fleeing above fleeAbove, keep going until below calmBelow.
export function shouldFlee(
  awareness: number,
  currentlyFleeing: boolean,
  p: EscapeParams = TUNING.escape,
): boolean {
  return currentlyFleeing ? awareness > p.calmBelow : awareness > p.fleeAbove;
}
