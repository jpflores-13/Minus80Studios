import {
  BASE_WORMAGEDDON_MODS,
  offerWormageddonUpgrades,
  type WormageddonMods,
  type WormageddonUpgrade,
  type WormageddonUpgradeId,
} from '../content/wormageddon';
import { OBJECTS } from '../content/objects';
import { chainThing, soilAt, TILE, type GameEvent, type GameState } from './game';
import type { Vec } from './geometry';

// WORMAGEDDON: the same mole, same rays, same dig/eat/water rules, just an arena with no
// objective. Food keeps spawning and predators keep showing up, both a little faster the longer
// you survive, until your energy finally runs out. Numbers here are tunable, not measured.

export const WORMAGEDDON_TUNING = {
  spawnIntervalStart: 6,
  spawnIntervalFloor: 2,
  spawnIntervalRampPerSecond: 0.03,
  foodPerWave: 2,
  predatorIntervalStart: 45,
  predatorIntervalFloor: 15,
  predatorIntervalRampPerSecond: 0.15,
  maxPredators: 6,
  predatorSpeedStart: 40,
  predatorSpeedPerMinute: 4,
  upgradeInterval: 40,
};

export interface WormageddonState {
  phase: 'playing' | 'upgrade';
  mods: WormageddonMods;
  taken: Partial<Record<WormageddonUpgradeId, number>>;
  offers: WormageddonUpgrade[];
  nextSpawnAt: number;
  nextPredatorAt: number;
  nextUpgradeAt: number;
  predatorsSpawned: number;
  /** Ids for anything spawned during the run start past every id the arena's map already used. */
  nextThingId: number;
}

/** Call right after `createGame(arena, ...)`, so spawned things never collide with map ones. */
export function createWormageddonState(s: GameState): WormageddonState {
  return {
    phase: 'playing',
    mods: { ...BASE_WORMAGEDDON_MODS },
    taken: {},
    offers: [],
    nextSpawnAt: WORMAGEDDON_TUNING.spawnIntervalStart,
    nextPredatorAt: WORMAGEDDON_TUNING.predatorIntervalStart,
    nextUpgradeAt: WORMAGEDDON_TUNING.upgradeInterval,
    predatorsSpawned: 0,
    nextThingId: Math.max(0, ...s.things.map((t) => t.id)) + 1,
  };
}

const FOOD_MATERIALS: {
  material: 'worm' | 'larva' | 'aquaWorm' | 'aquaLarva';
  soil: 'tunnel' | 'water';
}[] = [
  { material: 'worm', soil: 'tunnel' },
  { material: 'larva', soil: 'tunnel' },
  { material: 'aquaWorm', soil: 'water' },
  { material: 'aquaLarva', soil: 'water' },
];

function openTiles(s: GameState, soilType: 'tunnel' | 'water'): Vec[] {
  const out: Vec[] = [];
  for (let ty = 0; ty < s.rows; ty++)
    for (let tx = 0; tx < s.cols; tx++)
      if (soilAt(s, tx, ty) === soilType)
        out.push({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 });
  return out;
}

function randomOpenSpot(
  s: GameState,
  soilType: 'tunnel' | 'water',
  awayFrom: Vec,
  minDist: number,
): Vec | null {
  const tiles = openTiles(s, soilType).filter(
    (t) => Math.hypot(t.x - awayFrom.x, t.y - awayFrom.y) >= minDist,
  );
  if (tiles.length === 0) return null;
  return tiles[Math.floor(s.rng.next() * tiles.length)] ?? null;
}

function spawnFood(s: GameState, nextId: () => number): void {
  const hasWaterTiles = openTiles(s, 'water').length > 0;
  const pool = FOOD_MATERIALS.filter((f) => f.soil === 'tunnel' || hasWaterTiles);
  for (let i = 0; i < WORMAGEDDON_TUNING.foodPerWave; i++) {
    const pick = pool[Math.floor(s.rng.next() * pool.length)];
    if (!pick) continue;
    const spot = randomOpenSpot(s, pick.soil, s.mole, 180);
    if (!spot) continue;
    s.things.push(chainThing(nextId(), pick.material, spot, s.rng));
  }
}

function spawnPredator(s: GameState, nextId: () => number, minutesSurvived: number): void {
  const spot = randomOpenSpot(s, 'tunnel', s.mole, 260);
  if (!spot) return;
  // a short random patrol loop around where it spawned, same shape movePredator already expects
  const route: Vec[] = [0, 1, 2, 3].map((i) => ({
    x: spot.x + Math.cos((i / 4) * Math.PI * 2) * 48,
    y: spot.y + Math.sin((i / 4) * Math.PI * 2) * 48,
  }));
  const speed =
    WORMAGEDDON_TUNING.predatorSpeedStart +
    minutesSurvived * WORMAGEDDON_TUNING.predatorSpeedPerMinute;
  s.things.push({
    id: nextId(),
    material: 'predator',
    shape: { kind: 'circle', c: { x: spot.x, y: spot.y }, r: 9 },
    alive: true,
    heading: 0,
    speed,
    fleeing: 0,
    turnTimer: 0,
    route,
    routeIndex: 0,
    hunting: false,
  });
}

/** Call once per simulated frame, only while `s.wormageddon.phase === 'playing'`. */
export function stepWormageddon(s: GameState): GameEvent[] {
  const w = s.wormageddon;
  if (!w || s.status !== 'playing' || w.phase !== 'playing') return [];
  const ev: GameEvent[] = [];
  const nextId = () => w.nextThingId++;

  if (s.time >= w.nextSpawnAt) {
    spawnFood(s, nextId);
    const interval = Math.max(
      WORMAGEDDON_TUNING.spawnIntervalFloor,
      WORMAGEDDON_TUNING.spawnIntervalStart -
        s.time * WORMAGEDDON_TUNING.spawnIntervalRampPerSecond,
    );
    w.nextSpawnAt = s.time + interval;
  }

  if (s.time >= w.nextPredatorAt && w.predatorsSpawned < WORMAGEDDON_TUNING.maxPredators) {
    spawnPredator(s, nextId, s.time / 60);
    w.predatorsSpawned++;
    const interval = Math.max(
      WORMAGEDDON_TUNING.predatorIntervalFloor,
      WORMAGEDDON_TUNING.predatorIntervalStart -
        s.time * WORMAGEDDON_TUNING.predatorIntervalRampPerSecond,
    );
    w.nextPredatorAt = s.time + interval;
  }

  if (s.time >= w.nextUpgradeAt) {
    const offers = offerWormageddonUpgrades(w.taken, s.rng, 3);
    if (offers.length) {
      w.offers = offers;
      w.phase = 'upgrade';
      ev.push({ type: 'upgradeOffer' });
    }
    w.nextUpgradeAt = s.time + WORMAGEDDON_TUNING.upgradeInterval;
  }

  return ev;
}

/** Pull edible, non-dangerous things within WORM MAGNET's radius a little closer each frame. */
export function applyWormMagnet(s: GameState, dt: number): void {
  const radius = s.wormageddon?.mods.magnetRadius ?? 0;
  if (radius <= 0) return;
  const pullSpeed = 50;
  for (const t of s.things) {
    if (!t.alive || !OBJECTS[t.material].edible) continue;
    const head = t.shape.kind === 'circle' ? t.shape.c : (t.shape.points[0] as Vec);
    const d = Math.hypot(head.x - s.mole.x, head.y - s.mole.y);
    if (d <= 0 || d > radius) continue;
    const step = Math.min(d, pullSpeed * dt);
    const nx = head.x + ((s.mole.x - head.x) / d) * step;
    const ny = head.y + ((s.mole.y - head.y) / d) * step;
    if (t.shape.kind === 'circle') t.shape.c = { x: nx, y: ny };
    else t.shape.points[0] = { x: nx, y: ny };
  }
}

export function chooseWormageddonUpgrade(s: GameState, index: number): void {
  const w = s.wormageddon;
  if (!w || w.phase !== 'upgrade') return;
  const u = w.offers[index];
  if (u) {
    u.apply(w.mods);
    w.taken[u.id] = (w.taken[u.id] ?? 0) + 1;
    // STAR MEMORY changes how long marks last; the memory object holds its own copy of that
    s.memory.memory = s.character.memory * w.mods.memoryMult;
  }
  w.offers = [];
  w.phase = 'playing';
}

/** Survival time in whole seconds, for the HUD and results screen. */
export function wormageddonSeconds(s: GameState): number {
  return Math.floor(s.time);
}
