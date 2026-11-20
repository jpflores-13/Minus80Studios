import { rayCapsule, rayCircle, type Vec } from './geometry';

// STAR SENSE: 22 short touch probes around the nose, 11 on each side. They only report what they
// physically touch, a few times a second, like quick taps. Nothing here sees at a distance.
//
// The layout is a gameplay simplification of the real star: the rays are not evenly spaced or
// equal in length, and the innermost pair (ray 11 on each side) is short, points straight ahead,
// and is the sharp "fovea" used by STAR FOCUS. Angles, lengths and resolutions are play values.

export interface Ray {
  /** 1-11, counted the way the real star is usually numbered. */
  number: number;
  side: -1 | 1;
  /** Angle from straight ahead, radians (positive = to the right). */
  angle: number;
  /** Reach in px. */
  length: number;
  /** How much each touch tells you (0-1). Ray 11 is the sharp one. */
  resolution: number;
}

function buildRays(): Ray[] {
  const rays: Ray[] = [];
  for (const side of [-1, 1] as const) {
    for (let n = 1; n <= 11; n++) {
      if (n === 11) {
        rays.push({ number: 11, side, angle: side * 0.12, length: 20, resolution: 1 });
        continue;
      }
      // rays 1-10 fan out around the side, longest in the middle of the fan
      const t = (n - 1) / 9;
      const angle = side * (0.35 + t * 1.55);
      const length = 26 + Math.sin(t * Math.PI) * 12 - (n === 1 ? 3 : 0);
      rays.push({ number: n, side, angle, length, resolution: 0.18 + (n >= 9 ? 0.08 : 0) });
    }
  }
  return rays;
}

export const RAYS: Ray[] = buildRays();

/** Something a ray can touch. */
export interface Touchable {
  id: number;
  material: string;
  /** Circles for pebbles and beetles; capsules (chains of segments) for worms, larvae and roots. */
  shape: { kind: 'circle'; c: Vec; r: number } | { kind: 'chain'; points: Vec[]; r: number };
}

export interface Contact {
  ray: Ray;
  id: number;
  material: string;
  x: number;
  y: number;
  dist: number;
}

export interface Pose {
  x: number;
  y: number;
  heading: number;
}

/** Where the star sits: just ahead of the body. */
export function nosePoint(p: Pose, offset = 12): Vec {
  return { x: p.x + Math.cos(p.heading) * offset, y: p.y + Math.sin(p.heading) * offset };
}

export function rayLength(ray: Ray, focus: boolean): number {
  return ray.number === 11 && focus ? ray.length * 2.2 : ray.length;
}

/** One ray's touch, if it touches anything within reach. Walls are passed in as a test function. */
export function probe(
  ray: Ray,
  pose: Pose,
  things: readonly Touchable[],
  focus: boolean,
  wall?: (x: number, y: number) => string | null,
): Contact | null {
  const o = nosePoint(pose);
  const a = pose.heading + ray.angle;
  const dir = { x: Math.cos(a), y: Math.sin(a) };
  const len = rayLength(ray, focus);
  let best: Contact | null = null;
  for (const t of things) {
    // cheap reject: too far away to touch
    const anchor = t.shape.kind === 'circle' ? t.shape.c : (t.shape.points[0] as Vec);
    const span = t.shape.kind === 'circle' ? t.shape.r : t.shape.points.length * 12 + t.shape.r;
    if (Math.hypot(anchor.x - o.x, anchor.y - o.y) > len + span + 8) continue;
    let d: number | null = null;
    if (t.shape.kind === 'circle') d = rayCircle(o, dir, len, t.shape.c, t.shape.r);
    else {
      const pts = t.shape.points;
      for (let i = 0; i + 1 < pts.length; i++) {
        const hit = rayCapsule(o, dir, len, pts[i] as Vec, pts[i + 1] as Vec, t.shape.r);
        if (hit !== null && (d === null || hit < d)) d = hit;
      }
    }
    if (d !== null && (!best || d < best.dist))
      best = {
        ray,
        id: t.id,
        material: t.material,
        x: o.x + dir.x * d,
        y: o.y + dir.y * d,
        dist: d,
      };
  }
  if (wall) {
    for (let t = 2; t <= len && (!best || t < best.dist); t += 2) {
      const m = wall(o.x + dir.x * t, o.y + dir.y * t);
      if (m) return { ray, id: -1, material: m, x: o.x + dir.x * t, y: o.y + dir.y * t, dist: t };
    }
  }
  return best;
}

/** A remembered touch. It fades after `memory` seconds. */
export interface Mark {
  x: number;
  y: number;
  id: number;
  material: string;
  time: number;
  resolution: number;
}

/**
 * Sensory memory: recent touches, and how much each object has been explored. Information fades:
 * marks expire, and evidence about an object drains away once you stop touching it.
 */
export class SensoryMemory {
  marks: Mark[] = [];
  private evidence = new Map<number, { amount: number; last: number }>();

  constructor(
    public memory: number,
    private readonly limit = 900,
  ) {}

  add(c: Contact, time: number, acuity: number): void {
    this.addRaw(c.id, c.material, c.x, c.y, c.ray.resolution, time, acuity);
  }

  /** A BUBBLE SNIFF reveal: evidence from odour rather than a ray's touch. */
  addScent(
    id: number,
    material: string,
    x: number,
    y: number,
    resolution: number,
    time: number,
  ): void {
    this.addRaw(id, material, x, y, resolution, time, 1);
  }

  private addRaw(
    id: number,
    material: string,
    x: number,
    y: number,
    resolution: number,
    time: number,
    acuity: number,
  ): void {
    this.marks.push({ x, y, id, material, time, resolution });
    if (this.marks.length > this.limit) this.marks.splice(0, this.marks.length - this.limit);
    if (id < 0) return;
    const e = this.evidence.get(id) ?? { amount: 0, last: time };
    e.amount += resolution * acuity;
    e.last = time;
    this.evidence.set(id, e);
  }

  /** How sure you are about an object (0 = no idea). Drains after the memory window. */
  confidence(id: number, time: number): number {
    const e = this.evidence.get(id);
    if (!e) return 0;
    const idle = time - e.last;
    return idle <= this.memory ? e.amount : Math.max(0, e.amount - (idle - this.memory) * 0.8);
  }

  /** Strength (1 → 0) of a mark at this moment. */
  fade(m: Mark, time: number): number {
    return Math.max(0, 1 - (time - m.time) / this.memory);
  }

  prune(time: number): void {
    if (this.marks.length && time - (this.marks[0]?.time ?? time) > this.memory)
      this.marks = this.marks.filter((m) => time - m.time <= this.memory);
    for (const [id, e] of this.evidence)
      if (time - e.last > this.memory * 4) this.evidence.delete(id);
  }

  forget(id: number): void {
    this.evidence.delete(id);
    this.marks = this.marks.filter((m) => m.id !== id);
  }
}
