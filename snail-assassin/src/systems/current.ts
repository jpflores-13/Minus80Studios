import { TUNING } from '../config/tuning';
import type { Vec2 } from '../utils/math';

type CurrentParams = { strength: number; bandWavelength: number; timeFrequency: number };

/**
 * Gentle reef current at a point and time: horizontal bands that slowly shift.
 * A cheap analytic field, not fluid dynamics. Venom clouds drift with it.
 */
export function currentAt(pos: Vec2, timeSeconds: number, p: CurrentParams = TUNING.current): Vec2 {
  const phase = pos.y / p.bandWavelength + timeSeconds * p.timeFrequency;
  return {
    x: p.strength * (0.6 + 0.4 * Math.sin(phase)),
    y: p.strength * 0.25 * Math.cos(phase * 0.7),
  };
}
