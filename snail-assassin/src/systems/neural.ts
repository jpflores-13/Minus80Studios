import { TUNING } from '../config/tuning';
import { clamp } from '../utils/math';

/**
 * Neural-signaling module (phenomenological, bounded to [0, 1]).
 *
 *   n  neural impairment   (1 = fully immobilized, 0 = normal)
 *   L  motor-lock effect   (suppresses recovery), decays with time constant τ_L
 *
 *   dn/dt = −recovery·(1 − L)·n
 *
 * A strike sets n = 1 instantly (rapid immobilization). Without a lock the fish
 * recovers within a few seconds; with a lock the capture window is much longer.
 * Gameplay rules only, not a model of nerve or muscle physiology.
 */
export interface NeuralState {
  neural: number;
  lock: number;
}

export function stepNeural(s: NeuralState, dt: number, p = TUNING.neural): void {
  s.neural = clamp(s.neural - p.recoveryRate * (1 - s.lock) * s.neural * dt, 0, 1);
  s.lock = clamp(s.lock * Math.exp(-dt / p.lockTau), 0, 1);
}

export function isImmobilized(s: NeuralState, p = TUNING.neural): boolean {
  return s.neural > p.immobileAbove;
}
