import { createRng, type Rng } from '../utils/rng';
import { WILDLIFE, type WildlifeSpecies } from '../content/wildlife';

// DIVE: underwater exploration and wildlife photography. The diver swims a bounded field,
// photographing wildlife that wander, get alert, and flee from a fast or close approach, and
// collects one water sample that determines the following ONE DROP round's specimen mix. Pure
// and Phaser-free so it's reusable by future Expedition installments (docs/EXPEDITION_ENGINE.md).

export type PhotoQuality = 'poor' | 'good' | 'great' | 'exceptional';
export type WildlifeMood = 'idle' | 'alert' | 'fleeing';

export interface SpawnEntry {
  speciesId: string;
  weight: number;
}

export interface SampleSite {
  x: number;
  y: number;
  radius: number;
  /** The biological scale this water sample feeds into for the following ONE DROP round. */
  scaleId: string;
}

export interface DiveConfig {
  id: string;
  name: string;
  fieldWidth: number;
  fieldHeight: number;
  durationSeconds: number;
  battery: number;
  diverSpeed: number;
  spawnTable: SpawnEntry[];
  maxWildlife: number;
  spawnRate: number;
  sampleSite: SampleSite;
}

export interface WildlifeInstance {
  id: number;
  speciesId: string;
  x: number;
  y: number;
  heading: number;
  mood: WildlifeMood;
  behaviorActive: boolean;
  behaviorTimer: number;
  wanderTimer: number;
}

export interface PhotoResult {
  speciesId: string;
  distance: number;
  quality: PhotoQuality;
  score: number;
  novel: boolean;
  behavioralSignificance: boolean;
  disturbed: boolean;
}

export interface DiveState {
  config: DiveConfig;
  rng: Rng;
  time: number;
  diverX: number;
  diverY: number;
  prevDiverX: number;
  prevDiverY: number;
  battery: number;
  photos: PhotoResult[];
  speciesPhotographed: Set<string>;
  disturbanceEvents: number;
  sampleCollected: boolean;
  wildlife: WildlifeInstance[];
  nextId: number;
  status: 'diving' | 'surfaced';
}

export type DiveEvent =
  | { type: 'photo'; result: PhotoResult }
  | { type: 'noSubject' }
  | { type: 'outOfBattery' }
  | { type: 'disturbed'; speciesId: string }
  | { type: 'sampleCollected'; scaleId: string }
  | { type: 'surfaced' };

export function createDive(config: DiveConfig, seed = 1): DiveState {
  return {
    config,
    rng: createRng(seed),
    time: 0,
    diverX: config.fieldWidth / 2,
    diverY: config.fieldHeight / 2,
    prevDiverX: config.fieldWidth / 2,
    prevDiverY: config.fieldHeight / 2,
    battery: config.battery,
    photos: [],
    speciesPhotographed: new Set(),
    disturbanceEvents: 0,
    sampleCollected: false,
    wildlife: [],
    nextId: 1,
    status: 'diving',
  };
}

function pickSpecies(state: DiveState): WildlifeSpecies | null {
  const table = state.config.spawnTable;
  const total = table.reduce((sum, e) => sum + e.weight, 0);
  if (total <= 0) return null;
  let roll = state.rng.next() * total;
  for (const entry of table) {
    roll -= entry.weight;
    if (roll <= 0) return WILDLIFE[entry.speciesId] ?? null;
  }
  return WILDLIFE[table[table.length - 1]!.speciesId] ?? null;
}

function spawnWildlife(state: DiveState): void {
  const species = pickSpecies(state);
  if (!species) return;
  const { fieldWidth: w, fieldHeight: h } = state.config;
  state.wildlife.push({
    id: state.nextId++,
    speciesId: species.id,
    x: state.rng.range(w * 0.1, w * 0.9),
    y: state.rng.range(h * 0.1, h * 0.9),
    heading: state.rng.next() * Math.PI * 2,
    mood: 'idle',
    behaviorActive: species.behavior !== undefined && state.rng.next() < 0.5,
    behaviorTimer: state.rng.range(3, 8),
    wanderTimer: state.rng.range(1, 3),
  });
}

/** Moves the diver by a unit-ish input vector, clamped to the field, and advances wildlife AI. */
export function stepDive(state: DiveState, dt: number, moveX: number, moveY: number): DiveEvent[] {
  const ev: DiveEvent[] = [];
  if (state.status !== 'diving') return ev;
  state.time += dt;

  state.prevDiverX = state.diverX;
  state.prevDiverY = state.diverY;
  const mag = Math.hypot(moveX, moveY) || 1;
  const nx = (moveX / mag) * Math.min(mag, 1);
  const ny = (moveY / mag) * Math.min(mag, 1);
  state.diverX = clamp(
    state.diverX + nx * state.config.diverSpeed * dt,
    0,
    state.config.fieldWidth,
  );
  state.diverY = clamp(
    state.diverY + ny * state.config.diverSpeed * dt,
    0,
    state.config.fieldHeight,
  );
  const approachSpeed =
    Math.hypot(state.diverX - state.prevDiverX, state.diverY - state.prevDiverY) / dt;

  if (
    state.wildlife.length < state.config.maxWildlife &&
    state.rng.next() < state.config.spawnRate * dt
  ) {
    spawnWildlife(state);
  }

  for (const w of state.wildlife) {
    const species = WILDLIFE[w.speciesId];
    if (!species) continue;
    const dist = Math.hypot(w.x - state.diverX, w.y - state.diverY);

    if (dist < species.fleeDistance && approachSpeed > state.config.diverSpeed * 0.5) {
      if (w.mood !== 'fleeing') {
        state.disturbanceEvents++;
        ev.push({ type: 'disturbed', speciesId: w.speciesId });
      }
      w.mood = 'fleeing';
    } else if (dist < species.fleeDistance * 1.5) {
      if (w.mood === 'fleeing' && dist > species.fleeDistance) w.mood = 'alert';
      else if (w.mood === 'idle') w.mood = 'alert';
    } else {
      w.mood = 'idle';
    }

    if (w.mood === 'fleeing') {
      const away = Math.atan2(w.y - state.diverY, w.x - state.diverX);
      w.x += Math.cos(away) * 90 * dt;
      w.y += Math.sin(away) * 90 * dt;
    } else {
      w.wanderTimer -= dt;
      if (w.wanderTimer <= 0) {
        w.heading = state.rng.next() * Math.PI * 2;
        w.wanderTimer = state.rng.range(1.5, 3.5);
      }
      w.x += Math.cos(w.heading) * 18 * dt;
      w.y += Math.sin(w.heading) * 18 * dt;
    }
    w.x = clamp(w.x, 0, state.config.fieldWidth);
    w.y = clamp(w.y, 0, state.config.fieldHeight);

    if (species.behavior) {
      w.behaviorTimer -= dt;
      if (w.behaviorTimer <= 0) {
        w.behaviorActive = !w.behaviorActive;
        w.behaviorTimer = state.rng.range(4, 9);
      }
    }
  }

  if (state.time >= state.config.durationSeconds) {
    state.status = 'surfaced';
    ev.push({ type: 'surfaced' });
  }
  return ev;
}

/** Photographs the nearest wildlife within frame range, if any, consuming one unit of battery. */
export function takePhoto(state: DiveState): DiveEvent[] {
  if (state.status !== 'diving') return [];
  if (state.battery <= 0) return [{ type: 'outOfBattery' }];

  let nearest: WildlifeInstance | null = null;
  let nearestDist = Infinity;
  for (const w of state.wildlife) {
    const d = Math.hypot(w.x - state.diverX, w.y - state.diverY);
    const species = WILDLIFE[w.speciesId];
    if (!species) continue;
    if (d < species.idealDistance * 2 && d < nearestDist) {
      nearest = w;
      nearestDist = d;
    }
  }

  state.battery--;
  if (!nearest) return [{ type: 'noSubject' }];

  const species = WILDLIFE[nearest.speciesId]!;
  const distanceScore = clamp01(
    1 - Math.abs(nearestDist - species.idealDistance) / species.idealDistance,
  );
  const behavioralSignificance = nearest.behaviorActive && species.behavior !== undefined;
  const novel = !state.speciesPhotographed.has(species.id);
  const disturbed = nearest.mood === 'fleeing';

  let composite = distanceScore * 0.6 + (behavioralSignificance ? 0.3 : 0) + (novel ? 0.2 : 0);
  if (disturbed) composite *= 0.5;
  composite = clamp01(composite);

  const quality: PhotoQuality =
    composite >= 0.85
      ? 'exceptional'
      : composite >= 0.65
        ? 'great'
        : composite >= 0.4
          ? 'good'
          : 'poor';
  const score = Math.round(species.baseValue * (0.5 + composite));

  state.speciesPhotographed.add(species.id);
  const result: PhotoResult = {
    speciesId: species.id,
    distance: nearestDist,
    quality,
    score,
    novel,
    behavioralSignificance,
    disturbed,
  };
  state.photos.push(result);
  return [{ type: 'photo', result }];
}

/** Collects the expedition's one water sample, if the diver is at the sample site. */
export function collectSample(state: DiveState): DiveEvent[] {
  if (state.status !== 'diving' || state.sampleCollected) return [];
  const site = state.config.sampleSite;
  const d = Math.hypot(state.diverX - site.x, state.diverY - site.y);
  if (d > site.radius) return [];
  state.sampleCollected = true;
  return [{ type: 'sampleCollected', scaleId: site.scaleId }];
}

export function bestPhotoScore(state: DiveState): number {
  return state.photos.reduce((max, p) => Math.max(max, p.score), 0);
}

export function totalPhotoScore(state: DiveState): number {
  return state.photos.reduce((sum, p) => sum + p.score, 0);
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function clamp01(v: number): number {
  return clamp(v, 0, 1);
}
