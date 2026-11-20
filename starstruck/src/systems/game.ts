import {
  CHARACTERS,
  type Character,
  type CharacterId,
  type SpecialEffect,
} from '../content/characters';
import { OBJECTS, isDangerous, type Material } from '../content/objects';
import type { LevelConfig, Objective, PromptTrigger } from '../levels/types';
import { createRng, type Rng } from '../utils/rng';
import { pointSegment, type Vec } from './geometry';
import { probe, RAYS, SensoryMemory, nosePoint, type Contact, type Touchable } from './senses';
import type { WormageddonState } from './wormageddon';

// One level as plain data plus stepGame(). Scenes draw it; tests drive it.

export const TILE = 32;
export const TUNING = {
  moveSpeed: 120,
  focusSlow: 0.45,
  bodyRadius: 10,
  /** Taps per second for ordinary rays, and for ray 11 while focusing. */
  tapRate: 9,
  focusTapRate: 24,
  energyDrain: 1.1,
  digCost: 1.6,
  digTime: 0.45,
  wrongBite: 5,
  whiff: 0.5,
  biteReach: 20,
  biteCooldown: 0.12,
  startEnergy: 80,
  // water and BUBBLE SNIFF
  startOxygen: 100,
  oxygenDrain: 9,
  oxygenRefill: 30,
  gaspDrain: 10,
  bubbleRange: 150,
  bubbleSpeed: 260,
  bubbleCooldown: 1.4,
  bubbleScent: 1.3,
  // predators
  predatorDamage: 18,
  predatorDetectRange: 90,
  predatorInvuln: 1.2,
  predatorKnockback: 70,
  // specials
  frenzyRadius: 95,
};

export type Soil = 'tunnel' | 'soft' | 'rock' | 'water';

function walkableSoil(soil: Soil): boolean {
  return soil === 'tunnel' || soil === 'water';
}

export interface Thing extends Touchable {
  material: Material;
  alive: boolean;
  heading: number;
  speed: number;
  /** Seconds of hurrying away after being startled. */
  fleeing: number;
  turnTimer: number;
  /** Predators only: a patrol loop, and whether it has noticed the mole yet. */
  route?: Vec[];
  routeIndex?: number;
  hunting?: boolean;
}

export interface Bubble {
  state: 'out' | 'back';
  x: number;
  y: number;
  targetId: number;
}

export interface Input {
  dx: number;
  dy: number;
  focus: boolean;
  bite: boolean;
  sniff: boolean;
  special: boolean;
}

export const NO_INPUT: Input = {
  dx: 0,
  dy: 0,
  focus: false,
  bite: false,
  sniff: false,
  special: false,
};

export interface GameState {
  level: LevelConfig;
  character: Character;
  rng: Rng;
  cols: number;
  rows: number;
  soil: Soil[];
  /** Original soil for 'F' flood tiles (always 'tunnel'), in bottom-to-top tile order. */
  floodTiles: number[];
  floodedCount: number;
  dig: Map<number, number>;
  exit: Vec | null;
  mole: { x: number; y: number; heading: number; moving: boolean; digging: boolean };
  things: Thing[];
  memory: SensoryMemory;
  /** Per ray: seconds until its next tap. */
  tapTimers: number[];
  /** Contacts from the most recent tap of each ray (for drawing the star). */
  lastContacts: (Contact | null)[];
  energy: number;
  oxygen: number;
  inWater: boolean;
  bubble: Bubble | null;
  bubbleCooldown: number;
  special: { charge: number; timer: number };
  combo: number;
  comboTimer: number;
  bestCombo: number;
  score: number;
  eaten: Partial<Record<Material, number>>;
  wrongBites: number;
  biteCooldown: number;
  predatorInvuln: number;
  diggedTiles: number;
  bubbleHits: number;
  time: number;
  status: 'playing' | 'won' | 'lost';
  lostReason: 'energy' | 'time' | 'predator' | null;
  seen: Set<PromptTrigger>;
  touchedRays: Set<number>;
  /** Only set for a WORMAGEDDON run; everything it changes is read through optional chaining,
   *  so the six-level campaign is byte-for-byte unaffected when it's absent. */
  wormageddon?: WormageddonState;
}

export type GameEvent =
  | { type: 'touch'; material: string; first: boolean }
  | { type: 'identified'; id: number; material: Material }
  | { type: 'eat'; material: Material; combo: number; label: string | null; x: number; y: number }
  | { type: 'wrongBite'; material: string }
  | { type: 'whiff' }
  | { type: 'dig' }
  | { type: 'splash'; in: boolean }
  | { type: 'bubbleOut' }
  | { type: 'bubbleBack'; found: boolean }
  | { type: 'gasp' }
  | { type: 'predatorHit' }
  | { type: 'special'; effect: SpecialEffect }
  | { type: 'upgradeOffer' }
  | { type: 'prompt'; text: string }
  | { type: 'won' }
  | { type: 'lost'; reason: 'energy' | 'time' | 'predator' };

const COMBO_LABELS: [number, string][] = [
  [8, 'WORMAGEDDON!'],
  [6, 'MOLE MANIA!'],
  [5, 'STAR POWER!'],
  [4, 'WORM STORM!'],
  [3, 'DOUBLE DIG!'],
  [2, 'NICE!'],
];

export function comboLabel(n: number): string | null {
  return COMBO_LABELS.find(([at]) => n === at)?.[1] ?? null;
}

export function multiplier(combo: number): number {
  return 1 + Math.max(0, combo - 1) * 0.5;
}

/** The combo window, lengthened by COMBO KING in WORMAGEDDON. */
export function effectiveComboWindow(s: GameState): number {
  return s.character.comboWindow + (s.wormageddon?.mods.comboWindowBonus ?? 0);
}

/** Max energy, raised by BIG APPETITE in WORMAGEDDON. */
export function effectiveMaxEnergy(s: GameState): number {
  return s.character.maxEnergy + (s.wormageddon?.mods.maxEnergyBonus ?? 0);
}

export function createGame(
  level: LevelConfig,
  characterId: CharacterId = 'diggy',
  seed = 1,
): GameState {
  const rows = level.map.length;
  const cols = Math.max(...level.map.map((r) => r.length));
  const soil: Soil[] = [];
  const things: Thing[] = [];
  const rng = createRng(seed);
  let start = { x: TILE * 1.5, y: TILE * 1.5 };
  let exit: Vec | null = null;
  const floodTiles: { i: number; ty: number }[] = [];
  let nextId = 1;
  const predatorSpawns: { tx: number; ty: number }[] = [];
  const centre = (tx: number, ty: number) => ({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 });
  level.map.forEach((row, ty) => {
    for (let tx = 0; tx < cols; tx++) {
      const ch = row[tx] ?? '#';
      const soilType: Soil =
        ch === '#' ? 'soft' : ch === 'O' ? 'rock' : ch === '~' ? 'water' : 'tunnel';
      const i = soil.push(soilType) - 1;
      if (ch === 'F') floodTiles.push({ i, ty });
      const c = centre(tx, ty);
      if (ch === 'P') start = c;
      else if (ch === 'E') exit = c;
      else if (ch === 'S') predatorSpawns.push({ tx, ty });
      else if (ch === 'w' || ch === 'l')
        things.push(chainThing(nextId++, ch === 'w' ? 'worm' : 'larva', c, rng));
      else if (ch === 'a' || ch === 'q')
        things.push(chainThing(nextId++, ch === 'a' ? 'aquaWorm' : 'aquaLarva', c, rng));
      else if (ch === 'b' || ch === 'o')
        things.push({
          id: nextId++,
          material: ch === 'b' ? 'beetle' : 'rock',
          shape: {
            kind: 'circle',
            c: { x: c.x + (rng.next() - 0.5) * 8, y: c.y + (rng.next() - 0.5) * 8 },
            r: ch === 'b' ? 6 : 7 + rng.next() * 3,
          },
          alive: true,
          heading: rng.next() * Math.PI * 2,
          speed: OBJECTS[ch === 'b' ? 'beetle' : 'rock'].speed,
          fleeing: 0,
          turnTimer: 1,
        });
    }
  });
  // flood tiles always start as plain tunnel; flood bottom row first
  floodTiles.sort((a, b) => b.ty - a.ty);
  const s: GameState = {
    level,
    character: CHARACTERS[characterId],
    rng,
    cols,
    rows,
    soil,
    floodTiles: floodTiles.map((f) => f.i),
    floodedCount: 0,
    dig: new Map(),
    exit,
    mole: { x: start.x, y: start.y, heading: 0, moving: false, digging: false },
    things,
    memory: new SensoryMemory(CHARACTERS[characterId].memory),
    tapTimers: RAYS.map((_, i) => (i % 5) / TUNING.tapRate / 5),
    lastContacts: RAYS.map(() => null),
    energy: TUNING.startEnergy,
    oxygen: TUNING.startOxygen,
    inWater: false,
    bubble: null,
    bubbleCooldown: 0,
    special: { charge: 0, timer: 0 },
    combo: 0,
    comboTimer: 0,
    bestCombo: 0,
    score: 0,
    eaten: {},
    wrongBites: 0,
    biteCooldown: 0,
    predatorInvuln: 0,
    diggedTiles: 0,
    bubbleHits: 0,
    time: 0,
    status: 'playing',
    lostReason: null,
    seen: new Set(),
    touchedRays: new Set(),
  };
  // roots grow out of a wall next to their tile
  level.map.forEach((row, ty) => {
    for (let tx = 0; tx < row.length; tx++)
      if (row[tx] === 'T') s.things.push(rootThing(s, nextId++, tx, ty));
  });
  // predators follow the configured routes, matched in map order to S spawns
  (level.predators ?? []).forEach((p, i) => {
    const spawn = predatorSpawns[i];
    if (!spawn) return;
    const route = p.route.map(([tx, ty]) => centre(tx, ty));
    const c = route[0] ?? centre(spawn.tx, spawn.ty);
    s.things.push({
      id: nextId++,
      material: 'predator',
      shape: { kind: 'circle', c: { x: c.x, y: c.y }, r: 9 },
      alive: true,
      heading: 0,
      speed: OBJECTS.predator.speed,
      fleeing: 0,
      turnTimer: 0,
      route,
      routeIndex: 0,
      hunting: false,
    });
  });
  return s;
}

export function chainThing(
  id: number,
  material: 'worm' | 'larva' | 'aquaWorm' | 'aquaLarva',
  c: Vec,
  rng: Rng,
): Thing {
  const heading = rng.next() * Math.PI * 2;
  const n = material === 'worm' || material === 'aquaWorm' ? 7 : 4;
  const gap = material === 'worm' || material === 'aquaWorm' ? 4 : 3;
  const points = Array.from({ length: n }, (_, i) => ({
    x: c.x - Math.cos(heading) * i * gap,
    y: c.y - Math.sin(heading) * i * gap,
  }));
  return {
    id,
    material,
    shape: { kind: 'chain', points, r: material === 'worm' || material === 'aquaWorm' ? 3 : 4 },
    alive: true,
    heading,
    speed: OBJECTS[material].speed,
    fleeing: 0,
    turnTimer: 1 + rng.next() * 2,
  };
}

function rootThing(s: GameState, id: number, tx: number, ty: number): Thing {
  const c = { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
  const dirs = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ] as const;
  const wall = dirs.find(([dx, dy]) => soilAt(s, tx + dx, ty + dy) !== 'tunnel') ?? [0, -1];
  // from the wall edge, growing into the tunnel with a little wobble
  const start = { x: c.x + wall[0] * (TILE / 2), y: c.y + wall[1] * (TILE / 2) };
  const points: Vec[] = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    const wob = Math.sin(i * 1.7 + id) * 3;
    points.push({
      x: start.x - wall[0] * t * TILE * 0.9 + (wall[0] === 0 ? wob : 0),
      y: start.y - wall[1] * t * TILE * 0.9 + (wall[1] === 0 ? wob : 0),
    });
  }
  return {
    id,
    material: 'root',
    shape: { kind: 'chain', points, r: 2.5 },
    alive: true,
    heading: 0,
    speed: 0,
    fleeing: 0,
    turnTimer: 99,
  };
}

export function soilAt(s: GameState, tx: number, ty: number): Soil {
  if (tx < 0 || ty < 0 || tx >= s.cols || ty >= s.rows) return 'rock';
  return s.soil[ty * s.cols + tx] ?? 'rock';
}

function soilAtPx(s: GameState, x: number, y: number): Soil {
  return soilAt(s, Math.floor(x / TILE), Math.floor(y / TILE));
}

export function stepGame(s: GameState, input: Input, dt: number): GameEvent[] {
  if (s.status !== 'playing') return [];
  const ev: GameEvent[] = [];
  s.time += dt;
  s.biteCooldown = Math.max(0, s.biteCooldown - dt);
  s.bubbleCooldown = Math.max(0, s.bubbleCooldown - dt);
  s.predatorInvuln = Math.max(0, s.predatorInvuln - dt);
  if (s.special.timer > 0) s.special.timer = Math.max(0, s.special.timer - dt);
  if (!s.seen.has('start')) prompt(s, 'start', ev);

  stepFlood(s);
  moveMole(s, input, dt, ev);
  stepWater(s, dt, ev);
  moveThings(s, dt);
  sense(s, input.focus, dt, ev);
  stepBubble(s, dt, ev);
  checkPredators(s, ev);
  if (input.bite) bite(s, ev);
  if (input.sniff) sniff(s, ev);
  if (input.special) activateSpecial(s, ev);

  // combo window
  if (s.combo > 0) {
    s.comboTimer -= dt;
    if (s.comboTimer <= 0) s.combo = 0;
  }
  s.memory.prune(s.time);

  if (s.status !== 'playing') return ev;
  s.energy -= TUNING.energyDrain * dt;
  if (s.energy <= 0) {
    s.energy = 0;
    return lose(s, 'energy', ev);
  }
  if (checkObjective(s)) {
    s.status = 'won';
    s.score += Math.round(s.energy * 10 + Math.max(0, s.level.timeLimit - s.time) * 10);
    ev.push({ type: 'won' });
  } else if (s.time >= s.level.timeLimit) return lose(s, 'time', ev);
  return ev;
}

function checkObjective(s: GameState): boolean {
  const o: Objective = s.level.objective;
  if (o.kind === 'eat') return o.materials.reduce((n, m) => n + (s.eaten[m] ?? 0), 0) >= o.count;
  if (o.kind === 'combo') return s.bestCombo >= o.target;
  if (o.kind === 'endless') return false;
  if (!s.exit) return false;
  return Math.hypot(s.mole.x - s.exit.x, s.mole.y - s.exit.y) < TILE * 0.7;
}

function lose(s: GameState, reason: 'energy' | 'time' | 'predator', ev: GameEvent[]): GameEvent[] {
  s.status = 'lost';
  s.lostReason = reason;
  ev.push({ type: 'lost', reason });
  return ev;
}

function prompt(s: GameState, at: PromptTrigger, ev: GameEvent[]): void {
  if (s.seen.has(at)) return;
  s.seen.add(at);
  const p = s.level.prompts.find((x) => x.at === at);
  if (p) ev.push({ type: 'prompt', text: p.text });
}

function moveMole(s: GameState, input: Input, dt: number, ev: GameEvent[]): void {
  const m = s.mole;
  const len = Math.hypot(input.dx, input.dy);
  m.moving = len > 0.1;
  m.digging = false;
  if (!m.moving) return;
  const dx = input.dx / Math.max(1, len);
  const dy = input.dy / Math.max(1, len);
  // turn the star toward where you're going, smoothly
  const target = Math.atan2(dy, dx);
  let diff = target - m.heading;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  m.heading += diff * Math.min(1, dt * 12);
  if (input.focus && !s.seen.has('focus') && s.time > 2) prompt(s, 'focus', ev);
  const rush = s.special.timer > 0 && s.character.specialEffect === 'starRush' ? 1.5 : 1;
  // WORMAGEDDON swims slower than it walks, by default; MUD SKIPPER earns that speed back
  const waterMult = s.wormageddon && s.inWater ? 0.8 * s.wormageddon.mods.waterSpeedMult : 1;
  const speed =
    TUNING.moveSpeed * s.character.speed * rush * waterMult * (input.focus ? TUNING.focusSlow : 1);
  const r = TUNING.bodyRadius;
  for (const [ax, ay] of [
    [dx, 0],
    [0, dy],
  ] as const) {
    if (ax === 0 && ay === 0) continue;
    const nx = m.x + ax * speed * dt;
    const ny = m.y + ay * speed * dt;
    const blocked = blockingTile(s, nx, ny, r);
    if (!blocked) {
      if (!solidThing(s, nx, ny, r)) {
        m.x = nx;
        m.y = ny;
      }
      continue;
    }
    if (s.soil[blocked.i] === 'soft') {
      // push into soft soil to dig it out
      m.digging = true;
      const digMult = s.wormageddon?.mods.digSpeedMult ?? 1;
      const p =
        (s.dig.get(blocked.i) ?? 0) + (dt * s.character.digSpeed * digMult) / TUNING.digTime;
      s.dig.set(blocked.i, p);
      if (p >= 1) {
        s.soil[blocked.i] = 'tunnel';
        s.dig.delete(blocked.i);
        s.energy -= TUNING.digCost;
        s.diggedTiles++;
        ev.push({ type: 'dig' });
        prompt(s, 'firstDig', ev);
      }
    }
  }
}

/** The first non-walkable tile the body would overlap at (x, y), if any. */
function blockingTile(s: GameState, x: number, y: number, r: number): { i: number } | null {
  for (const [ox, oy] of [
    [-r, -r],
    [r, -r],
    [-r, r],
    [r, r],
    [0, -r],
    [0, r],
    [-r, 0],
    [r, 0],
  ] as const) {
    const tx = Math.floor((x + ox) / TILE);
    const ty = Math.floor((y + oy) / TILE);
    if (!walkableSoil(soilAt(s, tx, ty))) return { i: ty * s.cols + tx };
  }
  return null;
}

/** Pebbles and roots are solid: you feel them and go around. Predators are not (you can touch them). */
function solidThing(s: GameState, x: number, y: number, r: number): boolean {
  for (const t of s.things) {
    if (!t.alive || OBJECTS[t.material].edible || isDangerous(t.material)) continue;
    if (t.shape.kind === 'circle') {
      if (Math.hypot(t.shape.c.x - x, t.shape.c.y - y) < t.shape.r + r - 2) return true;
    } else {
      const pts = t.shape.points;
      for (let i = 0; i + 1 < pts.length; i++)
        if (pointSegment({ x, y }, pts[i] as Vec, pts[i + 1] as Vec) < t.shape.r + r - 3)
          return true;
    }
  }
  return false;
}

/** Rising water (Level 5): floods tiles bottom row first, over `floodSeconds`. Never un-floods. */
function stepFlood(s: GameState): void {
  const total = s.level.floodSeconds;
  if (!total || s.floodTiles.length === 0) return;
  const want = Math.min(s.floodTiles.length, Math.floor((s.time / total) * s.floodTiles.length));
  for (let i = s.floodedCount; i < want; i++) {
    const idx = s.floodTiles[i];
    if (idx !== undefined) s.soil[idx] = 'water';
  }
  s.floodedCount = Math.max(s.floodedCount, want);
}

function stepWater(s: GameState, dt: number, ev: GameEvent[]): void {
  const now = soilAtPx(s, s.mole.x, s.mole.y) === 'water';
  if (now !== s.inWater) ev.push({ type: 'splash', in: now });
  s.inWater = now;
  if (now) {
    s.oxygen -= TUNING.oxygenDrain * dt;
    if (s.oxygen <= 0) {
      s.oxygen = 0;
      s.energy -= TUNING.gaspDrain * dt;
      ev.push({ type: 'gasp' });
    }
    if (!s.seen.has('firstSwim')) prompt(s, 'firstSwim', ev);
  } else {
    s.oxygen = Math.min(TUNING.startOxygen, s.oxygen + TUNING.oxygenRefill * dt);
  }
}

function moveThings(s: GameState, dt: number): void {
  for (const t of s.things) {
    if (!t.alive) continue;
    if (t.material === 'predator') {
      movePredator(s, t, dt);
      continue;
    }
    if (t.speed <= 0) continue;
    t.fleeing = Math.max(0, t.fleeing - dt);
    t.turnTimer -= dt;
    if (t.turnTimer <= 0) {
      t.heading += (s.rng.next() - 0.5) * 2.2;
      t.turnTimer = 0.8 + s.rng.next() * 2;
    }
    const speed = t.speed * (t.fleeing > 0 ? 3 : 1);
    const head = t.shape.kind === 'circle' ? t.shape.c : (t.shape.points[0] as Vec);
    const nx = head.x + Math.cos(t.heading) * speed * dt;
    const ny = head.y + Math.sin(t.heading) * speed * dt;
    const aquatic = OBJECTS[t.material].aquatic === true;
    const soilHere = soilAtPx(s, nx + Math.cos(t.heading) * 6, ny + Math.sin(t.heading) * 6);
    const ok = aquatic ? soilHere === 'water' : soilHere === 'tunnel';
    if (!ok) {
      t.heading += Math.PI * (0.5 + s.rng.next());
      continue;
    }
    if (t.shape.kind === 'circle') {
      t.shape.c = { x: nx, y: ny };
    } else {
      // the body follows the head like a chain
      const pts = t.shape.points;
      pts[0] = { x: nx, y: ny };
      const gap = t.material === 'worm' || t.material === 'aquaWorm' ? 4 : 3;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1] as Vec;
        const b = pts[i] as Vec;
        const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        pts[i] = { x: a.x + ((b.x - a.x) / d) * gap, y: a.y + ((b.y - a.y) / d) * gap };
      }
    }
  }
}

/** Predators patrol a loop until the mole gets close, then give chase for good. */
function movePredator(s: GameState, t: Thing, dt: number): void {
  if (t.shape.kind !== 'circle') return;
  const d = Math.hypot(t.shape.c.x - s.mole.x, t.shape.c.y - s.mole.y);
  if (!t.hunting && d < TUNING.predatorDetectRange) t.hunting = true;
  let tx: number;
  let ty: number;
  if (t.hunting) {
    tx = s.mole.x;
    ty = s.mole.y;
  } else {
    const route = t.route ?? [];
    const wp = route[t.routeIndex ?? 0];
    if (!wp) return;
    tx = wp.x;
    ty = wp.y;
    if (Math.hypot(wp.x - t.shape.c.x, wp.y - t.shape.c.y) < 6)
      t.routeIndex = ((t.routeIndex ?? 0) + 1) % route.length;
  }
  const dx = tx - t.shape.c.x;
  const dy = ty - t.shape.c.y;
  const dd = Math.hypot(dx, dy) || 1;
  const speed = t.speed * (t.hunting ? 1 : 0.55);
  t.shape.c = { x: t.shape.c.x + (dx / dd) * speed * dt, y: t.shape.c.y + (dy / dd) * speed * dt };
  t.heading = Math.atan2(dy, dx);
}

function checkPredators(s: GameState, ev: GameEvent[]): void {
  if (s.predatorInvuln > 0) return;
  for (const t of s.things) {
    if (!t.alive || t.material !== 'predator' || t.shape.kind !== 'circle') continue;
    const d = Math.hypot(t.shape.c.x - s.mole.x, t.shape.c.y - s.mole.y);
    if (d < t.shape.r + TUNING.bodyRadius) {
      s.predatorInvuln = TUNING.predatorInvuln;
      s.energy -= TUNING.predatorDamage;
      s.combo = 0;
      const push = Math.max(1, d);
      s.mole.x += ((s.mole.x - t.shape.c.x) / push) * TUNING.predatorKnockback;
      s.mole.y += ((s.mole.y - t.shape.c.y) / push) * TUNING.predatorKnockback;
      ev.push({ type: 'predatorHit' });
      prompt(s, 'firstPredator', ev);
      return;
    }
  }
}

/** Each ray taps on its own rhythm; every touch is remembered for a while. */
function sense(s: GameState, focus: boolean, dt: number, ev: GameEvent[]): void {
  const live = s.things.filter((t) => t.alive);
  const wall = (x: number, y: number) => {
    const soil = soilAtPx(s, x, y);
    return soil === 'tunnel' || soil === 'water' ? null : soil === 'rock' ? 'stone' : 'soil';
  };
  const elementary = s.special.timer > 0 && s.character.specialEffect === 'elementary';
  const senseMult = s.wormageddon?.mods.senseMult ?? 1;
  RAYS.forEach((ray, i) => {
    const rate = ray.number === 11 && focus ? TUNING.focusTapRate : TUNING.tapRate;
    const t = (s.tapTimers[i] ?? 0) - dt;
    if (t > 0) {
      s.tapTimers[i] = t;
      return;
    }
    s.tapTimers[i] = 1 / rate;
    const c = probe(ray, s.mole, live, focus, wall);
    s.lastContacts[i] = c;
    if (!c) return;
    s.touchedRays.add(ray.number * ray.side);
    const before = c.id >= 0 ? s.memory.confidence(c.id, s.time) : 0;
    s.memory.add(c, s.time, s.character.acuity * (elementary ? 2 : 1) * senseMult);
    if (c.id < 0) return;
    const thing = s.things.find((x) => x.id === c.id);
    if (!thing) return;
    const first = before === 0;
    if (first) {
      ev.push({ type: 'touch', material: c.material, first });
      prompt(s, 'firstTouch', ev);
      if (s.rng.next() < OBJECTS[thing.material].startle) thing.fleeing = 1.5;
    }
    const need = OBJECTS[thing.material].evidence;
    if (before < need && s.memory.confidence(c.id, s.time) >= need) {
      ev.push({ type: 'identified', id: c.id, material: thing.material });
      if (OBJECTS[thing.material].edible) prompt(s, 'firstId', ev);
      else if (thing.material === 'rock') prompt(s, 'firstRock', ev);
    }
  });
}

/** What is right under the nose (within biting reach), if anything. */
export function underNose(s: GameState): Thing | null {
  const n = nosePoint(s.mole, 14);
  let best: Thing | null = null;
  let bestD = TUNING.biteReach;
  for (const t of s.things) {
    if (!t.alive) continue;
    let d: number;
    if (t.shape.kind === 'circle') d = Math.hypot(t.shape.c.x - n.x, t.shape.c.y - n.y) - t.shape.r;
    else {
      d = Infinity;
      const pts = t.shape.points;
      for (let i = 0; i + 1 < pts.length; i++)
        d = Math.min(d, pointSegment(n, pts[i] as Vec, pts[i + 1] as Vec) - t.shape.r);
    }
    if (d < bestD) {
      bestD = d;
      best = t;
    }
  }
  return best;
}

export function isIdentified(s: GameState, t: Thing): boolean {
  return s.memory.confidence(t.id, s.time) >= OBJECTS[t.material].evidence;
}

/** BUBBLE SNIFF: released underwater, travels to the nearest unsampled aquatic prey, and back. */
function sniff(s: GameState, ev: GameEvent[]): void {
  const bonanza = s.special.timer > 0 && s.character.specialEffect === 'bubbleBonanza';
  if (!s.inWater || s.bubble || (s.bubbleCooldown > 0 && !bonanza)) return;
  const cooldownMult = s.wormageddon?.mods.bubbleCooldownMult ?? 1;
  s.bubbleCooldown = bonanza ? 0 : TUNING.bubbleCooldown * cooldownMult;
  const rangeMult = s.wormageddon?.mods.bubbleRangeMult ?? 1;
  const range = TUNING.bubbleRange * (bonanza ? 1.6 : 1) * rangeMult;
  let best: Thing | null = null;
  let bestD = range;
  for (const t of s.things) {
    if (!t.alive || !OBJECTS[t.material].aquatic || isIdentified(s, t)) continue;
    const at = t.shape.kind === 'circle' ? t.shape.c : (t.shape.points[0] as Vec);
    const d = Math.hypot(at.x - s.mole.x, at.y - s.mole.y);
    if (d < bestD) {
      bestD = d;
      best = t;
    }
  }
  const n = nosePoint(s.mole, 10);
  s.bubble = { state: 'out', x: n.x, y: n.y, targetId: best?.id ?? -1 };
  ev.push({ type: 'bubbleOut' });
}

function stepBubble(s: GameState, dt: number, ev: GameEvent[]): void {
  const b = s.bubble;
  if (!b) return;
  if (b.state === 'out') {
    const target = s.things.find((t) => t.id === b.targetId && t.alive);
    const at = target
      ? target.shape.kind === 'circle'
        ? target.shape.c
        : (target.shape.points[0] as Vec)
      : null;
    const tx = at?.x ?? s.mole.x;
    const ty = at?.y ?? s.mole.y;
    const d = Math.hypot(tx - b.x, ty - b.y);
    if (d < 8 || !target) {
      if (target) {
        s.memory.addScent(target.id, target.material, tx, ty, TUNING.bubbleScent, s.time);
        s.bubbleHits++;
      }
      b.state = 'back';
    } else {
      b.x += ((tx - b.x) / d) * TUNING.bubbleSpeed * dt;
      b.y += ((ty - b.y) / d) * TUNING.bubbleSpeed * dt;
    }
  } else {
    const d = Math.hypot(s.mole.x - b.x, s.mole.y - b.y);
    if (d < 10) {
      ev.push({ type: 'bubbleBack', found: b.targetId >= 0 });
      prompt(s, 'firstBubble', ev);
      s.bubble = null;
    } else {
      b.x += ((s.mole.x - b.x) / d) * TUNING.bubbleSpeed * dt;
      b.y += ((s.mole.y - b.y) / d) * TUNING.bubbleSpeed * dt;
    }
  }
}

function activateSpecial(s: GameState, ev: GameEvent[]): void {
  if (s.special.charge < 100 || s.special.timer > 0) return;
  s.special.charge = 0;
  const effect = s.character.specialEffect;
  prompt(s, 'special', ev);
  if (effect === 'feedingFrenzy') {
    const n = nosePoint(s.mole, 14);
    for (const t of s.things) {
      if (!t.alive || !t.alive || !OBJECTS[t.material].edible || !isIdentified(s, t)) continue;
      const at = t.shape.kind === 'circle' ? t.shape.c : (t.shape.points[0] as Vec);
      if (Math.hypot(at.x - n.x, at.y - n.y) <= TUNING.frenzyRadius) eatThing(s, t, ev);
    }
  } else {
    s.special.timer = s.character.specialSeconds;
  }
  ev.push({ type: 'special', effect });
}

function bite(s: GameState, ev: GameEvent[]): void {
  if (s.biteCooldown > 0) return;
  s.biteCooldown = TUNING.biteCooldown * (s.wormageddon?.mods.biteCooldownMult ?? 1);
  const t = underNose(s);
  if (!t) {
    s.energy -= TUNING.whiff;
    ev.push({ type: 'whiff' });
    return;
  }
  const def = OBJECTS[t.material];
  if (!def.edible) {
    s.energy -= TUNING.wrongBite;
    s.wrongBites++;
    s.combo = 0;
    ev.push({ type: 'wrongBite', material: t.material });
    return;
  }
  eatThing(s, t, ev);
}

function eatThing(s: GameState, t: Thing, ev: GameEvent[]): void {
  const def = OBJECTS[t.material];
  t.alive = false;
  s.memory.forget(t.id);
  const rush = s.special.timer > 0 && s.character.specialEffect === 'starRush';
  s.combo = s.comboTimer > 0 || s.combo === 0 ? s.combo + 1 : 1;
  s.comboTimer = effectiveComboWindow(s) * (rush ? 1.6 : 1);
  s.bestCombo = Math.max(s.bestCombo, s.combo);
  s.energy = Math.min(effectiveMaxEnergy(s), s.energy + def.energy);
  s.eaten[t.material] = (s.eaten[t.material] ?? 0) + 1;
  s.special.charge = Math.min(100, s.special.charge + s.character.chargePerBite);
  const offer = s.special.timer > 0 && s.character.specialEffect === 'theOffer';
  const comboScoreBonus = s.wormageddon?.mods.comboScoreBonus ?? 0;
  s.score += Math.round(
    def.points * multiplier(s.combo) * (offer ? 1.5 : 1) * (1 + comboScoreBonus),
  );
  const head = t.shape.kind === 'circle' ? t.shape.c : (t.shape.points[0] as Vec);
  if (s.combo >= 3) prompt(s, 'firstCombo', ev);
  ev.push({
    type: 'eat',
    material: t.material,
    combo: s.combo,
    label: comboLabel(s.combo),
    x: head.x,
    y: head.y,
  });
  prompt(s, 'firstEat', ev);
}

/** A short HUD line describing progress toward the level's objective. */
export function describeObjective(s: GameState): string {
  const o = s.level.objective;
  if (o.kind === 'eat') {
    const got = o.materials.reduce((n, m) => n + (s.eaten[m] ?? 0), 0);
    const names = o.materials.map((m) => OBJECTS[m].name).join('/');
    return `${names.toUpperCase()}S ${got}/${o.count}`;
  }
  if (o.kind === 'combo') return `BEST COMBO ${s.bestCombo}/${o.target}`;
  if (o.kind === 'endless') return `SURVIVED ${Math.floor(s.time)}S`;
  if (!s.exit) return 'REACH THE EXIT';
  const d = Math.hypot(s.mole.x - s.exit.x, s.mole.y - s.exit.y);
  return `REACH THE EXIT ${d < TILE * 3 ? '(close!)' : ''}`.trim();
}

/** Whether a level uses water at all, so the HUD only shows oxygen when it matters. */
export function hasWater(level: LevelConfig): boolean {
  return level.map.some((row) => /[~Faq]/.test(row));
}

export function stars(s: GameState): number {
  if (s.status !== 'won') return 0;
  const [, two, three] = s.level.stars;
  return s.score >= three ? 3 : s.score >= two ? 2 : 1;
}
