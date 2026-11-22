import { TERRAIN } from './terrain';
import { fromLevel, tileAt, watershedAt, TILE, type Landscape } from './network';
import type { LevelConfig, RainEvent } from '../levels/types';

// Moss's whole run as plain data plus stepGame(). Scenes draw it; tests drive it directly.

export const TUNING = {
  moveSpeed: 90,
  bodyRadius: 9,
  maxMoisture: 100,
  startMoisture: 70,
  /** Rain cuts how much of a terrestrial tile's drain still applies. */
  rainRelief: 0.45,
};

export interface Input {
  dx: number;
  dy: number;
}

export const NO_INPUT: Input = { dx: 0, dy: 0 };

export interface GameState {
  level: LevelConfig;
  land: Landscape;
  moss: { x: number; y: number; heading: number; moving: boolean };
  moisture: number;
  time: number;
  status: 'playing' | 'won' | 'lost';
  lostReason: 'dry' | 'time' | null;
  raining: boolean;
  distanceStream: number;
  distanceOverland: number;
  watershedCrossings: number;
  visitedWatersheds: Set<number>;
  startWatershed: number | null;
  /** A kinder difficulty: terrain drains moisture more slowly, not a different game. */
  easyMode: boolean;
}

export type GameEvent =
  | { type: 'rainStart' }
  | { type: 'rainEnd' }
  | { type: 'crossing'; watershed: number }
  | { type: 'dry' }
  | { type: 'won' }
  | { type: 'lost'; reason: 'dry' | 'time' };

export function createGame(level: LevelConfig, easyMode = false): GameState {
  const land = fromLevel(level);
  const start = { x: land.start.tx * TILE + TILE / 2, y: land.start.ty * TILE + TILE / 2 };
  const startWatershed = watershedAt(land, land.start.tx, land.start.ty);
  return {
    level,
    land,
    moss: { x: start.x, y: start.y, heading: 0, moving: false },
    moisture: TUNING.startMoisture,
    time: 0,
    status: 'playing',
    lostReason: null,
    raining: false,
    distanceStream: 0,
    distanceOverland: 0,
    watershedCrossings: 0,
    visitedWatersheds: new Set(startWatershed !== null ? [startWatershed] : []),
    startWatershed,
    easyMode,
  };
}

function isRaining(rain: RainEvent[], t: number): boolean {
  return rain.some((r) => t >= r.at && t < r.at + r.duration);
}

function walkable(land: Landscape, x: number, y: number, r: number): boolean {
  for (const [ox, oy] of [
    [-r, -r],
    [r, -r],
    [-r, r],
    [r, r],
  ] as const) {
    const tx = Math.floor((x + ox) / TILE);
    const ty = Math.floor((y + oy) / TILE);
    if (!TERRAIN[tileAt(land, tx, ty)].passable) return false;
  }
  return true;
}

export function stepGame(s: GameState, input: Input, dt: number): GameEvent[] {
  if (s.status !== 'playing') return [];
  const ev: GameEvent[] = [];
  s.time += dt;

  const wasRaining = s.raining;
  s.raining = isRaining(s.level.rain, s.time);
  if (s.raining && !wasRaining) ev.push({ type: 'rainStart' });
  if (!s.raining && wasRaining) ev.push({ type: 'rainEnd' });

  const len = Math.hypot(input.dx, input.dy);
  s.moss.moving = len > 0.1;
  if (s.moss.moving) {
    const dx = input.dx / Math.max(1, len);
    const dy = input.dy / Math.max(1, len);
    s.moss.heading = Math.atan2(dy, dx);
    const tx = Math.floor(s.moss.x / TILE);
    const ty = Math.floor(s.moss.y / TILE);
    const kind = tileAt(s.land, tx, ty);
    const speed = TUNING.moveSpeed * TERRAIN[kind].speed;
    const nx = s.moss.x + dx * speed * dt;
    const ny = s.moss.y + dy * speed * dt;
    const r = TUNING.bodyRadius;
    let moved = 0;
    if (walkable(s.land, nx, s.moss.y, r)) {
      moved += Math.abs(nx - s.moss.x);
      s.moss.x = nx;
    }
    if (walkable(s.land, s.moss.x, ny, r)) {
      moved += Math.abs(ny - s.moss.y);
      s.moss.y = ny;
    }
    if (kind === 'stream') s.distanceStream += moved;
    else s.distanceOverland += moved;
  }

  // moisture: drains or regenerates based on the tile Moss is standing on right now
  const htx = Math.floor(s.moss.x / TILE);
  const hty = Math.floor(s.moss.y / TILE);
  const kind = tileAt(s.land, htx, hty);
  let rate = TERRAIN[kind].moistureRate;
  if (rate < 0 && s.raining) rate *= 1 - TUNING.rainRelief;
  if (rate < 0 && s.easyMode) rate *= 0.6;
  s.moisture = Math.min(TUNING.maxMoisture, Math.max(0, s.moisture + rate * dt));

  // watershed crossings: a new stream network entered this run that wasn't the starting one
  const here = watershedAt(s.land, htx, hty);
  if (here !== null && !s.visitedWatersheds.has(here)) {
    s.visitedWatersheds.add(here);
    s.watershedCrossings++;
    ev.push({ type: 'crossing', watershed: here });
  }

  if (s.moisture <= 0) {
    s.status = 'lost';
    s.lostReason = 'dry';
    ev.push({ type: 'dry' }, { type: 'lost', reason: 'dry' });
    return ev;
  }

  const dest = s.land.destination;
  const dcx = dest.tx * TILE + TILE / 2;
  const dcy = dest.ty * TILE + TILE / 2;
  if (Math.hypot(s.moss.x - dcx, s.moss.y - dcy) < TILE * 0.65) {
    s.status = 'won';
    ev.push({ type: 'won' });
    return ev;
  }

  if (s.time >= s.level.timeLimit) {
    s.status = 'lost';
    s.lostReason = 'time';
    ev.push({ type: 'lost', reason: 'time' });
  }
  return ev;
}

/** A rough three-tier ranking from how much moisture is left and how direct the route was. */
export function score(s: GameState): { total: number; stars: 1 | 2 | 3 } {
  const total = Math.round(
    s.moisture * 8 + Math.max(0, s.level.timeLimit - s.time) * 4 + s.watershedCrossings * 50,
  );
  const [, two, three] = s.level.stars;
  const stars: 1 | 2 | 3 = total >= three ? 3 : total >= two ? 2 : 1;
  return { total, stars };
}
