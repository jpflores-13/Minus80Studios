import { SIM, type Organ } from '../config/tuning';
import { createRng, type Rng } from '../utils/rng';

// A lightweight procedural model of cattail (Typha) belowground development.
//
// The plant is a set of organ *axes* (a rhizome, an adventitious root, a lateral root), each a
// polyline of tissue points. Every point remembers the sim hour it formed, so tissue age — and
// therefore oxygen release — is known along the whole axis. Points are never removed, which also
// lets the time-lapse redraw the plant as it was at any earlier moment.
//
// Experimentally grounded (Stein & Cardon 2026): rhizomes extend horizontally and give rise to
// adventitious roots; laterals erupt from adventitious roots later; each organ type's oxygen pool
// lasts a characteristic time as tissue matures. Gameplay abstractions: exact angles, wander,
// growth pulses, lengths, and the (compressed) delays — see docs/SCIENCE_TO_GAMEPLAY.md.

export interface TissuePoint {
  x: number;
  y: number;
  /** Sim hour this tissue formed. */
  born: number;
}

export interface Segment {
  id: number;
  organ: Organ;
  parentId: number | null;
  /** Plant (ramet system) this belongs to. */
  plantId: number;
  /** Laterals erupting together share a cluster id (one oxygen region per cluster). */
  clusterId: number | null;
  points: TissuePoint[];
  heading: number;
  growing: boolean;
  growthRate: number;
  maxLength: number;
  length: number;
  bornAt: number;
  pulsePhase: number;
  /** Rhizome: length at which the next node emits adventitious roots. */
  nextNodeAt: number;
  /** Adventitious: whether its laterals have already erupted. */
  lateralsDone: boolean;
}

/** An aboveground shoot. Rhizomes terminate in new ramets (Grace & Harrison 1986, via the paper). */
export interface Ramet {
  x: number;
  bornAt: number;
  plantId: number;
}

export interface PendingEmergence {
  at: number;
  parentId: number;
  x: number;
  y: number;
  count: number;
}

export interface GrowthOptions {
  /** Gameplay speed-up of growth (1 = the SIM rates). Documented abstraction. */
  growthBoost: number;
  adventitiousDelayHours: number;
  lateralDelayHours: number;
  lateralsEnabled: boolean;
  /** Rhizomes may emit new adventitious roots at nodes. */
  rhizomeRoots: boolean;
  /** Pulsed growth (rest periods followed by bursts). */
  pulses: boolean;
  /** Bounds roots may grow within. */
  bounds: { left: number; right: number; top: number; bottom: number };
  /** Cap on simultaneously growing adventitious roots (difficulty / readability). */
  maxGrowingRoots: number;
  /** Rhizome length cap (px) for this level. */
  rhizomeMaxLength: number;
}

export const DEFAULT_GROWTH: GrowthOptions = {
  growthBoost: 1,
  adventitiousDelayHours: SIM.adventitiousDelayHours,
  lateralDelayHours: SIM.lateralDelayHours,
  lateralsEnabled: true,
  rhizomeRoots: true,
  pulses: true,
  bounds: { left: 20, right: 1260, top: 200, bottom: 650 },
  maxGrowingRoots: 99,
  rhizomeMaxLength: SIM.maxLength.rhizome,
};

export interface PlantEvent {
  kind: 'rhizome' | 'adventitious' | 'lateral' | 'ramet';
  segmentId: number;
  x: number;
  y: number;
}

export class RootSystem {
  readonly segments: Segment[] = [];
  readonly ramets: Ramet[] = [];
  private pending: PendingEmergence[] = [];
  private nextId = 1;
  private nextCluster = 1;
  private readonly rng: Rng;
  /** Events since the last drain (emergences), for sound/visual feedback. */
  events: PlantEvent[] = [];

  constructor(
    seed: number,
    public opts: GrowthOptions = DEFAULT_GROWTH,
  ) {
    this.rng = createRng(seed);
  }

  get(id: number): Segment | undefined {
    return this.segments.find((s) => s.id === id);
  }

  /** Adds a new organ axis starting at (x, y). */
  addSegment(
    organ: Organ,
    x: number,
    y: number,
    heading: number,
    now: number,
    parentId: number | null = null,
    plantId = 0,
    clusterId: number | null = null,
  ): Segment {
    const [minL, maxL] =
      organ === 'rhizome'
        ? [this.opts.rhizomeMaxLength, this.opts.rhizomeMaxLength]
        : organ === 'adventitious'
          ? SIM.maxLength.adventitious
          : SIM.maxLength.lateral;
    const seg: Segment = {
      id: this.nextId++,
      organ,
      parentId,
      plantId,
      clusterId,
      points: [{ x, y, born: now }],
      heading,
      growing: true,
      growthRate: SIM.growthRate[organ] * this.rng.range(0.85, 1.15),
      maxLength: this.rng.range(minL, maxL),
      length: 0,
      bornAt: now,
      pulsePhase: this.rng.range(0, SIM.pulse.period),
      nextNodeAt: SIM.rhizomeNodeSpacing * this.rng.range(0.6, 1),
      lateralsDone: organ !== 'adventitious',
    };
    this.segments.push(seg);
    this.events.push({ kind: organ, segmentId: seg.id, x, y });
    return seg;
  }

  /** Adds a ramet (shoot) and its first rhizome heading left or right. */
  addRhizome(x: number, y: number, direction: 1 | -1, now: number, plantId = 0): Segment {
    this.ramets.push({ x, bornAt: now, plantId });
    return this.addSegment('rhizome', x, y, direction === 1 ? 0 : Math.PI, now, null, plantId);
  }

  /** Schedules a group of adventitious roots from a point (e.g. a rhizome node). */
  scheduleRoots(parentId: number, x: number, y: number, at: number, count: number): void {
    this.pending.push({ at, parentId, x, y, count });
  }

  growingRoots(): number {
    return this.segments.filter((s) => s.organ === 'adventitious' && s.growing).length;
  }

  /** Is this organ in an active growth pulse right now? */
  inPulse(seg: Segment, now: number): boolean {
    if (!this.opts.pulses) return true;
    const p = SIM.pulse.period;
    return (now + seg.pulsePhase) % p < p * SIM.pulse.active;
  }

  /** Advances growth by dt sim hours, ending at sim hour `now`. */
  step(dt: number, now: number): void {
    const o = this.opts;
    // Scheduled emergences (adventitious roots from rhizome nodes).
    const due = this.pending.filter((p) => p.at <= now);
    this.pending = this.pending.filter((p) => p.at > now);
    for (const p of due) {
      for (let i = 0; i < p.count; i++) {
        if (this.growingRoots() >= o.maxGrowingRoots) break;
        const heading = Math.PI / 2 + this.rng.range(-0.75, 0.75);
        const plantId = this.get(p.parentId)?.plantId ?? 0;
        this.addSegment(
          'adventitious',
          p.x + this.rng.range(-22, 22),
          p.y + 4,
          heading,
          now,
          p.parentId,
          plantId,
        );
      }
    }

    for (const seg of [...this.segments]) {
      if (seg.organ === 'adventitious' && !seg.lateralsDone && o.lateralsEnabled) {
        this.maybeEmitLaterals(seg, now);
      }
      if (!seg.growing || !this.inPulse(seg, now)) continue;
      this.grow(seg, seg.growthRate * o.growthBoost * dt, now);
    }
  }

  private grow(seg: Segment, amount: number, now: number): void {
    const b = this.opts.bounds;
    let remaining = amount;
    while (remaining > 0 && seg.growing) {
      const last = seg.points[seg.points.length - 1]!;
      const stepLen = Math.min(remaining, SIM.pointSpacing);
      seg.heading += this.wander(seg);
      const nx = last.x + Math.cos(seg.heading) * stepLen;
      const ny = last.y + Math.sin(seg.heading) * stepLen;
      remaining -= stepLen;
      seg.length += stepLen;
      // Accumulate sub-spacing growth into the tip point until a full spacing is reached.
      const prev = seg.points[seg.points.length - 2];
      const tipDist = prev ? Math.hypot(last.x - prev.x, last.y - prev.y) : SIM.pointSpacing;
      if (seg.points.length > 1 && tipDist < SIM.pointSpacing) {
        last.x = nx;
        last.y = ny;
        last.born = now;
      } else {
        seg.points.push({ x: nx, y: ny, born: now });
      }
      const outside = nx < b.left || nx > b.right || ny < b.top || ny > b.bottom;
      if (seg.length >= seg.maxLength || outside) {
        this.stop(seg, now);
        break;
      }
      if (seg.organ === 'rhizome' && seg.length >= seg.nextNodeAt) {
        seg.nextNodeAt += SIM.rhizomeNodeSpacing * this.rng.range(0.8, 1.2);
        if (this.opts.rhizomeRoots) {
          const count = 1 + Math.floor(this.rng.range(0, 3));
          this.scheduleRoots(seg.id, nx, ny, now + this.opts.adventitiousDelayHours, count);
        }
      }
    }
  }

  private stop(seg: Segment, now: number): void {
    seg.growing = false;
    if (seg.organ === 'rhizome') {
      // The rhizome apex turns up into a new aboveground ramet.
      const tip = seg.points[seg.points.length - 1]!;
      this.ramets.push({ x: tip.x, bornAt: now, plantId: seg.plantId });
      this.events.push({ kind: 'ramet', segmentId: seg.id, x: tip.x, y: tip.y });
    }
  }

  /** Organ-specific direction change per step: rhizomes stay level, roots head down. */
  private wander(seg: Segment): number {
    const jitter = this.rng.range(-1, 1);
    if (seg.organ === 'rhizome') {
      const level = seg.heading > Math.PI / 2 ? Math.PI : 0;
      return jitter * 0.05 + (level - seg.heading) * 0.06;
    }
    if (seg.organ === 'adventitious') return jitter * 0.09 + (Math.PI / 2 - seg.heading) * 0.03;
    return jitter * 0.12;
  }

  /** Laterals erupt in a cluster from a mature-enough section of an adventitious root. */
  private maybeEmitLaterals(seg: Segment, now: number): void {
    const pts = seg.points;
    if (pts.length < 8) return;
    const i0 = Math.floor(pts.length * 0.25);
    const anchor = pts[i0]!;
    if (now - anchor.born < this.opts.lateralDelayHours) return;
    seg.lateralsDone = true;
    const cluster = this.nextCluster++;
    const [lo, hi] = SIM.lateralsPerCluster;
    const n = lo + Math.floor(this.rng.range(0, hi - lo + 1));
    const span = Math.max(4, Math.floor(pts.length * 0.4));
    for (let k = 0; k < n; k++) {
      const p = pts[Math.min(pts.length - 2, i0 + Math.floor((k / n) * span))]!;
      const side = k % 2 === 0 ? 1 : -1;
      const heading = Math.PI / 2 + side * this.rng.range(0.9, 1.4);
      this.addSegment('lateral', p.x, p.y, heading, now, seg.id, seg.plantId, cluster);
    }
  }

  /** The (x, y) of a segment's newest tissue. */
  tip(seg: Segment): TissuePoint {
    return seg.points[seg.points.length - 1]!;
  }

  drainEvents(): PlantEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }
}

/**
 * Oxygen release from one tissue point, per tissue age — the heart of the model.
 * Full release while young, then a linear fade as the tissue matures (in real Typha roots, a
 * suberized barrier to radial oxygen loss is a proposed cause; the paper speculates, so do we).
 * Laterals ramp in, then release for far longer.
 */
export function releaseFactor(organ: Organ, ageHours: number): number {
  if (ageHours < 0) return 0;
  const r = SIM.release[organ];
  let f: number;
  if (r.rampIn > 0 && ageHours < r.rampIn) f = ageHours / r.rampIn;
  else if (ageHours <= r.plateau) f = 1;
  else if (ageHours >= r.end) f = 0;
  else f = 1 - (ageHours - r.plateau) / (r.end - r.plateau);
  if (organ !== 'lateral' && ageHours < SIM.tipAgeHours) f *= SIM.tipBoost;
  if (organ === 'lateral') f *= SIM.lateralReleaseScale;
  return f;
}
