import { describe, expect, it } from 'vitest';
import type { CrewId } from '../src/content/crew';
import { job7 } from '../src/levels/job7';
import { pathIndexAt, TILE, type Spot } from '../src/systems/building';
import {
  createMission,
  findPath,
  inCone,
  stepMission,
  type Input,
  type Mission,
} from '../src/systems/mission';

const DT = 1 / 60;

function tileOf(m: Mission): Spot {
  return { tx: Math.floor(m.player.x / TILE), ty: Math.floor(m.player.y / TILE) };
}

function seenAt(m: Mission, x: number, y: number): boolean {
  for (const c of m.cameras)
    if (inCone(m, c.x, c.y, c.angle, m.rules.cameraRange, m.rules.cameraHalfAngle, x, y))
      return true;
  for (const g of m.guards)
    if (inCone(m, g.x, g.y, g.heading, m.rules.guardRange, m.rules.guardHalfAngle, x, y))
      return true;
  return false;
}

/**
 * Follow findPath tile by tile toward a target. Won't step onto a tile that's exposed right
 * now (a careful player waiting for a sweep to pass), even when the current tile is safe.
 */
function stepToward(m: Mission, target: Spot, sprint: boolean): Input {
  const stay: Input = { dx: 0, dy: 0, sprint: false, fold: false, interact: false };
  if (seenAt(m, m.player.x, m.player.y)) return stay;
  const route = findPath(m, tileOf(m), target);
  const next = route[1] ?? route[0] ?? target;
  const cx = next.tx * TILE + TILE / 2;
  const cy = next.ty * TILE + TILE / 2;
  if (seenAt(m, cx, cy)) return stay;
  const dx = cx - m.player.x;
  const dy = cy - m.player.y;
  const d = Math.hypot(dx, dy);
  if (d < 1) return stay;
  return { dx: dx / d, dy: dy / d, sprint, fold: false, interact: false };
}

/**
 * The intended route for Job 7: left wing -> up the service corridor ring -> right wing ->
 * diamond -> back the same way -> van. This never sets foot in the guarded showroom at all —
 * the ring is walled off from every guard's line of sight for its entire length. The Folder
 * goes up early (while the escape clock isn't running yet) so the ring's shortcut is open by
 * the time the diamond is in hand. A plain shortest-path bot would instead cut straight through
 * the showroom, since it's geometrically shorter and the bot doesn't know it's dangerous — this
 * is why an earlier, simpler validation wrongly concluded the job was unwinnable.
 */
function runRingStrategy(crewId: CrewId, seed: number): Mission {
  const m = createMission(job7, crewId, seed);
  const leftEndIdx = pathIndexAt(m.b, 2, 11);
  const rightEndIdx = pathIndexAt(m.b, 33, 11);
  const ring = m.b.path.slice(
    Math.min(leftEndIdx, rightEndIdx),
    Math.max(leftEndIdx, rightEndIdx) + 1,
  );
  const ringForward = leftEndIdx < rightEndIdx ? ring : [...ring].reverse();
  const ringBackward = [...ringForward].reverse();
  const waypoints: Spot[] = [
    { tx: 6, ty: 18 },
    { tx: 6, ty: 13 },
    { tx: 2, ty: 13 },
    ...ringForward,
    { tx: 33, ty: 13 },
    { tx: 30, ty: 13 },
    { tx: 30, ty: 15 }, // the diamond
    { tx: 33, ty: 13 },
    ...ringBackward,
    { tx: 2, ty: 13 },
    { tx: 6, ty: 13 },
    { tx: 6, ty: 18 },
    { tx: 2, ty: 19 }, // the van
  ];
  let wi = 0;
  let deployed = false;
  for (let t = 0; t < 90 && m.status === 'playing'; t += DT) {
    const wp = waypoints[wi];
    if (!wp) break;
    const here = tileOf(m);
    if (Math.hypot(here.tx - wp.tx, here.ty - wp.ty) < 1) {
      wi++;
      continue;
    }
    const input = stepToward(m, wp, m.hasDiamond);
    if (!deployed && !m.hasDiamond && pathIndexAt(m.b, here.tx, here.ty) >= 0) {
      input.fold = true;
      deployed = true;
    }
    stepMission(m, input, DT);
  }
  return m;
}

describe('Job 7, "The Last Job"', () => {
  it('is winnable via the service corridor, for every crew member', () => {
    const crew: CrewId[] = ['ghost', 'flash', 'anchor', 'phantom', 'architect'];
    for (const crewId of crew) {
      const m = runRingStrategy(crewId, 1);
      expect(m.status, `${crewId}: ${m.lostReason ?? 'ok'}`).toBe('won');
      // Real margin to spare, not a frame-perfect finish.
      expect(m.escapeLeft).toBeGreaterThan(5);
    }
  });

  it('the ring route is robust to the random seed', () => {
    for (const seed of [2, 3, 4, 5]) {
      const m = runRingStrategy('ghost', seed);
      expect(m.status).toBe('won');
    }
  });
});
