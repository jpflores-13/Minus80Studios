import { CHARACTERS, type Character, type CharacterId } from '../content/characters';
import { OBJECTS, type Material } from '../content/objects';
import type { LevelConfig, PromptTrigger } from '../levels/types';
import { createRng, type Rng } from '../utils/rng';
import { pointSegment, type Vec } from './geometry';
import { probe, RAYS, SensoryMemory, nosePoint, type Contact, type Touchable } from './senses';

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
};

export type Soil = 'tunnel' | 'soft' | 'rock';

export interface Thing extends Touchable {
  material: Material;
  alive: boolean;
  heading: number;
  speed: number;
  /** Seconds of hurrying away after being startled. */
  fleeing: number;
  turnTimer: number;
}

export interface Input {
  dx: number;
  dy: number;
  focus: boolean;
  bite: boolean;
}

export const NO_INPUT: Input = { dx: 0, dy: 0, focus: false, bite: false };

export interface GameState {
  level: LevelConfig;
  character: Character;
  rng: Rng;
  cols: number;
  rows: number;
  soil: Soil[];
  dig: Map<number, number>;
  mole: { x: number; y: number; heading: number; moving: boolean; digging: boolean };
  things: Thing[];
  memory: SensoryMemory;
  /** Per ray: seconds until its next tap. */
  tapTimers: number[];
  /** Contacts from the most recent tap of each ray (for drawing the star). */
  lastContacts: (Contact | null)[];
  energy: number;
  combo: number;
  comboTimer: number;
  bestCombo: number;
  score: number;
  eaten: Partial<Record<Material, number>>;
  wrongBites: number;
  biteCooldown: number;
  time: number;
  status: 'playing' | 'won' | 'lost';
  lostReason: 'energy' | 'time' | null;
  seen: Set<PromptTrigger>;
}

export type GameEvent =
  | { type: 'touch'; material: string; first: boolean }
  | { type: 'identified'; id: number; material: Material }
  | { type: 'eat'; material: Material; combo: number; label: string | null; x: number; y: number }
  | { type: 'wrongBite'; material: string }
  | { type: 'whiff' }
  | { type: 'dig' }
  | { type: 'prompt'; text: string }
  | { type: 'won' }
  | { type: 'lost'; reason: 'energy' | 'time' };

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
  let nextId = 1;
  const centre = (tx: number, ty: number) => ({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 });
  level.map.forEach((row, ty) => {
    for (let tx = 0; tx < cols; tx++) {
      const ch = row[tx] ?? '#';
      soil.push(ch === '#' ? 'soft' : ch === 'O' ? 'rock' : 'tunnel');
      const c = centre(tx, ty);
      if (ch === 'P') start = c;
      else if (ch === 'w' || ch === 'l')
        things.push(chainThing(nextId++, ch === 'w' ? 'worm' : 'larva', c, rng));
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
  const s: GameState = {
    level,
    character: CHARACTERS[characterId],
    rng,
    cols,
    rows,
    soil,
    dig: new Map(),
    mole: { x: start.x, y: start.y, heading: 0, moving: false, digging: false },
    things,
    memory: new SensoryMemory(CHARACTERS[characterId].memory),
    tapTimers: RAYS.map((_, i) => (i % 5) / TUNING.tapRate / 5),
    lastContacts: RAYS.map(() => null),
    energy: TUNING.startEnergy,
    combo: 0,
    comboTimer: 0,
    bestCombo: 0,
    score: 0,
    eaten: {},
    wrongBites: 0,
    biteCooldown: 0,
    time: 0,
    status: 'playing',
    lostReason: null,
    seen: new Set(),
  };
  // roots grow out of a wall next to their tile
  level.map.forEach((row, ty) => {
    for (let tx = 0; tx < row.length; tx++)
      if (row[tx] === 'T') s.things.push(rootThing(s, nextId++, tx, ty));
  });
  return s;
}

function chainThing(id: number, material: 'worm' | 'larva', c: Vec, rng: Rng): Thing {
  const heading = rng.next() * Math.PI * 2;
  const n = material === 'worm' ? 7 : 4;
  const gap = material === 'worm' ? 4 : 3;
  const points = Array.from({ length: n }, (_, i) => ({
    x: c.x - Math.cos(heading) * i * gap,
    y: c.y - Math.sin(heading) * i * gap,
  }));
  return {
    id,
    material,
    shape: { kind: 'chain', points, r: material === 'worm' ? 3 : 4 },
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
  if (!s.seen.has('start')) prompt(s, 'start', ev);

  moveMole(s, input, dt, ev);
  moveThings(s, dt);
  sense(s, input.focus, dt, ev);
  if (input.bite) bite(s, ev);

  // combo window
  if (s.combo > 0) {
    s.comboTimer -= dt;
    if (s.comboTimer <= 0) s.combo = 0;
  }
  s.memory.prune(s.time);

  s.energy -= TUNING.energyDrain * dt;
  if (s.energy <= 0) {
    s.energy = 0;
    return lose(s, 'energy', ev);
  }
  const goal = s.level.objective;
  if ((s.eaten[goal.material] ?? 0) >= goal.count) {
    s.status = 'won';
    s.score += Math.round(s.energy * 10 + Math.max(0, s.level.timeLimit - s.time) * 10);
    ev.push({ type: 'won' });
  } else if (s.time >= s.level.timeLimit) return lose(s, 'time', ev);
  return ev;
}

function lose(s: GameState, reason: 'energy' | 'time', ev: GameEvent[]): GameEvent[] {
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
  const speed = TUNING.moveSpeed * s.character.speed * (input.focus ? TUNING.focusSlow : 1);
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
      const p = (s.dig.get(blocked.i) ?? 0) + (dt * s.character.digSpeed) / TUNING.digTime;
      s.dig.set(blocked.i, p);
      if (p >= 1) {
        s.soil[blocked.i] = 'tunnel';
        s.dig.delete(blocked.i);
        s.energy -= TUNING.digCost;
        ev.push({ type: 'dig' });
        prompt(s, 'firstDig', ev);
      }
    }
  }
}

/** The first non-tunnel tile the body would overlap at (x, y), if any. */
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
    if (soilAt(s, tx, ty) !== 'tunnel') return { i: ty * s.cols + tx };
  }
  return null;
}

/** Pebbles and roots are solid: you feel them and go around. */
function solidThing(s: GameState, x: number, y: number, r: number): boolean {
  for (const t of s.things) {
    if (!t.alive || OBJECTS[t.material].edible) continue;
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

function moveThings(s: GameState, dt: number): void {
  for (const t of s.things) {
    if (!t.alive || t.speed <= 0) continue;
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
    if (soilAtPx(s, nx + Math.cos(t.heading) * 6, ny + Math.sin(t.heading) * 6) !== 'tunnel') {
      t.heading += Math.PI * (0.5 + s.rng.next());
      continue;
    }
    if (t.shape.kind === 'circle') {
      t.shape.c = { x: nx, y: ny };
    } else {
      // the body follows the head like a chain
      const pts = t.shape.points;
      pts[0] = { x: nx, y: ny };
      const gap = t.material === 'worm' ? 4 : 3;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1] as Vec;
        const b = pts[i] as Vec;
        const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        pts[i] = { x: a.x + ((b.x - a.x) / d) * gap, y: a.y + ((b.y - a.y) / d) * gap };
      }
    }
  }
}

/** Each ray taps on its own rhythm; every touch is remembered for a while. */
function sense(s: GameState, focus: boolean, dt: number, ev: GameEvent[]): void {
  const live = s.things.filter((t) => t.alive);
  const wall = (x: number, y: number) => {
    const soil = soilAtPx(s, x, y);
    return soil === 'tunnel' ? null : soil === 'rock' ? 'stone' : 'soil';
  };
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
    const before = c.id >= 0 ? s.memory.confidence(c.id, s.time) : 0;
    s.memory.add(c, s.time, s.character.acuity);
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

function bite(s: GameState, ev: GameEvent[]): void {
  if (s.biteCooldown > 0) return;
  s.biteCooldown = TUNING.biteCooldown;
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
  t.alive = false;
  s.memory.forget(t.id);
  s.combo = s.comboTimer > 0 || s.combo === 0 ? s.combo + 1 : 1;
  s.comboTimer = s.character.comboWindow;
  s.bestCombo = Math.max(s.bestCombo, s.combo);
  s.energy = Math.min(s.character.maxEnergy, s.energy + def.energy);
  s.eaten[t.material] = (s.eaten[t.material] ?? 0) + 1;
  s.score += Math.round(def.points * multiplier(s.combo));
  const head = t.shape.kind === 'circle' ? t.shape.c : (t.shape.points[0] as Vec);
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

export function stars(s: GameState): number {
  if (s.status !== 'won') return 0;
  const [, two, three] = s.level.stars;
  return s.score >= three ? 3 : s.score >= two ? 2 : 1;
}
