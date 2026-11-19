import { TUNING } from '../config/tuning';
import { clamp } from '../utils/math';

/**
 * Metabolic-regulation module (phenomenological, bounded to [0, 1]).
 *
 *   g  glucose state        (1 = normal)
 *   I  insulin-like effect  (0 = none), decays with time constant τ_I
 *   O  recovery override    (0 = none), decays with time constant τ_O
 *
 *   dg/dt = −drop·I·g + recovery·(1 − g)·(1 − O)
 *
 * Because O only scales the *recovery* term, it does almost nothing to a fish
 * whose glucose is already normal (1 − g ≈ 0), but it greatly extends the low-
 * glucose window after an insulin-like hit. The synergy falls out of the
 * equation rather than being special-cased. These are gameplay rules, not a
 * physiological model. See docs/SCIENCE.md.
 */
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

/** Add exposure from a venom cloud. `dose` is uptake·potency·falloff·dt. */
export function expose(s: MetabolicState, effect: 'insulin' | 'override', dose: number): void {
  s[effect] = clamp(s[effect] + dose, 0, 1);
}

/** Relative swimming performance (0–1) as a function of glucose. */
export function swimPerformance(glucose: number, p: MetabolicParams = TUNING.metabolic): number {
  return p.minPerformance + (1 - p.minPerformance) * glucose * glucose;
}
