import { TUNING } from '../config/tuning';
import type { LevelConfig } from '../levels/types';
import { clamp } from '../utils/math';
import { createRng, type Rng } from '../utils/rng';
import type { Deployment } from './equipment';
import { createLitter, transition, type LitterCategory, type LitterItem } from './litter';
import { lateralSpeedFactor, segmentLength, type Segment } from './network';

/**
 * Watershed transport simulation: pure data + step function, no Phaser.
 * Runs on a fixed time step with a seeded RNG, so the same level, seed, and
 * deployment always produce the same outcome (reproducible playtests and tests).
 */
export interface TrapState {
  slotId: string;
  segmentId: string;
  s: number;
  coverage: number;
  count: number;
  capacity: number;
}

export interface SimState {
  level: LevelConfig;
  deployment: Deployment;
  rng: Rng;
  time: number;
  items: LitterItem[];
  traps: TrapState[];
  sourceAccumulators: Record<string, number>;
  segments: Map<string, Segment & { length: number }>;
  nextId: number;
  pending: number;
  done: boolean;
}

export type SimEvent =
  | { type: 'intercepted'; slotId: string; itemId: number }
  | { type: 'prevented'; sourceId: string }
  | { type: 'trap-full'; slotId: string }
  | { type: 'escaped'; itemId: number }
  | { type: 'done' };

export function createSim(level: LevelConfig, deployment: Deployment, seed = level.seed): SimState {
  const state: SimState = {
    level,
    deployment,
    rng: createRng(seed),
    time: 0,
    items: [],
    traps: [],
    sourceAccumulators: Object.fromEntries(level.sources.map((s) => [s.id, 0])),
    segments: new Map(level.segments.map((s) => [s.id, { ...s, length: segmentLength(s) }])),
    nextId: 1,
    pending: 0,
    done: false,
  };
  syncTraps(state);
  return state;
}

/** Call after placing equipment mid-flow so new traps start working. */
export function syncTraps(state: SimState): void {
  for (const [slotId, kind] of Object.entries(state.deployment)) {
    if (kind !== 'trap' || state.traps.some((t) => t.slotId === slotId)) continue;
    const slot = state.level.slots.find((s) => s.id === slotId);
    if (!slot?.segmentId || slot.s === undefined) continue;
    state.traps.push({
      slotId,
      segmentId: slot.segmentId,
      s: slot.s,
      coverage: slot.coverage ?? 0.8,
      count: 0,
      capacity: TUNING.trap.capacity,
    });
  }
}

/** Advance by real elapsed time using fixed sub-steps (frame-rate independent). */
export function advance(state: SimState, dt: number): SimEvent[] {
  const events: SimEvent[] = [];
  const h = TUNING.sim.fixedStep;
  state.pending += dt;
  while (state.pending >= h && !state.done) {
    state.pending -= h;
    events.push(...step(state, h));
  }
  return events;
}

function step(state: SimState, dt: number): SimEvent[] {
  const events: SimEvent[] = [];
  state.time += dt;
  const { level } = state;

  if (state.time <= level.generationSeconds) {
    for (const src of level.sources) {
      state.sourceAccumulators[src.id] = (state.sourceAccumulators[src.id] ?? 0) + src.rate * dt;
      while ((state.sourceAccumulators[src.id] ?? 0) >= 1) {
        state.sourceAccumulators[src.id] = (state.sourceAccumulators[src.id] ?? 0) - 1;
        const item = createLitter(state.nextId++, src.id, pickCategory(state.rng), state.time);
        state.items.push(item);
        if (hasBin(state, src.id) && state.rng.next() < TUNING.bin.effectiveness) {
          transition(item, 'prevented', state.time);
          events.push({ type: 'prevented', sourceId: src.id });
        } else {
          transition(item, 'onLand', state.time);
          item.landTimer = state.rng.range(TUNING.runoff.delayMin, TUNING.runoff.delayMax);
          item.segmentId = src.entry.segmentId;
          item.s = src.entry.s;
        }
      }
    }
  }

  for (const item of state.items) {
    if (item.state === 'onLand') {
      item.landTimer -= dt;
      if (item.landTimer <= 0) {
        transition(item, 'floating', state.time);
        item.lateral = state.rng.range(-1, 1);
      }
    } else if (item.state === 'floating') {
      events.push(...moveFloating(state, item, dt));
    }
  }

  if (state.time >= level.durationSeconds) {
    state.done = true;
    events.push({ type: 'done' });
  }
  return events;
}

function moveFloating(state: SimState, item: LitterItem, dt: number): SimEvent[] {
  const seg = state.segments.get(item.segmentId);
  if (!seg) return [];
  const before = item.s;
  item.s += seg.speed * lateralSpeedFactor(item.lateral) * dt;
  item.lateral = clamp(
    item.lateral + state.rng.range(-1, 1) * TUNING.transport.lateralDiffusion * Math.sqrt(dt),
    -1,
    1,
  );

  for (const trap of state.traps) {
    if (trap.segmentId !== seg.id || !(before < trap.s && item.s >= trap.s)) continue;
    if (Math.abs(item.lateral) > trap.coverage) continue; // slipped past along the bank
    if (trap.count >= trap.capacity) continue; // full: overflow bypasses
    transition(item, 'intercepted', state.time);
    trap.count++;
    const events: SimEvent[] = [{ type: 'intercepted', slotId: trap.slotId, itemId: item.id }];
    if (trap.count === trap.capacity) events.push({ type: 'trap-full', slotId: trap.slotId });
    return events;
  }

  if (item.s >= seg.length) {
    if (seg.downstream === null) {
      transition(item, 'escaped', state.time);
      return [{ type: 'escaped', itemId: item.id }];
    }
    item.s -= seg.length;
    item.segmentId = seg.downstream;
  }
  return [];
}

function hasBin(state: SimState, sourceId: string): boolean {
  return state.level.slots.some(
    (s) => s.kind === 'bin' && s.sourceId === sourceId && state.deployment[s.id] === 'bin',
  );
}

function pickCategory(rng: Rng): LitterCategory {
  const r = rng.next();
  const { bottle, bag } = TUNING.litterMix;
  return r < bottle ? 'bottle' : r < bottle + bag ? 'bag' : 'wrapper';
}

/** Run a whole level headlessly (for tests and balance checks). */
export function runToEnd(level: LevelConfig, deployment: Deployment, seed = level.seed): SimState {
  const state = createSim(level, deployment, seed);
  while (!state.done) advance(state, 0.25);
  return state;
}
