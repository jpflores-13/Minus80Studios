import { TUNING } from '../config/tuning';
import { clamp } from '../utils/math';

// Immobilization model (game rules). n = how pinned the fish is, L = motor lock.
//
//   dn/dt = -recovery*(1 - L)*n
//
// A strike sets n to 1. Without a lock the fish shakes it off in a second or two.
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
