import { createRng, type Rng } from '../utils/rng';

// ONE DROP: the microscope field. Particles drift through a circular field of view; the player
// documents the ones matching the round's objective and leaves everything else alone. This is
// the reusable engine other Expedition installments can reuse with a different SpecimenType set
// (see docs/EXPEDITION_ENGINE.md) — nothing here is Antarctica-specific.

/** Four scientific categories, not "good" or "bad": see docs/SCIENTIFIC_MYSTERIES.md. */
export type ParticleKind = 'target' | 'nonTarget' | 'artifact' | 'unknown';

export interface SpecimenType {
  id: string;
  name: string;
  kind: ParticleKind;
  /** Hit radius, px, at the field's reference scale. */
  radius: number;
  /** Drift speed, px/s. */
  speed: number;
  /** Points for a correct capture of this type (targets only; ignored for the rest). */
  value: number;
}

export interface Particle {
  id: number;
  typeId: string;
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alive: boolean;
  age: number;
}

export interface OneDropObjective {
  /** The specimen type the round asks the player to document. */
  targetTypeId: string;
  count: number;
}

export interface SpawnEntry {
  typeId: string;
  weight: number;
}

export interface OneDropConfig {
  id: string;
  name: string;
  fieldRadius: number;
  durationSeconds: number;
  objective: OneDropObjective;
  spawnTable: SpawnEntry[];
  /** Particles per second at the round's start. */
  spawnRate: number;
  /** spawnRate multiplies by this much every 10 seconds, for the "increasing difficulty" feel. */
  rampPerTenSeconds: number;
  maxParticles: number;
  types: Record<string, SpecimenType>;
}

export interface OneDropState {
  config: OneDropConfig;
  rng: Rng;
  particles: Particle[];
  nextId: number;
  time: number;
  captured: number;
  wrong: number;
  unknownsDocumented: number;
  missedUnknowns: number;
  combo: number;
  bestCombo: number;
  score: number;
  status: 'playing' | 'won' | 'lost';
}

export type OneDropEvent =
  | { type: 'spawned'; id: number; typeId: string }
  | { type: 'captured'; id: number; typeId: string; combo: number; points: number }
  | { type: 'wrong'; id: number; typeId: string; kind: ParticleKind }
  | { type: 'documentedUnknown'; id: number }
  | { type: 'missedUnknown'; id: number; kind: ParticleKind }
  | { type: 'comboBroken' }
  | { type: 'won' }
  | { type: 'lost' };

export function createOneDrop(config: OneDropConfig, seed = 1): OneDropState {
  return {
    config,
    rng: createRng(seed),
    particles: [],
    nextId: 1,
    time: 0,
    captured: 0,
    wrong: 0,
    unknownsDocumented: 0,
    missedUnknowns: 0,
    combo: 0,
    bestCombo: 0,
    score: 0,
    status: 'playing',
  };
}

function pickSpawnType(state: OneDropState): SpecimenType | null {
  const table = state.config.spawnTable;
  const total = table.reduce((sum, e) => sum + e.weight, 0);
  if (total <= 0) return null;
  let roll = state.rng.next() * total;
  for (const entry of table) {
    roll -= entry.weight;
    if (roll <= 0) return state.config.types[entry.typeId] ?? null;
  }
  return state.config.types[table[table.length - 1]!.typeId] ?? null;
}

function spawnOne(state: OneDropState, ev: OneDropEvent[]): void {
  const type = pickSpawnType(state);
  if (!type) return;
  const r = state.config.fieldRadius;
  // enter from the field's edge, drifting roughly inward with some lateral wander
  const entryAngle = state.rng.next() * Math.PI * 2;
  const x = Math.cos(entryAngle) * r;
  const y = Math.sin(entryAngle) * r;
  const towardCentre = Math.atan2(-y, -x) + (state.rng.next() - 0.5) * 1.4;
  const id = state.nextId++;
  state.particles.push({
    id,
    typeId: type.id,
    kind: type.kind,
    x,
    y,
    vx: Math.cos(towardCentre) * type.speed,
    vy: Math.sin(towardCentre) * type.speed,
    radius: type.radius,
    alive: true,
    age: 0,
  });
  ev.push({ type: 'spawned', id, typeId: type.id });
}

export function stepOneDrop(state: OneDropState, dt: number): OneDropEvent[] {
  if (state.status !== 'playing') return [];
  const ev: OneDropEvent[] = [];
  state.time += dt;

  const ramps = Math.floor(state.time / 10);
  const rate = state.config.spawnRate * state.config.rampPerTenSeconds ** ramps;
  const live = state.particles.filter((p) => p.alive).length;
  if (live < state.config.maxParticles && state.rng.next() < rate * dt) spawnOne(state, ev);

  const r = state.config.fieldRadius;
  for (const p of state.particles) {
    if (!p.alive) continue;
    p.age += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    // drifted out of the field: gone, no penalty either way
    if (Math.hypot(p.x, p.y) > r + p.radius) p.alive = false;
  }
  state.particles = state.particles.filter((p) => p.alive || p.age < 0.01);

  checkEnd(state, ev);
  return ev;
}

function checkEnd(state: OneDropState, ev: OneDropEvent[]): void {
  if (state.status !== 'playing') return;
  if (state.captured >= state.config.objective.count) {
    state.status = 'won';
    ev.push({ type: 'won' });
  } else if (state.time >= state.config.durationSeconds) {
    state.status = 'lost';
    ev.push({ type: 'lost' });
  }
}

/** Claim a particle is the round's target. Correct only if it actually is. */
export function capture(state: OneDropState, id: number): OneDropEvent[] {
  if (state.status !== 'playing') return [];
  const p = state.particles.find((x) => x.id === id && x.alive);
  if (!p) return [];
  const ev: OneDropEvent[] = [];
  p.alive = false;
  if (p.typeId === state.config.objective.targetTypeId) {
    state.captured++;
    state.combo++;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    const type = state.config.types[p.typeId];
    const points = Math.round((type?.value ?? 10) * (1 + state.combo * 0.1));
    state.score += points;
    ev.push({ type: 'captured', id, typeId: p.typeId, combo: state.combo, points });
    checkEnd(state, ev);
  } else {
    state.wrong++;
    if (state.combo > 0) ev.push({ type: 'comboBroken' });
    state.combo = 0;
    ev.push({ type: 'wrong', id, typeId: p.typeId, kind: p.kind });
  }
  return ev;
}

/** Document a particle as an ambiguous observation, rather than claiming an identification. */
export function markUnknown(state: OneDropState, id: number): OneDropEvent[] {
  if (state.status !== 'playing') return [];
  const p = state.particles.find((x) => x.id === id && x.alive);
  if (!p) return [];
  const ev: OneDropEvent[] = [];
  p.alive = false;
  if (p.kind === 'unknown') {
    state.unknownsDocumented++;
    state.score += 5;
    ev.push({ type: 'documentedUnknown', id });
  } else {
    // a real call left on the table, not a mistake: no combo break, no score change
    state.missedUnknowns++;
    ev.push({ type: 'missedUnknown', id, kind: p.kind });
  }
  return ev;
}

export function accuracy(state: OneDropState): number {
  const attempts = state.captured + state.wrong;
  return attempts === 0 ? 1 : state.captured / attempts;
}
