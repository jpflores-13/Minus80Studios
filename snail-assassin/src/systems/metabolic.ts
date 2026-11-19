import { TUNING } from '../config/tuning';
import { clamp } from '../utils/math';

// Blood-sugar model (game rules, not physiology). g = glucose, I = insulin-like effect,
// O = recovery block. Values run from 0 to 1.
//
//   dg/dt = -drop*I*g + recovery*(1 - g)*(1 - O)
//
// O only slows recovery, so on its own it barely touches a healthy fish,
// but after an insulin hit it keeps the fish weak for much longer.
export interface MetabolicState {
  glucose: number;
  insulin: number;
  override: number;
}

export type MetabolicParams = typeof TUNING.metabolic;

export function stepMetabolic(
  s: MetabolicState,
  dt: number,
  p: MetabolicParams = TUNING.metabolic,
): void {
  const dg =
    -p.dropRate * s.insulin * s.glucose + p.recoveryRate * (1 - s.glucose) * (1 - s.override);
  s.glucose = clamp(s.glucose + dg * dt, 0, 1);
  s.insulin = clamp(s.insulin * Math.exp(-dt / p.insulinTau), 0, 1);
  s.override = clamp(s.override * Math.exp(-dt / p.overrideTau), 0, 1);
}

// Add exposure from a cloud.
export function expose(s: MetabolicState, effect: 'insulin' | 'override', dose: number): void {
  s[effect] = clamp(s[effect] + dose, 0, 1);
}

// Swim speed multiplier for a given glucose level.
export function swimPerformance(glucose: number, p: MetabolicParams = TUNING.metabolic): number {
  return p.minPerformance + (1 - p.minPerformance) * glucose * glucose;
}
