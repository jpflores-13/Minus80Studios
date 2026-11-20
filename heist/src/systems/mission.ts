import { CREW, type CrewId, type CrewMember } from '../content/crew';
import type { JobConfig } from '../levels/types';
import {
  parseBuilding,
  centre,
  lineOfSight,
  pathIndexAt,
  solid,
  tileAt,
  TILE,
  type Building,
  type Spot,
} from './building';
import { active, createFolds, deploy, links, release, stepFolds, type Folds } from './folder';

// One job as plain data plus stepMission(). The scene draws it; tests drive it directly.

export const RULES = {
  radius: 10,
  sprint: 1.5,
  guardRange: 6 * TILE,
  guardHalfAngle: (38 * Math.PI) / 180,
  cameraRange: 6 * TILE,
  cameraHalfAngle: (22 * Math.PI) / 180,
  /** Suspicion per second while seen (sprinting makes it worse). */
  seenRate: 0.85,
  cameraRate: 0.6,
  coolRate: 0.22,
  /** Above this, the guard comes after you. */
  chaseAt: 0.5,
  chaseSpeed: 1.6,
  /** Seconds before the same doorway can carry you again. */
  crossCooldown: 0.6,
};

export interface Input {
  dx: number;
  dy: number;
  sprint: boolean;
  /** Deploy (or release) the Folder this frame. */
  fold: boolean;
  interact: boolean;
}

export const NO_INPUT: Input = { dx: 0, dy: 0, sprint: false, fold: false, interact: false };

export interface Guard {
  x: number;
  y: number;
  heading: number;
  route: { x: number; y: number }[];
  next: number;
  speed: number;
  state: 'patrol' | 'chase' | 'return';
  path: Spot[];
  repath: number;
  crossCooldown: number;
  /** Corridor position it stood on last frame (-1 if none), so a doorway only carries you when you step onto it. */
  onPath: number;
}

export interface Camera {
  x: number;
  y: number;
  angle: number;
  sweep: [number, number];
  period: number;
  sees: boolean;
}

export interface Mission {
  job: JobConfig;
  crew: CrewMember;
  b: Building;
  folds: Folds;
  player: { x: number; y: number; heading: number; moving: boolean; onPath: number };
  crossCooldown: number;
  guards: Guard[];
  cameras: Camera[];
  suspicion: number;
  everSeen: boolean;
  hasDiamond: boolean;
  loot: { spot: Spot; taken: boolean }[];
  escapeLeft: number;
  time: number;
  crossings: number;
  status: 'playing' | 'won' | 'lost';
  lostReason: 'caught' | 'time' | null;
}

export type MissionEvent =
  | { type: 'deployed'; index: number }
  | { type: 'deployFailed'; why: 'not-corridor' | 'cooldown' | 'empty' | 'busy' }
  | { type: 'released' }
  | { type: 'linked'; a: number; b: number }
  | { type: 'crossed'; who: 'player' | 'guard'; from: Spot; to: Spot }
  | { type: 'spotted'; by: 'guard' | 'camera' }
  | { type: 'chase' }
  | { type: 'loot'; primary: boolean }
  | { type: 'won' }
  | { type: 'lost'; reason: 'caught' | 'time' };

export function createMission(job: JobConfig, crewId: CrewId = 'ghost', seed = 1): Mission {
  const b = parseBuilding(job.map);
  const crew = CREW[crewId];
  const start = centre(b.start);
  return {
    job,
    crew,
    b,
    folds: createFolds(b.path.length, b.anchors, crew.folder, seed, b.oneWayAnchors),
    player: { x: start.x, y: start.y, heading: -Math.PI / 2, moving: false, onPath: -1 },
    crossCooldown: 0,
    guards: job.guards.map((g, i) => {
      const at = centre(b.guards[i] ?? b.start);
      return {
        x: at.x,
        y: at.y,
        heading: 0,
        route: g.route.map(([tx, ty]) => centre({ tx, ty })),
        next: 0,
        speed: g.speed,
        state: 'patrol' as const,
        path: [],
        repath: 0,
        crossCooldown: 0,
        onPath: -1,
      };
    }),
    cameras: job.cameras.map((c, i) => {
      const at = centre(b.cameras[i] ?? b.start);
      return {
        x: at.x,
        y: at.y,
        angle: (c.sweep[0] * Math.PI) / 180,
        sweep: c.sweep,
        period: c.period,
        sees: false,
      };
    }),
    suspicion: 0,
    everSeen: false,
    hasDiamond: false,
    loot: b.loot.map((spot) => ({ spot, taken: false })),
    escapeLeft: job.escapeSeconds,
    time: 0,
    crossings: 0,
    status: 'playing',
    lostReason: null,
  };
}

export function stepMission(m: Mission, input: Input, dt: number): MissionEvent[] {
  if (m.status !== 'playing') return [];
  const ev: MissionEvent[] = [];
  m.time += dt;
  m.crossCooldown = Math.max(0, m.crossCooldown - dt);

  if (input.fold) useFolder(m, ev);
  const before = links(m.folds).length;
  const { released } = stepFolds(m.folds, dt);
  if (released) ev.push({ type: 'released' });
  const now = links(m.folds);
  if (now.length > before) for (const [a, b] of now) ev.push({ type: 'linked', a, b });

  movePlayer(m, input, dt);
  const crossed = crossFold(m, m.player, m.crossCooldown);
  if (crossed) {
    m.crossCooldown = RULES.crossCooldown;
    m.crossings++;
    ev.push({ type: 'crossed', who: 'player', ...crossed });
  }
  pickUp(m, ev);
  security(m, input, dt, ev);
  for (const g of m.guards) moveGuard(m, g, dt, ev);

  if (m.hasDiamond) {
    m.escapeLeft -= dt;
    const van = centre(m.b.van);
    if (Math.hypot(van.x - m.player.x, van.y - m.player.y) < TILE) {
      m.status = 'won';
      ev.push({ type: 'won' });
    } else if (m.escapeLeft <= 0) lose(m, 'time', ev);
  }
  return ev;
}

function lose(m: Mission, reason: 'caught' | 'time', ev: MissionEvent[]): void {
  if (m.status !== 'playing') return;
  m.status = 'lost';
  m.lostReason = reason;
  ev.push({ type: 'lost', reason });
}

function useFolder(m: Mission, ev: MissionEvent[]): void {
  // with every device busy, the button lets go instead
  if (active(m.folds).length >= m.folds.spec.devices) {
    release(m.folds);
    ev.push({ type: 'released' });
    return;
  }
  const tx = Math.floor(m.player.x / TILE);
  const ty = Math.floor(m.player.y / TILE);
  const index = pathIndexAt(m.b, tx, ty);
  if (index < 0) return void ev.push({ type: 'deployFailed', why: 'not-corridor' });
  if (m.folds.charges <= 0) return void ev.push({ type: 'deployFailed', why: 'empty' });
  if (m.folds.cooldown > 0) return void ev.push({ type: 'deployFailed', why: 'cooldown' });
  if (deploy(m.folds, index)) ev.push({ type: 'deployed', index });
  else ev.push({ type: 'deployFailed', why: 'busy' });
}

/** If someone just stepped onto one end of a fold, carry them out of the other end. */
function crossFold(
  m: Mission,
  who: { x: number; y: number; onPath: number },
  cooldown: number,
): { from: Spot; to: Spot } | null {
  const tx = Math.floor(who.x / TILE);
  const ty = Math.floor(who.y / TILE);
  const i = pathIndexAt(m.b, tx, ty);
  const stepped = i !== who.onPath;
  who.onPath = i;
  if (i < 0 || !stepped || cooldown > 0) return null;
  for (const [a, b] of links(m.folds)) {
    const other = i === a ? b : i === b ? a : -1;
    if (other < 0) continue;
    const from = m.b.path[i] as Spot;
    const to = m.b.path[other] as Spot;
    const c = centre(to);
    who.x = c.x;
    who.y = c.y;
    who.onPath = other;
    return { from, to };
  }
  return null;
}

function walkable(m: Mission, x: number, y: number, r: number): boolean {
  for (const [ox, oy] of [
    [-r, -r],
    [r, -r],
    [-r, r],
    [r, r],
  ] as const)
    if (solid(tileAt(m.b, Math.floor((x + ox) / TILE), Math.floor((y + oy) / TILE)))) return false;
  return true;
}

function movePlayer(m: Mission, input: Input, dt: number): void {
  const p = m.player;
  const len = Math.hypot(input.dx, input.dy);
  p.moving = len > 0.1;
  if (!p.moving) return;
  const dx = input.dx / Math.max(1, len);
  const dy = input.dy / Math.max(1, len);
  p.heading = Math.atan2(dy, dx);
  const speed = m.crew.moveSpeed * (input.sprint ? RULES.sprint : 1);
  const nx = p.x + dx * speed * dt;
  const ny = p.y + dy * speed * dt;
  if (walkable(m, nx, p.y, RULES.radius)) p.x = nx;
  if (walkable(m, p.x, ny, RULES.radius)) p.y = ny;
}

function pickUp(m: Mission, ev: MissionEvent[]): void {
  const d = centre(m.b.diamond);
  if (!m.hasDiamond && Math.hypot(d.x - m.player.x, d.y - m.player.y) < TILE * 0.7) {
    m.hasDiamond = true;
    ev.push({ type: 'loot', primary: true });
  }
  for (const l of m.loot) {
    const c = centre(l.spot);
    if (!l.taken && Math.hypot(c.x - m.player.x, c.y - m.player.y) < TILE * 0.7) {
      l.taken = true;
      ev.push({ type: 'loot', primary: false });
    }
  }
}

/** Is the point inside a vision cone with a clear line of sight? */
export function inCone(
  m: Mission,
  ox: number,
  oy: number,
  angle: number,
  range: number,
  half: number,
  x: number,
  y: number,
): boolean {
  const d = Math.hypot(x - ox, y - oy);
  if (d > range) return false;
  let diff = Math.atan2(y - oy, x - ox) - angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff) <= half && lineOfSight(m.b, ox, oy, x, y);
}

function security(m: Mission, input: Input, dt: number, ev: MissionEvent[]): void {
  const p = m.player;
  let seen = false;
  for (const c of m.cameras) {
    const t = (m.time % c.period) / c.period;
    const s = t < 0.5 ? t * 2 : 2 - t * 2;
    c.angle = ((c.sweep[0] + (c.sweep[1] - c.sweep[0]) * s) * Math.PI) / 180;
    const now = inCone(m, c.x, c.y, c.angle, RULES.cameraRange, RULES.cameraHalfAngle, p.x, p.y);
    if (now && !c.sees) ev.push({ type: 'spotted', by: 'camera' });
    c.sees = now;
    if (now) {
      m.suspicion += RULES.cameraRate * dt;
      seen = true;
    }
  }
  for (const g of m.guards) {
    if (inCone(m, g.x, g.y, g.heading, RULES.guardRange, RULES.guardHalfAngle, p.x, p.y)) {
      if (m.suspicion < 0.05) ev.push({ type: 'spotted', by: 'guard' });
      m.suspicion += RULES.seenRate * (input.sprint ? 1.3 : 1) * dt;
      seen = true;
    }
  }
  if (seen) m.everSeen = true;
  else m.suspicion = Math.max(0, m.suspicion - RULES.coolRate * dt);
  if (m.suspicion >= 1) {
    m.suspicion = 1;
    lose(m, 'caught', ev);
  }
  // a guard that catches up with you also ends it
  for (const g of m.guards)
    if (Math.hypot(g.x - p.x, g.y - p.y) < RULES.radius * 2) lose(m, 'caught', ev);
}

function moveGuard(m: Mission, g: Guard, dt: number, ev: MissionEvent[]): void {
  g.crossCooldown = Math.max(0, g.crossCooldown - dt);
  const chasing = m.suspicion >= RULES.chaseAt;
  if (chasing && g.state !== 'chase') {
    g.state = 'chase';
    ev.push({ type: 'chase' });
  } else if (!chasing && g.state === 'chase') g.state = 'return';

  let target: { x: number; y: number };
  if (g.state === 'chase') {
    g.repath -= dt;
    if (g.repath <= 0) {
      g.path = findPath(m, tileOf(g), tileOf(m.player));
      g.repath = 0.4;
    }
    const step = g.path[1] ?? tileOf(m.player);
    target = centre(step);
  } else {
    const wp = g.route[g.next] ?? { x: g.x, y: g.y };
    if (g.state === 'return') {
      g.repath -= dt;
      if (g.repath <= 0) {
        g.path = findPath(m, tileOf(g), tileOf(wp));
        g.repath = 0.6;
      }
      target = g.path[1] ? centre(g.path[1]) : wp;
      if (Math.hypot(wp.x - g.x, wp.y - g.y) < 6) g.state = 'patrol';
    } else {
      target = wp;
      if (Math.hypot(wp.x - g.x, wp.y - g.y) < 4) g.next = (g.next + 1) % g.route.length;
    }
  }
  const dx = target.x - g.x;
  const dy = target.y - g.y;
  const d = Math.hypot(dx, dy);
  if (d > 0.5) {
    const speed = g.speed * (g.state === 'chase' ? RULES.chaseSpeed : 1);
    const step = Math.min(d, speed * dt);
    g.x += (dx / d) * step;
    g.y += (dy / d) * step;
    const want = Math.atan2(dy, dx);
    let diff = want - g.heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    g.heading += diff * Math.min(1, dt * 6);
  }
  // guards use folds too
  const crossed = crossFold(m, g, g.crossCooldown);
  if (crossed) {
    g.crossCooldown = RULES.crossCooldown * 2;
    g.repath = 0;
    ev.push({ type: 'crossed', who: 'guard', ...crossed });
  }
}

function tileOf(p: { x: number; y: number }): Spot {
  return { tx: Math.floor(p.x / TILE), ty: Math.floor(p.y / TILE) };
}

/** Shortest route over floor tiles, using any fold that is open right now. */
export function findPath(m: Mission, from: Spot, to: Spot): Spot[] {
  const key = (s: Spot) => s.ty * m.b.cols + s.tx;
  const prev = new Map<number, number>();
  const start = key(from);
  const goal = key(to);
  const queue = [start];
  prev.set(start, -1);
  const extra = new Map<number, number[]>();
  for (const [a, b] of links(m.folds)) {
    const ka = key(m.b.path[a] as Spot);
    const kb = key(m.b.path[b] as Spot);
    extra.set(ka, [...(extra.get(ka) ?? []), kb]);
    extra.set(kb, [...(extra.get(kb) ?? []), ka]);
  }
  while (queue.length) {
    const k = queue.shift() as number;
    if (k === goal) break;
    const tx = k % m.b.cols;
    const ty = Math.floor(k / m.b.cols);
    const next = [
      [tx + 1, ty],
      [tx - 1, ty],
      [tx, ty + 1],
      [tx, ty - 1],
    ]
      .filter(([x, y]) => !solid(tileAt(m.b, x as number, y as number)))
      .map(([x, y]) => (y as number) * m.b.cols + (x as number));
    for (const n of [...next, ...(extra.get(k) ?? [])])
      if (!prev.has(n)) {
        prev.set(n, k);
        queue.push(n);
      }
  }
  if (!prev.has(goal)) return [from];
  const out: Spot[] = [];
  for (let k = goal; k !== -1; k = prev.get(k) ?? -1)
    out.unshift({ tx: k % m.b.cols, ty: Math.floor(k / m.b.cols) });
  return out;
}

export function score(m: Mission): { total: number; stars: number; parts: Record<string, number> } {
  if (m.status !== 'won') return { total: 0, stars: 0, parts: {} };
  const parts = {
    diamond: 1000,
    loot: m.loot.filter((l) => l.taken).length * 250,
    escape: Math.round(m.escapeLeft * 20),
    unseen: m.everSeen ? 0 : 600,
    folds: m.crossings > 0 ? 200 : 0,
  };
  const total = Object.values(parts).reduce((a, b) => a + b, 0);
  const [, two, three] = m.job.stars;
  return { total, stars: total >= three ? 3 : total >= two ? 2 : 1, parts };
}
