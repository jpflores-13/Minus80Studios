import { SIM } from '../config/tuning';
import type { RootSystem, Segment } from '../systems/plant';
import type { Rng } from '../utils/rng';
import type { Features, SessionConfig } from './types';

/** A finished, mature rhizome (no longer releasing oxygen) lying at depth y from x0 to x1. */
export function matureRhizome(
  plant: RootSystem,
  x0: number,
  x1: number,
  y: number,
  bornAt: number,
  plantId = 0,
): { seg: Segment; nodes: { x: number; y: number }[] } {
  const dir = x1 >= x0 ? 1 : -1;
  const seg = plant.addRhizome(x0, y, dir, bornAt, plantId);
  seg.points.length = 0;
  const len = Math.abs(x1 - x0);
  for (let d = 0; d <= len; d += SIM.pointSpacing) {
    seg.points.push({ x: x0 + dir * d, y: y + Math.sin(d / 90) * 6, born: bornAt });
  }
  seg.length = len;
  seg.growing = false;
  plant.ramets.push({ x: x1, bornAt, plantId });
  const nodes: { x: number; y: number }[] = [];
  for (let d = 70; d < len; d += SIM.rhizomeNodeSpacing) {
    nodes.push({ x: x0 + dir * d, y: y + Math.sin(d / 90) * 6 });
  }
  return { seg, nodes };
}

/** Schedules adventitious roots from random nodes at intervals from `from` for `span` hours. */
export function scheduleRootWaves(
  plant: RootSystem,
  rng: Rng,
  parent: Segment,
  nodes: { x: number; y: number }[],
  from: number,
  span: number,
  every: number,
  perWave: [number, number],
): void {
  for (let t = from; t < from + span; t += every * rng.range(0.7, 1.3)) {
    const node = nodes[Math.floor(rng.range(0, nodes.length))];
    if (!node) continue;
    const count = perWave[0] + Math.floor(rng.range(0, perWave[1] - perWave[0] + 1));
    plant.scheduleRoots(parent.id, node.x, node.y, t, count);
  }
}

export const ALL_FEATURES: Features = {
  scan: true,
  timelapse: true,
  threshold: true,
  roi: true,
  chemistry: true,
};

export const NO_FEATURES: Features = {
  scan: false,
  timelapse: false,
  threshold: false,
  roi: false,
  chemistry: false,
};

/** Defaults every config shares; levels override what they need. */
export function baseConfig(): Omit<SessionConfig, 'id' | 'title' | 'setup'> {
  return {
    duration: 60,
    hoursPerSecond: 2,
    startHour: 11,
    warmupHours: 0,
    dayNight: false,
    growth: {},
    field: {},
    distractorRate: 0.2,
    distractorStartSec: 10,
    features: NO_FEATURES,
    objectives: [],
    targetScore: 1500,
    imagingExpands: false,
    nightTwist: false,
    nightBonus: false,
    tips: [],
    music: 'muck',
    seed: 1,
    maxDataGaps: 0,
  };
}
