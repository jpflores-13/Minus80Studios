import { TUNING } from '../config/tuning';
import type { Hotspot, LevelConfig } from '../levels/types';
import { clamp } from '../utils/math';
import { createRng, type Rng } from '../utils/rng';
import type { ActionsUsed, Deployment, Orientations } from './equipment';
import { createLitter, transition, type LitterCategory, type LitterItem } from './litter';
import { lateralSpeedFactor, segmentLength, type Segment } from './network';
import { conditionsAt, flowFactor, remobilizeFactor, washRate, type Conditions } from './weather';

// Watershed simulation. Fixed time step and a seeded RNG, so the same setup always
// gives the same result. No Phaser in here.
export interface Container {
  slotId: string;
  kind: 'trap' | 'filter';
  count: number;
  capacity: number;
  /** Traps: position and channel span. Filters: the source whose drain they cover. */
  segmentId?: string;
  s?: number;
  offset?: number;
  coverage?: number;
  sourceId?: string;
}

export type SegmentInfo = Segment & { length: number };

export interface SimState {
  level: LevelConfig;
  deployment: Deployment;
  orientations: Orientations;
  used: ActionsUsed;
  rng: Rng;
  time: number;
  items: LitterItem[];
  containers: Container[];
  sourceAccumulators: Record<string, number>;
  segments: Map<string, SegmentInfo>;
  conditions: Conditions;
  nextId: number;
  pending: number;
  done: boolean;
  /** Source ids switched to reusables: their generation rate is cut for the rest of the level. */
  reusables: Set<string>;
}

export type SimEvent =
  | { type: 'intercepted'; slotId: string; itemId: number }
  | { type: 'prevented'; sourceId: string }
  | { type: 'full'; slotId: string }
  | { type: 'retained'; hotspotId: string }
  | { type: 'remobilized'; hotspotId: string }
  | { type: 'escaped'; itemId: number }
  | { type: 'weather'; conditions: Conditions }
  | { type: 'done' };

export interface SimOptions {
  seed?: number;
  orientations?: Orientations;
  reusables?: Set<string>;
}

export function createSim(
  level: LevelConfig,
  deployment: Deployment,
  opts: SimOptions = {},
): SimState {
  const state: SimState = {
    level,
    deployment,
    orientations: opts.orientations ?? {},
    used: {},
    rng: createRng(opts.seed ?? level.seed),
    time: 0,
    items: [],
    containers: [],
    sourceAccumulators: Object.fromEntries(level.sources.map((s) => [s.id, 0])),
    segments: segmentMap(level),
    conditions: 'dry',
    nextId: 1,
    pending: 0,
    done: false,
    reusables: opts.reusables ?? new Set(),
  };
  syncEquipment(state);
  return state;
}

export function segmentMap(level: LevelConfig): Map<string, SegmentInfo> {
  return new Map(level.segments.map((s) => [s.id, { ...s, length: segmentLength(s) }]));
}

/** Call after placing equipment mid-flow so new traps and filters start working. */
export function syncEquipment(state: SimState): void {
  for (const [slotId, kind] of Object.entries(state.deployment)) {
    if ((kind !== 'trap' && kind !== 'filter') || state.containers.some((c) => c.slotId === slotId))
      continue;
    const slot = state.level.slots.find((s) => s.id === slotId);
    if (!slot) continue;
    state.containers.push(
      kind === 'trap'
        ? {
            slotId,
            kind,
            count: 0,
            capacity: TUNING.trap.capacity,
            segmentId: slot.segmentId ?? '',
            s: slot.s ?? 0,
            offset: slot.offset ?? 0,
            coverage: slot.coverage ?? 0.8,
          }
        : {
            slotId,
            kind,
            count: 0,
            capacity: TUNING.filter.capacity,
            sourceId: slot.sourceId ?? '',
          },
    );
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

  const cond = conditionsAt(level, state.time);
  if (cond !== state.conditions) {
    state.conditions = cond;
    events.push({ type: 'weather', conditions: cond });
  }

  if (state.time <= level.generationSeconds) generate(state, dt, events);

  for (const item of state.items) {
    if (item.state === 'onLand') {
      // Litter only washes off the land when it rains.
      const src = state.level.sources.find((x) => x.id === item.sourceId);
      if (src && state.rng.next() < washRate(cond, src.runoffResponse) * dt)
        runoff(state, item, events);
    } else if (item.state === 'floating') {
      moveFloating(state, item, dt, events);
    } else if (item.state === 'retained') {
      const p = TUNING.retention.remobilizePerSecond * remobilizeFactor(cond) * dt;
      if (state.rng.next() < p) {
        const hotspotId = item.holder;
        transition(item, 'floating', state.time);
        events.push({ type: 'remobilized', hotspotId });
      }
    }
  }

  if (state.time >= level.durationSeconds) {
    state.done = true;
    events.push({ type: 'done' });
  }
  return events;
}

function generate(state: SimState, dt: number, events: SimEvent[]): void {
  for (const src of state.level.sources) {
    const rate = src.rate * (state.reusables.has(src.id) ? TUNING.reusables.rateMultiplier : 1);
    let acc = (state.sourceAccumulators[src.id] ?? 0) + rate * dt;
    while (acc >= 1) {
      acc -= 1;
      const item = createLitter(
        state.nextId++,
        src.id,
        pickCategory(state.rng, src.look),
        state.time,
      );
      state.items.push(item);
      if (hasSlotEquipment(state, 'bin', src.id) && state.rng.next() < TUNING.bin.effectiveness) {
        transition(item, 'prevented', state.time);
        events.push({ type: 'prevented', sourceId: src.id });
      } else {
        transition(item, 'onLand', state.time);
        item.segmentId = src.entry.segmentId;
        item.s = src.entry.s;
      }
    }
    state.sourceAccumulators[src.id] = acc;
  }
}

/** Runoff reaches the storm drain: a filter may catch it; otherwise it enters the creek. */
function runoff(state: SimState, item: LitterItem, events: SimEvent[]): void {
  const filter = state.containers.find((c) => c.kind === 'filter' && c.sourceId === item.sourceId);
  if (filter && filter.count < filter.capacity && state.rng.next() < TUNING.filter.efficiency) {
    transition(item, 'intercepted', state.time, filter.slotId);
    filter.count++;
    events.push({ type: 'intercepted', slotId: filter.slotId, itemId: item.id });
    if (filter.count === filter.capacity) events.push({ type: 'full', slotId: filter.slotId });
    return;
  }
  transition(item, 'floating', state.time);
  item.lateral = state.rng.range(-1, 1);
}

function moveFloating(state: SimState, item: LitterItem, dt: number, events: SimEvent[]): void {
  const seg = state.segments.get(item.segmentId);
  if (!seg) return;
  const before = item.s;
  const speed = seg.speed * flowFactor(state.conditions) * lateralSpeedFactor(item.lateral);
  item.s += speed * dt;
  item.lateral = clamp(
    item.lateral + state.rng.range(-1, 1) * TUNING.transport.lateralDiffusion * Math.sqrt(dt),
    -1,
    1,
  );
  const crossed = (s: number) => before < s && item.s >= s;

  // Booms steer debris toward one bank (they don't remove anything by themselves).
  for (const slot of state.level.slots) {
    if (slot.kind !== 'boom' || slot.segmentId !== seg.id || state.deployment[slot.id] !== 'boom')
      continue;
    if (slot.s === undefined || !crossed(slot.s)) continue;
    const target = (state.orientations[slot.id] ?? 1) * TUNING.boom.target;
    item.lateral += (target - item.lateral) * TUNING.boom.steering;
  }

  // Traps catch debris that passes within their span, until full.
  for (const trap of state.containers) {
    if (
      trap.kind !== 'trap' ||
      trap.segmentId !== seg.id ||
      trap.s === undefined ||
      !crossed(trap.s)
    )
      continue;
    if (Math.abs(item.lateral - (trap.offset ?? 0)) > (trap.coverage ?? 0.8)) continue;
    if (trap.count >= trap.capacity) continue;
    transition(item, 'intercepted', state.time, trap.slotId);
    trap.count++;
    events.push({ type: 'intercepted', slotId: trap.slotId, itemId: item.id });
    if (trap.count === trap.capacity) events.push({ type: 'full', slotId: trap.slotId });
    return;
  }

  // Bank features (fallen logs, reeds, eddies) can snag passing debris.
  for (const h of state.level.hotspots) {
    if (h.segmentId !== seg.id || item.s < h.sFrom || item.s > h.sTo) continue;
    if (item.lateral * h.side < TUNING.retention.bankBand) continue;
    if (state.rng.next() < TUNING.retention.retainPerSecond * dt) {
      transition(item, 'retained', state.time, h.id);
      events.push({ type: 'retained', hotspotId: h.id });
      return;
    }
  }

  if (item.s >= seg.length) {
    if (seg.downstream === null) {
      transition(item, 'escaped', state.time);
      events.push({ type: 'escaped', itemId: item.id });
      return;
    }
    item.s -= seg.length;
    item.segmentId = seg.downstream;
  }
}

function hasSlotEquipment(state: SimState, kind: 'bin', sourceId: string): boolean {
  return state.level.slots.some(
    (s) => s.kind === kind && s.sourceId === sourceId && state.deployment[s.id] === kind,
  );
}

function pickCategory(rng: Rng, look: string): LitterCategory {
  const mix = TUNING.litterMix[look as keyof typeof TUNING.litterMix] ?? TUNING.litterMix.default;
  let r = rng.next();
  for (const [kind, share] of Object.entries(mix) as [LitterCategory, number][]) {
    if (r < share) return kind;
    r -= share;
  }
  return 'wrapper';
}

// ── Cleanup crews ─────────────────────────────────────────────────────────────

export type CleanupTarget =
  { kind: 'container'; slotId: string } | { kind: 'hotspot'; hotspotId: string };

/**
 * Use one cleanup action: empty a trap/filter (intercepted → removed, capacity restored)
 * or clear a hotspot (retained → removed). Returns the number of items removed, or
 * null if no cleanup action is left or the target is invalid.
 */
export function cleanup(state: SimState, target: CleanupTarget): number | null {
  const left = (state.level.inventory.cleanup ?? 0) - (state.used.cleanup ?? 0);
  if (left <= 0) return null;
  let removed = 0;
  if (target.kind === 'container') {
    const c = state.containers.find((x) => x.slotId === target.slotId);
    if (!c) return null;
    for (const item of state.items) {
      if (item.state === 'intercepted' && item.holder === c.slotId) {
        transition(item, 'removed', state.time);
        removed++;
      }
    }
    c.count = 0;
  } else {
    const h: Hotspot | undefined = state.level.hotspots.find((x) => x.id === target.hotspotId);
    if (!h) return null;
    for (const item of state.items) {
      if (item.state === 'retained' && item.holder === h.id) {
        transition(item, 'removed', state.time);
        removed++;
      }
    }
  }
  state.used.cleanup = (state.used.cleanup ?? 0) + 1;
  return removed;
}

// ── Headless runs (tests, balancing) ─────────────────────────────────────────

export interface Strategy {
  deployment: Deployment;
  orientations?: Orientations;
  cleanups?: { at: number; target: CleanupTarget }[];
  // Called every quarter second; return a target to use a cleanup action.
  policy?: (state: SimState) => CleanupTarget | null;
}

// A sensible default for tests and balancing: empty full traps/filters, and near the
// end send the last crew to whichever snag is holding the most litter.
export function simpleCleanupPolicy(state: SimState): CleanupTarget | null {
  const full = state.containers.find((c) => c.count >= c.capacity);
  if (full) return { kind: 'container', slotId: full.slotId };
  if (state.time < state.level.durationSeconds - 6) return null;
  let best: { id: string; n: number } | null = null;
  for (const h of state.level.hotspots) {
    const n = state.items.filter((i) => i.state === 'retained' && i.holder === h.id).length;
    if (n > 0 && (!best || n > best.n)) best = { id: h.id, n };
  }
  return best ? { kind: 'hotspot', hotspotId: best.id } : null;
}

export function runToEnd(
  level: LevelConfig,
  strategy: Strategy | Deployment,
  seed = level.seed,
): SimState {
  const s: Strategy =
    'deployment' in strategy ? (strategy as Strategy) : { deployment: strategy as Deployment };
  const state = createSim(level, { ...s.deployment }, { seed, orientations: s.orientations ?? {} });
  const plan = [...(s.cleanups ?? [])].sort((a, b) => a.at - b.at);
  while (!state.done) {
    advance(state, 0.25);
    while (plan.length > 0 && plan[0]!.at <= state.time) cleanup(state, plan.shift()!.target);
    const target = s.policy?.(state);
    if (target) cleanup(state, target);
  }
  return state;
}
