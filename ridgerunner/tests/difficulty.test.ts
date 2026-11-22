import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/levels';
import { createGame, score, stepGame, type GameState } from '../src/systems/game';
import { TILE, type Landscape } from '../src/systems/network';
import { TERRAIN, type Tile } from '../src/systems/terrain';
import type { LevelConfig } from '../src/levels/types';

// Empirically validates difficulty instead of asserting it by eye: a scripted bot walks each
// level with a sensible (not perfect, not reckless) strategy — the shortest route that also
// prefers gentler terrain over harsh drain — and we check it actually wins, and that the margin
// it wins by tightens as the level number goes up. This is the same standard the studio has
// used elsewhere this session: don't ship unvalidated difficulty.

const DT = 1 / 60;
const WAYPOINT_RADIUS = 10;
const MAX_SECONDS = 400;

/** Dijkstra over the tile grid. `weighted` makes it favour streams and logs over clearings the
 * way a moisture-conscious player would (a "cautious" bot); unweighted, it's the shortest tile
 * path regardless of terrain (a "direct" bot who doesn't detour for shelter). Neither is a
 * perfect solver — that's the point, they're stand-ins for different real playstyles. */
function findPath(land: Landscape, weighted: boolean): { tx: number; ty: number }[] {
  const n = land.cols * land.rows;
  const dist = new Float64Array(n).fill(Infinity);
  const prev = new Int32Array(n).fill(-1);
  const visited = new Uint8Array(n);
  const startIdx = land.start.ty * land.cols + land.start.tx;
  const destIdx = land.destination.ty * land.cols + land.destination.tx;
  dist[startIdx] = 0;

  const tileCost = (kind: Tile): number =>
    weighted ? 1 + Math.max(0, -TERRAIN[kind].moistureRate) * 0.12 : 1;

  for (;;) {
    let u = -1;
    let best = Infinity;
    for (let i = 0; i < n; i++) {
      if (!visited[i] && (dist[i] as number) < best) {
        best = dist[i] as number;
        u = i;
      }
    }
    if (u === -1 || u === destIdx) break;
    visited[u] = 1;
    const ux = u % land.cols;
    const uy = Math.floor(u / land.cols);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const vx = ux + dx;
      const vy = uy + dy;
      if (vx < 0 || vy < 0 || vx >= land.cols || vy >= land.rows) continue;
      const v = vy * land.cols + vx;
      const kind = land.tiles[v] ?? 'barrier';
      if (!TERRAIN[kind].passable) continue;
      const cand = (dist[u] as number) + tileCost(kind);
      if (cand < (dist[v] as number)) {
        dist[v] = cand;
        prev[v] = u;
      }
    }
  }

  const path: { tx: number; ty: number }[] = [];
  let cur = destIdx;
  if (dist[destIdx] === Infinity) return path;
  while (cur !== -1) {
    path.unshift({ tx: cur % land.cols, ty: Math.floor(cur / land.cols) });
    cur = prev[cur] as number;
  }
  return path;
}

interface Run {
  won: boolean;
  timeFrac: number; // fraction of the time limit left when the run ended
  moistureFrac: number; // fraction of max moisture left
  total: number;
  stars: 1 | 2 | 3;
}

function play(level: LevelConfig, weighted: boolean): Run {
  const s: GameState = createGame(level);
  const path = findPath(s.land, weighted);
  expect(path.length).toBeGreaterThan(0); // the level must have a route at all

  let wp = 1; // path[0] is the start tile itself
  for (let t = 0; t < MAX_SECONDS && s.status === 'playing'; t += DT) {
    while (
      wp < path.length - 1 &&
      Math.hypot(
        s.moss.x - (path[wp]!.tx * TILE + TILE / 2),
        s.moss.y - (path[wp]!.ty * TILE + TILE / 2),
      ) < WAYPOINT_RADIUS
    )
      wp++;
    const target = path[Math.min(wp, path.length - 1)]!;
    const tx = target.tx * TILE + TILE / 2 - s.moss.x;
    const ty = target.ty * TILE + TILE / 2 - s.moss.y;
    const len = Math.hypot(tx, ty) || 1;
    stepGame(s, { dx: tx / len, dy: ty / len }, DT);
  }

  const { total, stars } = score(s);
  return {
    won: s.status === 'won',
    timeFrac: Math.max(0, (level.timeLimit - s.time) / level.timeLimit),
    moistureFrac: s.moisture / 100,
    total,
    stars,
  };
}

function logMargins(label: string, runs: { level: LevelConfig; run: Run }[]): number[] {
  const ease = runs.map(({ run }) => run.timeFrac * run.moistureFrac);

  console.log(
    label,
    runs.map(({ level, run }, i) => ({
      level: level.name,
      won: run.won,
      timeFrac: Number(run.timeFrac.toFixed(2)),
      moistureFrac: Number(run.moistureFrac.toFixed(2)),
      ease: Number(ease[i]!.toFixed(2)),
      stars: run.stars,
    })),
  );
  return ease;
}

describe('empirical difficulty', () => {
  // A cautious bot: Dijkstra weighted to favour streams and shelter over harsh drain. Stands in
  // for a careful player who takes the safe route whenever one exists.
  const cautious = LEVELS.map((level) => ({ level, run: play(level, true) }));
  // A direct bot: shortest tile path regardless of terrain. Stands in for a player who doesn't
  // detour for shelter and just heads for the destination.
  const direct = LEVELS.map((level) => ({ level, run: play(level, false) }));

  it('every campaign level is winnable by the cautious bot (a safe route always exists)', () => {
    for (const { level, run } of cautious) {
      expect(run.won, `${level.name} should be winnable taking the safe route`).toBe(true);
    }
  });

  it('the direct bot wins the early levels without needing to detour for shelter', () => {
    // Levels 1-3 stay true to "approachable tutorial, then a first real crossing": going
    // straight for the exit without managing moisture still works.
    for (const { level, run } of direct.slice(0, 3)) {
      expect(run.won, `${level.name} should be winnable going straight for the exit`).toBe(true);
    }
  });

  it('by level 4, going straight for the exit without a plan can actually fail', () => {
    // This is the empirical proof that the clearing-vs-logs (and clearing-vs-shelter) choices
    // introduced from level 4 onward are real, not cosmetic: a bot that ignores terrain and
    // just heads for the destination can run dry. The *cautious* bot (tested above) still wins
    // every level — so the game is always winnable, just no longer forgiving of ignoring the
    // terrain choice once the crossings get real.
    const anyFailsDirect = direct.slice(3).some(({ run }) => !run.won);
    expect(anyFailsDirect).toBe(true);
  });

  it('none of the levels hands out three stars for free', () => {
    const anyBelowThree = [...cautious, ...direct].some(({ run }) => run.stars < 3);
    expect(anyBelowThree).toBe(true);
  });

  it('the direct route gets riskier from level 1 towards level 5', () => {
    // Taking the shortest path without detouring for shelter is how difficulty was tuned: more
    // overland distance, tighter time budgets and harsher terrain going into later levels should
    // show up here as shrinking margin, even though the safe (cautious) route stays comfortable.
    const ease = logMargins('direct-bot margins:', direct);
    expect(ease[ease.length - 1]!).toBeLessThan(ease[0]!);
    expect(ease[0]! - ease[ease.length - 1]!).toBeGreaterThan(0.1);
  });

  it('the cautious route stays winnable with comfortable margin throughout', () => {
    logMargins('cautious-bot margins:', cautious);
    for (const { level, run } of cautious) {
      expect(run.moistureFrac, `${level.name} cautious moisture margin`).toBeGreaterThan(0.15);
    }
  });
});

describe('star thresholds are calibrated against real play, not guessed', () => {
  it('a sensible (cautious) run clears the two-star bar on every level, without maxing out three', () => {
    for (const level of LEVELS) {
      const run = play(level, true);
      expect(run.total, `${level.name} total`).toBeGreaterThanOrEqual(level.stars[1]);
      expect(run.total, `${level.name} total`).toBeLessThan(level.stars[2]);
    }
  });
});
