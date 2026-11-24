import { TERRAIN } from './terrain';
import { fromLevel, tileAt, watershedAt, TILE, type Landscape, type PredatorKind } from './network';
import type { LevelConfig, RainEvent } from '../levels/types';

// Moss's whole run as plain data plus stepGame(). Scenes draw it; tests drive it directly.

export const TUNING = {
  moveSpeed: 90,
  bodyRadius: 9,
  maxMoisture: 100,
  startMoisture: 70,
  /** Rain cuts how much of a terrestrial tile's drain still applies. */
  rainRelief: 0.45,
  /** Tail raise: Moss holds still, coiled with the tail raised, for this many seconds. A
   * strike that lands in that window is fended off. A gameplay abstraction of a real
   * torrent-salamander defence posture; see docs/SCIENCE.md. */
  defendSeconds: 0.7,
  /** Seconds before the tail can be raised again (counted from the press). */
  defendCooldown: 3.5,
};

/** Each predator's rhythm: coiled/hidden and harmless (rest), a visible warning (warn), then a
 * lunge (strike) that catches Moss anywhere inside `reach` px of the den's centre. Fiction
 * tuned for play, like the moisture numbers. */
export const PREDATORS = {
  snake: { reach: 48, rest: 2.4, warn: 0.9, warnEasy: 1.5, strike: 0.45 },
  giant: { reach: 58, rest: 3.4, warn: 1.1, warnEasy: 1.7, strike: 0.55 },
} as const satisfies Record<PredatorKind, Record<string, number>>;

export type DenPhase = 'rest' | 'warn' | 'strike';

export interface Input {
  dx: number;
  dy: number;
  /** True on the step the tail-raise key/button was pressed. */
  defend?: boolean;
}

export const NO_INPUT: Input = { dx: 0, dy: 0 };

export interface GameState {
  level: LevelConfig;
  land: Landscape;
  moss: { x: number; y: number; heading: number; moving: boolean };
  moisture: number;
  time: number;
  status: 'playing' | 'won' | 'lost';
  lostReason: 'dry' | 'time' | 'caught' | null;
  /** Which predator ended the run, when lostReason is 'caught'. */
  caughtBy: PredatorKind | null;
  /** Tail raise: seconds left in the pose, and seconds until it can be used again. */
  defence: { timer: number; cooldown: number };
  /** Per den: the time until which it can't catch Moss, after being fended off. */
  denDeterredUntil: number[];
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
  | { type: 'predatorWarn'; den: number; kind: PredatorKind; near: boolean }
  | { type: 'defend' }
  | { type: 'deterred'; den: number; kind: PredatorKind }
  | { type: 'caught'; kind: PredatorKind }
  | { type: 'won' }
  | { type: 'lost'; reason: 'dry' | 'time' | 'caught' };

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
    caughtBy: null,
    defence: { timer: 0, cooldown: 0 },
    denDeterredUntil: land.dens.map(() => -1),
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

/** Where in its rest → warn → strike cycle den `i` is at time `t`. Each den starts at a
 * different point in the cycle so a row of them never strikes in unison. Stateless (a pure
 * function of time), so the scene can draw it and tests can predict it. */
export function denPhase(s: GameState, i: number, t = s.time): { phase: DenPhase; into: number } {
  const p = PREDATORS[s.land.dens[i]!.kind];
  const warn = s.easyMode ? p.warnEasy : p.warn;
  const cycle = p.rest + warn + p.strike;
  const c = (((t + i * 1.3) % cycle) + cycle) % cycle;
  if (c < p.rest) return { phase: 'rest', into: c };
  if (c < p.rest + warn) return { phase: 'warn', into: c - p.rest };
  return { phase: 'strike', into: c - p.rest - warn };
}

/** Whether Moss is holding the tail-raise pose right now. */
export function defending(s: GameState): boolean {
  return s.defence.timer > 0;
}

/** A den's centre in world px. */
export function denCentre(s: GameState, i: number): { x: number; y: number } {
  const d = s.land.dens[i]!;
  return { x: d.tx * TILE + TILE / 2, y: d.ty * TILE + TILE / 2 };
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

  // tail raise: a press starts the pose if it's off cooldown; Moss holds still while posed
  s.defence.timer = Math.max(0, s.defence.timer - dt);
  s.defence.cooldown = Math.max(0, s.defence.cooldown - dt);
  if (input.defend && s.defence.cooldown <= 0) {
    s.defence.timer = TUNING.defendSeconds;
    s.defence.cooldown = TUNING.defendCooldown;
    ev.push({ type: 'defend' });
  }

  const len = defending(s) ? 0 : Math.hypot(input.dx, input.dy);
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

  // predator dens: caught if Moss is inside a den's reach while it strikes, unless the tail
  // is raised, which fends that strike off
  for (let i = 0; i < s.land.dens.length; i++) {
    const kind = s.land.dens[i]!.kind;
    const now = denPhase(s, i);
    const before = denPhase(s, i, s.time - dt).phase;
    const c = denCentre(s, i);
    const dist = Math.hypot(s.moss.x - c.x, s.moss.y - c.y);
    if (now.phase === 'warn' && before === 'rest')
      ev.push({ type: 'predatorWarn', den: i, kind, near: dist < TILE * 5 });
    const inReach = dist < PREDATORS[kind].reach + TUNING.bodyRadius;
    if (now.phase !== 'strike' || !inReach || s.time < (s.denDeterredUntil[i] ?? -1)) continue;
    if (defending(s)) {
      // put off for the rest of this strike
      s.denDeterredUntil[i] = s.time + PREDATORS[kind].strike - now.into + 0.01;
      ev.push({ type: 'deterred', den: i, kind });
      continue;
    }
    s.status = 'lost';
    s.lostReason = 'caught';
    s.caughtBy = kind;
    ev.push({ type: 'caught', kind }, { type: 'lost', reason: 'caught' });
    return ev;
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
