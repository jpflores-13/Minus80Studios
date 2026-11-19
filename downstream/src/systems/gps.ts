import { TUNING } from '../config/tuning';
import type { LevelConfig } from '../levels/types';
import { clamp, type Vec2 } from '../utils/math';
import { createRng } from '../utils/rng';
import { lateralSpeedFactor, worldPosition } from './network';
import { segmentMap } from './sim';

// Virtual GPS bottles. They follow the same rules as litter (dry weather, no equipment)
// and record their path. One bottle is one sample, so other litter can go elsewhere.
// They are never counted as litter.
export interface TrackPoint {
  pos: Vec2;
  t: number;
}

export interface Track {
  sourceId: string;
  points: TrackPoint[];
  stops: { pos: Vec2; seconds: number; hotspotId: string }[];
  segmentsVisited: string[];
  outcome: 'ocean' | 'snagged' | 'still-travelling';
  seconds: number;
}

export function scout(level: LevelConfig, sourceId: string, seed: number): Track {
  const src = level.sources.find((s) => s.id === sourceId);
  const segments = segmentMap(level);
  const rng = createRng(seed);
  const track: Track = {
    sourceId,
    points: [],
    stops: [],
    segmentsVisited: [],
    outcome: 'still-travelling',
    seconds: 0,
  };
  if (!src) return track;

  const dt = TUNING.sim.fixedStep;
  let seg = segments.get(src.entry.segmentId);
  let s = src.entry.s;
  let lateral = rng.range(-1, 1);
  let t = 0;
  let stuck: { hotspotId: string; since: number } | null = null;
  let sinceSample = 0;
  if (seg) track.segmentsVisited.push(seg.id);

  while (seg && t < TUNING.gps.maxSeconds) {
    t += dt;
    if (stuck) {
      if (rng.next() < TUNING.retention.remobilizePerSecond * dt) {
        track.stops.push({
          pos: worldPosition(seg, s, lateral),
          seconds: t - stuck.since,
          hotspotId: stuck.hotspotId,
        });
        stuck = null;
      }
      continue;
    }
    s += seg.speed * lateralSpeedFactor(lateral) * dt;
    lateral = clamp(
      lateral + rng.range(-1, 1) * TUNING.transport.lateralDiffusion * Math.sqrt(dt),
      -1,
      1,
    );
    for (const h of level.hotspots) {
      if (
        h.segmentId !== seg.id ||
        s < h.sFrom ||
        s > h.sTo ||
        lateral * h.side < TUNING.retention.bankBand
      )
        continue;
      if (rng.next() < TUNING.retention.retainPerSecond * dt) stuck = { hotspotId: h.id, since: t };
    }
    if (s >= seg.length) {
      if (seg.downstream === null) {
        track.points.push({ pos: worldPosition(seg, seg.length, lateral), t });
        track.outcome = 'ocean';
        break;
      }
      s -= seg.length;
      seg = segments.get(seg.downstream);
      if (seg) track.segmentsVisited.push(seg.id);
      continue;
    }
    sinceSample += dt;
    if (sinceSample >= 0.25) {
      sinceSample = 0;
      track.points.push({ pos: worldPosition(seg, s, lateral), t });
    }
  }
  if (stuck && seg) {
    track.stops.push({
      pos: worldPosition(seg, s, lateral),
      seconds: t - stuck.since,
      hotspotId: stuck.hotspotId,
    });
    track.outcome = 'snagged';
  }
  track.seconds = t;
  return track;
}
