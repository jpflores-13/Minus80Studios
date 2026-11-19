import type { Vec2 } from '../utils/math';

/**
 * Waterway network: a directed graph of polyline segments (think of a river
 * network as a tree of reaches). Each segment hands floating debris to its
 * `downstream` segment, or to the outlet (the ocean) when `downstream` is null.
 */
export interface Segment {
  id: string;
  points: Vec2[];
  /** Base surface velocity (px/s). A gameplay value, not a measured flow. */
  speed: number;
  /** Visual half-width of the channel (px). */
  halfWidth: number;
  downstream: string | null;
}

export function segmentLength(seg: Segment): number {
  let total = 0;
  for (let i = 1; i < seg.points.length; i++) {
    const a = seg.points[i - 1]!;
    const b = seg.points[i]!;
    total += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return total;
}

/** Position and unit tangent at arc-length `s` along the segment (clamped to its ends). */
export function pointAt(seg: Segment, s: number): { pos: Vec2; tangent: Vec2 } {
  let remaining = Math.max(0, s);
  for (let i = 1; i < seg.points.length; i++) {
    const a = seg.points[i - 1]!;
    const b = seg.points[i]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const tangent = len > 0 ? { x: (b.x - a.x) / len, y: (b.y - a.y) / len } : { x: 1, y: 0 };
    if (remaining <= len || i === seg.points.length - 1) {
      const t = len > 0 ? Math.min(remaining, len) / len : 0;
      return { pos: { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }, tangent };
    }
    remaining -= len;
  }
  const only = seg.points[0] ?? { x: 0, y: 0 };
  return { pos: { ...only }, tangent: { x: 1, y: 0 } };
}

/** World position of an item at arc-length `s` and lateral offset `lateral` ∈ [−1, 1] across the channel. */
export function worldPosition(seg: Segment, s: number, lateral: number): Vec2 {
  const { pos, tangent } = pointAt(seg, s);
  const normal = { x: -tangent.y, y: tangent.x };
  return {
    x: pos.x + normal.x * lateral * seg.halfWidth,
    y: pos.y + normal.y * lateral * seg.halfWidth,
  };
}

/** Relative speed across the channel: faster mid-channel, slower near banks (placeholder profile). */
export function lateralSpeedFactor(lateral: number): number {
  return 0.55 + 0.45 * (1 - lateral * lateral);
}

/** Every segment must eventually reach the outlet without cycles. */
export function validateNetwork(segments: Segment[]): string[] {
  const errors: string[] = [];
  const byId = new Map(segments.map((s) => [s.id, s]));
  for (const seg of segments) {
    if (seg.points.length < 2) errors.push(`${seg.id}: needs at least 2 points`);
    const seen = new Set<string>();
    let cur: Segment | undefined = seg;
    while (cur) {
      if (seen.has(cur.id)) {
        errors.push(`${seg.id}: cycle detected`);
        break;
      }
      seen.add(cur.id);
      if (cur.downstream === null) break;
      const next = byId.get(cur.downstream);
      if (!next) errors.push(`${cur.id}: unknown downstream "${cur.downstream}"`);
      cur = next;
    }
  }
  return errors;
}
