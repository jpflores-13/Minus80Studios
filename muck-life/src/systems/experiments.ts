import { SIM } from '../config/tuning';
import { OxygenField, DEFAULT_FIELD } from './oxygen';
import { DEFAULT_GROWTH, RootSystem } from './plant';

/** Same growth speed-up the campaign levels use, so the comparison matches what players see. */
export const EXPERIMENT_GROWTH_BOOST = 2.5;

// Virtual versions of the paper's two comparisons, run on the game's own (simplified) model:
//  1. How much does oxygen at a spot rise when a new root grows into it?
//  2. How much does oxygen around a lateral-root plume swing between day and night?
// The results feed the ending's "simulated" bars and the tests. They are a check that the model
// behaves qualitatively like the study, not new findings.

export interface PoolTrace {
  /** Hours from the start of the run. */
  t: number[];
  /** % saturation at the ROI. */
  v: number[];
}

export interface GrowthVsDiel {
  /** Rise (percentage points) at an ROI as a growing adventitious root arrives. */
  growthRise: number;
  /** Mean daily max − min around lateral roots, over several days of no new growth. */
  dielRange: number;
  /** Hours an adventitious-root ROI stayed above 1% saturation. */
  adventitiousDuration: number;
  /** Hours a lateral-root ROI stayed above 1%. */
  lateralDuration: number;
  /** Lowest reading at the lateral ROI during night hours (pools persist at night). */
  nightMinimum: number;
  lateralTrace: PoolTrace;
}

/**
 * One organ alone (no laterals): rise and duration at an ROI beside its path. Two passes with the
 * same seed: the first finds where the organ will grow, the second watches a spot it will reach,
 * from before it arrives (as the study placed ROIs along a root's growth path).
 */
export function organOnly(
  organ: 'adventitious' | 'rhizome',
  seed = 11,
): { rise: number; duration: number } {
  const build = () => {
    const plant = new RootSystem(seed, {
      ...DEFAULT_GROWTH,
      growthBoost: EXPERIMENT_GROWTH_BOOST,
      pulses: false,
      rhizomeRoots: false,
      lateralsEnabled: false,
    });
    const seg =
      organ === 'rhizome'
        ? plant.addRhizome(200, 260, 1, 0)
        : plant.addSegment('adventitious', 640, 210, Math.PI / 2, 0);
    const field = new OxygenField(0, 180, 1280, 544, { ...DEFAULT_FIELD, dielEnabled: true });
    return { plant, seg, field };
  };
  const dt = SIM.stepHours;
  const first = build();
  for (let t = 0; t < 30; t += dt) first.plant.step(dt, t);
  const p = first.seg.points[Math.min(first.seg.points.length - 1, 18)]!;
  const roi = { x: p.x, y: p.y };
  const { plant, field } = build();
  let peak = 0;
  let firstT = -1;
  let lastT = -1;
  for (let t = 0; t < 400; t += dt) {
    plant.step(dt, t);
    field.step(plant, t, dt);
    const v = field.sample(roi.x, roi.y);
    peak = Math.max(peak, v);
    if (v > SIM.roiPresencePct) {
      if (firstT < 0) firstT = t;
      lastT = t;
    }
  }
  return { rise: peak, duration: firstT >= 0 ? lastT - firstT : 0 };
}

export function runGrowthVsDiel(seed = 11, hours = 900): GrowthVsDiel {
  const adv = organOnly('adventitious', seed);
  const plant = new RootSystem(seed, {
    ...DEFAULT_GROWTH,
    growthBoost: EXPERIMENT_GROWTH_BOOST,
    pulses: false,
    rhizomeRoots: false,
  });
  plant.addSegment('adventitious', 640, 210, Math.PI / 2, 0);
  const field = new OxygenField(0, 180, 1280, 544, { ...DEFAULT_FIELD, dielEnabled: true });
  const dt = SIM.stepHours;
  let latRoi: { x: number; y: number } | null = null;
  let latFirst = -1;
  let latLast = -1;
  let nightMin = Infinity;
  const trace: PoolTrace = { t: [], v: [] };
  const daily = new Map<number, { lo: number; hi: number }>();
  for (let t = 0; t < hours; t += dt) {
    plant.step(dt, t);
    field.step(plant, t, dt);
    const lateral = plant.segments.find((s) => s.organ === 'lateral' && s.points.length > 3);
    if (lateral && !latRoi) {
      const p = lateral.points[Math.floor(lateral.points.length / 2)]!;
      latRoi = { x: p.x, y: p.y };
    }
    if (latRoi) {
      const v = field.sample(latRoi.x, latRoi.y);
      if (v > SIM.roiPresencePct) {
        if (latFirst < 0) latFirst = t;
        latLast = t;
      }
      // Plateau window: after laterals have finished growing, before they fade.
      if (latFirst >= 0 && t > latFirst + 80 && t < latFirst + 260) {
        trace.t.push(t);
        trace.v.push(v);
        const day = Math.floor(t / 24);
        const d = daily.get(day) ?? { lo: Infinity, hi: -Infinity };
        d.lo = Math.min(d.lo, v);
        d.hi = Math.max(d.hi, v);
        daily.set(day, d);
        const h = t % 24;
        if (h < 5 || h >= 19) nightMin = Math.min(nightMin, v);
      }
    }
  }
  const full = [...daily.values()].filter((d) => d.hi > -Infinity);
  const dielRange = full.length ? full.reduce((a, d) => a + (d.hi - d.lo), 0) / full.length : 0;
  return {
    growthRise: adv.rise,
    dielRange,
    adventitiousDuration: adv.duration,
    lateralDuration: latFirst >= 0 ? latLast - latFirst : 0,
    nightMinimum: nightMin === Infinity ? 0 : nightMin,
    lateralTrace: trace,
  };
}
