// Small geometry helpers for touch probes: where does a short line segment first touch a circle
// or a capsule (a line with thickness, used for worms and roots)?

export interface Vec {
  x: number;
  y: number;
}

/** Distance along the ray (0..len) to the first touch of a circle, or null. */
export function rayCircle(o: Vec, dir: Vec, len: number, c: Vec, r: number): number | null {
  const fx = o.x - c.x;
  const fy = o.y - c.y;
  const b = fx * dir.x + fy * dir.y;
  const cc = fx * fx + fy * fy - r * r;
  if (cc <= 0) return 0; // starting inside: touching already
  const disc = b * b - cc;
  if (disc < 0) return null;
  const t = -b - Math.sqrt(disc);
  return t >= 0 && t <= len ? t : null;
}

/** Closest distance between point p and segment ab. */
export function pointSegment(p: Vec, a: Vec, b: Vec): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const l2 = abx * abx + aby * aby;
  const t = l2 > 0 ? Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby) / l2)) : 0;
  return Math.hypot(p.x - (a.x + abx * t), p.y - (a.y + aby * t));
}

/**
 * Distance along the ray to the first touch of a capsule (segment ab with radius r), or null.
 * Marched in small steps: rays are short, so this is cheap and robust.
 */
export function rayCapsule(
  o: Vec,
  dir: Vec,
  len: number,
  a: Vec,
  b: Vec,
  r: number,
  step = 1.5,
): number | null {
  for (let t = 0; t <= len; t += step) {
    if (pointSegment({ x: o.x + dir.x * t, y: o.y + dir.y * t }, a, b) <= r) return t;
  }
  return null;
}
