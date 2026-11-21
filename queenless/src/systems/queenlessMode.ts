import { makeGenericWorker, genericWorkerName } from '../content/characters';
import {
  colonyHealth,
  createColony,
  stepColony,
  type ColonyConfig,
  type ColonyEvent,
  type ColonyState,
  type Disturbance,
} from './colony';
import { createRng } from '../utils/rng';

// Queenless Mode: endless survival. Randomised, reproducible by seed, queenless from the start
// (there is no "the queen is gone" moment to reveal here, that's the campaign's job). The
// colony collapses if its health stays critically low for too long, rather than running to a
// fixed clock.

export const QUEENLESS_TUNING = {
  collapseHealthThreshold: 15,
  collapseGraceSeconds: 8,
  /** Disturbances get more frequent as survival time grows, floored at this interval. */
  minDisturbanceInterval: 14,
  startDisturbanceInterval: 45,
  rampSeconds: 180,
} as const;

export interface QueenlessState {
  colony: ColonyState;
  seed: number;
  lowHealthFor: number;
  nextDisturbanceAt: number;
  collapsed: boolean;
}

function randomConfig(seed: number): ColonyConfig {
  const rng = createRng(seed);
  const center = { x: 450, y: 320 };
  const flowerCount = 4 + Math.floor(rng.next() * 3);
  const broodCount = 2 + Math.floor(rng.next() * 2);
  const debrisCount = 1 + Math.floor(rng.next() * 2);
  const ring = (n: number, radius: number) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + rng.next() * 0.6;
      return { x: center.x + Math.cos(a) * radius, y: center.y + Math.sin(a) * radius };
    });
  const sites: ColonyConfig['sites'] = [
    { id: 'storage', kind: 'storage', pos: { x: 160, y: 300 } },
    ...ring(flowerCount, 320 + rng.next() * 60).map((pos, i) => ({
      id: `flower-${i}`,
      kind: 'flower' as const,
      pos,
    })),
    ...ring(broodCount, 150).map((pos, i) => ({
      id: `brood-${i}`,
      kind: 'broodCell' as const,
      pos,
    })),
    ...ring(debrisCount, 230).map((pos, i) => ({
      id: `debris-${i}`,
      kind: 'debris' as const,
      pos,
    })),
  ];
  const genericCount = 6 + Math.floor(rng.next() * 3);
  const workers: ColonyConfig['workers'] = [
    { name: 'Buzzby', traits: makeGenericWorker(-1, rng, center), isPlayer: true },
    ...Array.from({ length: genericCount }, (_, i) => ({
      name: genericWorkerName(i),
      traits: makeGenericWorker(i, rng, center),
    })),
  ];
  // Buzzby's own traits don't drive an AI (the player controls movement directly), only
  // isPlayer matters, but createColony still wants a full WorkerTraits object for him.
  return {
    workers,
    sites,
    disturbances: [],
    durationSeconds: Number.POSITIVE_INFINITY,
    startsQueenless: true,
  };
}

export function createQueenlessState(seed: number): QueenlessState {
  return {
    colony: createColony(randomConfig(seed), seed),
    seed,
    lowHealthFor: 0,
    nextDisturbanceAt: QUEENLESS_TUNING.startDisturbanceInterval,
    collapsed: false,
  };
}

function nextDisturbance(rng: ReturnType<typeof createRng>): Disturbance['kind'] {
  return rng.next() < 0.5 ? 'resourceShortage' : 'removeForagers';
}

export function stepQueenless(
  q: QueenlessState,
  input: { dx: number; dy: number },
  dt: number,
): ColonyEvent[] {
  if (q.collapsed) return [];
  const ev = stepColony(q.colony, input, dt);

  if (q.colony.time >= q.nextDisturbanceAt) {
    const t = Math.min(1, q.colony.time / QUEENLESS_TUNING.rampSeconds);
    const interval =
      QUEENLESS_TUNING.startDisturbanceInterval -
      t * (QUEENLESS_TUNING.startDisturbanceInterval - QUEENLESS_TUNING.minDisturbanceInterval);
    q.nextDisturbanceAt = q.colony.time + interval;
    applyQueenlessDisturbance(q, nextDisturbance(q.colony.rng), ev);
  }

  const health = colonyHealth(q.colony);
  if (health < QUEENLESS_TUNING.collapseHealthThreshold) q.lowHealthFor += dt;
  else q.lowHealthFor = 0;
  if (q.lowHealthFor >= QUEENLESS_TUNING.collapseGraceSeconds) {
    q.collapsed = true;
    ev.push({ type: 'done' });
  }
  return ev;
}

function applyQueenlessDisturbance(
  q: QueenlessState,
  kind: Disturbance['kind'],
  ev: ColonyEvent[],
): void {
  ev.push({ type: 'disturbance', kind });
  if (kind === 'resourceShortage') {
    for (const site of q.colony.sites) if (site.kind === 'flower') site.level *= 0.4;
  } else if (kind === 'removeForagers') {
    const foragers = q.colony.workers
      .filter((w) => !w.isPlayer && !w.removed)
      .sort((a, b) => b.traits.forageTendency - a.traits.forageTendency)
      .slice(0, 1);
    for (const w of foragers) w.removed = true;
  }
}
