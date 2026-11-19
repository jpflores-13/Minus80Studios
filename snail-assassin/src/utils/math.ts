export interface Vec2 {
  x: number;
  y: number;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function length(v: Vec2): number {
  return Math.hypot(v.x, v.y);
}

/** Unit vector in the same direction, or (0, 0) for a zero vector. */
export function normalize(v: Vec2): Vec2 {
  const len = length(v);
  return len === 0 ? { x: 0, y: 0 } : { x: v.x / len, y: v.y / len };
}

/** Move `current` toward `target` by at most `maxDelta` (never overshoots). */
export function approach(current: Vec2, target: Vec2, maxDelta: number): Vec2 {
  const dx = target.x - current.x;
  const dy = target.y - current.y;
  const dist = Math.hypot(dx, dy);
  if (dist <= maxDelta || dist === 0) return { x: target.x, y: target.y };
  return { x: current.x + (dx / dist) * maxDelta, y: current.y + (dy / dist) * maxDelta };
}
