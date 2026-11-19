import type {
  AbilityConfig,
  CharacterConfig,
  CloudAbility,
  CloudEffect,
  EngulfAbility,
  LockAbility,
  ReelAbility,
  StrikeAbility,
} from '../characters/types';
import { TUNING } from '../config/tuning';
import { clamp, length, type Vec2 } from '../utils/math';
import { createRng, type Rng } from '../utils/rng';
import { currentAt } from './current';
import { createFish, dampen, stepFish, vulnerability, type Arena, type Fish } from './fish';
import { expose } from './metabolic';
import { stepVelocity } from './movement';
import { createVenom, refund, stepVenom, tryUse, type AbilitySlot, type VenomState } from './venom';

/**
 * The whole hunt as plain data plus a step function: no Phaser here.
 * The scene reads this state to draw, and feeds player input in.
 * Tests run complete hunts headlessly (like running a simulation script).
 */
export interface Cloud {
  id: number;
  effect: CloudEffect;
  pos: Vec2;
  radius: number;
  age: number;
  life: number;
  potency: number;
}

export interface Tether {
  fishId: number;
  reeling: boolean;
}

export interface HuntStats {
  abilitiesUsed: number;
  strikesHit: number;
  strikesMissed: number;
  tethersBroken: number;
}

export interface HuntState {
  character: CharacterConfig;
  arena: Arena;
  seed: number;
  rng: Rng;
  time: number;
  snail: { pos: Vec2; vel: Vec2; heading: number };
  fish: Fish[];
  clouds: Cloud[];
  tether: Tether | null;
  venom: VenomState;
  captured: number;
  capturedIds: number[];
  stats: HuntStats;
  outcome: 'playing' | 'won' | 'lost';
  nextId: number;
}

export interface HuntInput {
  move: Vec2;
  aim: Vec2;
  primary: boolean;
  secondary: boolean;
  capture: boolean;
}

export type DenyReason = 'cooldown' | 'no-venom' | 'no-target';

export type HuntEvent =
  | { type: 'cloud'; effect: CloudEffect; pos: Vec2 }
  | { type: 'strike-hit'; fishId: number; from: Vec2; to: Vec2 }
  | { type: 'strike-miss'; from: Vec2; to: Vec2 }
  | { type: 'lock'; fishId: number }
  | { type: 'reel-start'; fishId: number }
  | { type: 'tether-broken'; fishId: number }
  | { type: 'capture'; fishIds: number[] }
  | { type: 'capture-miss' }
  | { type: 'denied'; slot: AbilitySlot; reason: DenyReason }
  | { type: 'won' }
  | { type: 'lost' };

export const NO_INPUT: HuntInput = {
  move: { x: 0, y: 0 },
  aim: { x: 0, y: 0 },
  primary: false,
  secondary: false,
  capture: false,
};

export function createHunt(
  character: CharacterConfig,
  seed: number,
  arena: Arena = { width: 1280, height: 720 },
): HuntState {
  const rng = createRng(seed);
  const fish: Fish[] = [];
  const { fishCount, schools } = TUNING.hunt;
  const perSchool = Math.ceil(fishCount / schools);
  for (let s = 0; s < schools; s++) {
    // School centres spread across the reef, away from the snail's start on the left.
    const centre = {
      x: rng.range(arena.width * 0.35, arena.width * 0.85),
      y: rng.range(arena.height * 0.2, arena.height * 0.8),
    };
    for (let i = 0; i < perSchool && fish.length < fishCount; i++) {
      const pos = { x: centre.x + rng.range(-50, 50), y: centre.y + rng.range(-40, 40) };
      fish.push(createFish(fish.length, s, pos, rng));
    }
  }
  return {
    character,
    arena,
    seed,
    rng,
    time: 0,
    snail: {
      pos: { x: arena.width * 0.12, y: arena.height * 0.5 },
      vel: { x: 0, y: 0 },
      heading: 0,
    },
    fish,
    clouds: [],
    tether: null,
    venom: createVenom(TUNING.venom.max, TUNING.venom.regenPerSecond),
    captured: 0,
    capturedIds: [],
    stats: { abilitiesUsed: 0, strikesHit: 0, strikesMissed: 0, tethersBroken: 0 },
    outcome: 'playing',
    nextId: 1,
  };
}

/** Advance the hunt by dt seconds. Mutates `state`; returns events for visual/audio feedback. */
export function stepHunt(state: HuntState, input: HuntInput, dt: number): HuntEvent[] {
  if (state.outcome !== 'playing') return [];
  const events: HuntEvent[] = [];
  state.time += dt;

  // Snail movement (slower while reeling in prey).
  const reeling = state.tether?.reeling === true;
  const params = { maxSpeed: state.character.snailSpeed * (reeling ? 0.3 : 1), ...TUNING.snail };
  state.snail.vel = stepVelocity(state.snail.vel, input.move, params, dt);
  state.snail.pos.x = clamp(state.snail.pos.x + state.snail.vel.x * dt, 16, state.arena.width - 16);
  state.snail.pos.y = clamp(
    state.snail.pos.y + state.snail.vel.y * dt,
    16,
    state.arena.height - 16,
  );
  if (length(state.snail.vel) > 2)
    state.snail.heading = Math.atan2(state.snail.vel.y, state.snail.vel.x);

  // Abilities.
  stepVenom(state.venom, dt);
  const slots: [AbilitySlot, boolean][] = [
    ['primary', input.primary],
    ['secondary', input.secondary],
    ['capture', input.capture],
  ];
  for (const [slot, pressed] of slots) {
    if (pressed)
      events.push(...useAbility(state, slot, state.character.abilities[slot], input.aim));
  }

  // Clouds drift with the current, spread, and fade.
  for (const c of state.clouds) {
    const flow = currentAt(c.pos, state.time);
    c.pos.x += flow.x * dt;
    c.pos.y += flow.y * dt;
    c.age += dt;
    c.radius += 4 * dt;
  }
  state.clouds = state.clouds.filter((c) => c.age < c.life);

  // Fish: exposure from clouds, then behaviour.
  const snailMotion = length(state.snail.vel) / state.character.snailSpeed;
  const bySchool = new Map<number, Fish[]>();
  for (const f of state.fish) bySchool.set(f.school, [...(bySchool.get(f.school) ?? []), f]);
  for (const f of state.fish) {
    if (f.mode === 'captured') continue;
    for (const c of state.clouds) {
      const d = Math.hypot(f.pos.x - c.pos.x, f.pos.y - c.pos.y);
      if (d >= c.radius) continue;
      const dose =
        TUNING.metabolic.uptakeRate * c.potency * (1 - c.age / c.life) * (1 - d / c.radius) * dt;
      if (c.effect === 'dampen') dampen(f, dose * 1.5);
      else expose(f, c.effect, dose);
    }
    stepFish(
      f,
      bySchool.get(f.school) ?? [],
      state.snail.pos,
      snailMotion,
      state.arena,
      state.rng,
      dt,
    );
  }

  events.push(...stepTether(state, dt));

  if (state.captured >= TUNING.hunt.objectiveCaptures) {
    state.outcome = 'won';
    events.push({ type: 'won' });
  } else if (state.time >= TUNING.hunt.timeLimitSeconds) {
    state.outcome = 'lost';
    events.push({ type: 'lost' });
  }
  return events;
}

function useAbility(
  state: HuntState,
  slot: AbilitySlot,
  ability: AbilityConfig,
  aim: Vec2,
): HuntEvent[] {
  // Abilities that need a target are checked BEFORE spending venom.
  if ((ability.kind === 'lock' || ability.kind === 'reel') && !state.tether) {
    return [{ type: 'denied', slot, reason: 'no-target' }];
  }
  const result = tryUse(state.venom, slot, ability.cost, ability.cooldown);
  if (result !== 'ok') return [{ type: 'denied', slot, reason: result }];
  state.stats.abilitiesUsed++;
  switch (ability.kind) {
    case 'cloud':
      return [releaseCloud(state, ability, aim)];
    case 'engulf':
      return [engulf(state, ability)];
    case 'strike':
      return [strike(state, ability, aim, slot)];
    case 'lock':
      return [motorLock(state, ability)];
    case 'reel':
      return [startReel(state, ability)];
  }
}

/** Place a cloud at the aim point, clamped to the ability's range from the snail. */
export function releaseCloud(state: HuntState, a: CloudAbility, aim: Vec2): HuntEvent {
  const pos = clampToRange(state.snail.pos, aim, a.range);
  state.clouds.push({
    id: state.nextId++,
    effect: a.effect,
    pos,
    radius: a.radius,
    age: 0,
    life: a.lifeSeconds,
    potency: a.potency,
  });
  return { type: 'cloud', effect: a.effect, pos: { ...pos } };
}

/** Capture vulnerable fish within the engulf radius (closest first). */
export function engulf(state: HuntState, a: EngulfAbility): HuntEvent {
  const s = state.snail.pos;
  const caught = state.fish
    .filter((f) => f.mode !== 'captured' && !f.tethered)
    .map((f) => ({ f, d: Math.hypot(f.pos.x - s.x, f.pos.y - s.y) }))
    .filter(
      ({ f, d }) =>
        d <= a.radius && vulnerability(f, a.unawareBonus) >= TUNING.capture.vulnerabilityThreshold,
    )
    .sort((p, q) => p.d - q.d)
    .slice(0, a.maxCaptures)
    .map(({ f }) => f);
  if (caught.length === 0) return { type: 'capture-miss' };
  for (const f of caught) captureFish(state, f);
  return { type: 'capture', fishIds: caught.map((f) => f.id) };
}

/** Fire the harpoon at the fish nearest the cursor (within range and aim tolerance). */
export function strike(
  state: HuntState,
  a: StrikeAbility,
  aim: Vec2,
  slot: AbilitySlot,
): HuntEvent {
  const from = { ...state.snail.pos };
  const to = clampToRange(from, aim, a.range);
  const target = state.fish
    .filter((f) => f.mode !== 'captured' && !f.tethered)
    .filter((f) => Math.hypot(f.pos.x - from.x, f.pos.y - from.y) <= a.range)
    .map((f) => ({ f, d: Math.hypot(f.pos.x - to.x, f.pos.y - to.y) }))
    .filter(({ d }) => d <= a.aimTolerance)
    .sort((p, q) => p.d - q.d)[0]?.f;
  const esc = TUNING.escape;
  if (!target) {
    state.stats.strikesMissed++;
    state.venom.cooldowns[slot] += a.missPenalty;
    startle(state, to, esc.missStartle);
    return { type: 'strike-miss', from, to };
  }
  // Even a hit alarms the rest of the school (a little less than a miss).
  startle(state, target.pos, esc.hitStartle);
  if (state.tether) releaseTether(state, false);
  target.neural = 1;
  target.tethered = true;
  target.vel = { x: 0, y: 0 };
  state.tether = { fishId: target.id, reeling: false };
  state.stats.strikesHit++;
  return { type: 'strike-hit', fishId: target.id, from, to: { ...target.pos } };
}

export function motorLock(state: HuntState, a: LockAbility): HuntEvent {
  const fish = state.fish.find((f) => f.id === state.tether?.fishId);
  if (fish) fish.lock = clamp(fish.lock + a.potency, 0, 1);
  return { type: 'lock', fishId: fish?.id ?? -1 };
}

export function startReel(state: HuntState, _a: ReelAbility): HuntEvent {
  const t = state.tether!;
  t.reeling = true;
  return { type: 'reel-start', fishId: t.fishId };
}

/** Tether rules: reel the fish in, capture on arrival; it breaks if the fish recovers or is too far. */
function stepTether(state: HuntState, dt: number): HuntEvent[] {
  const t = state.tether;
  if (!t) return [];
  const fish = state.fish.find((f) => f.id === t.fishId);
  const reel = state.character.abilities.capture;
  if (!fish || reel.kind !== 'reel') {
    state.tether = null;
    return [];
  }
  const s = state.snail.pos;
  const dx = s.x - fish.pos.x;
  const dy = s.y - fish.pos.y;
  const d = Math.hypot(dx, dy);
  if (fish.neural < TUNING.neural.immobileAbove || d > reel.tetherLength) {
    releaseTether(state, true);
    return [{ type: 'tether-broken', fishId: fish.id }];
  }
  if (t.reeling) {
    const stepLen = Math.min(d, reel.reelSpeed * dt);
    fish.pos.x += (dx / (d || 1)) * stepLen;
    fish.pos.y += (dy / (d || 1)) * stepLen;
    if (d - stepLen <= reel.captureRadius) {
      fish.tethered = false;
      state.tether = null;
      captureFish(state, fish);
      return [{ type: 'capture', fishIds: [fish.id] }];
    }
  }
  return [];
}

function releaseTether(state: HuntState, broken: boolean): void {
  const fish = state.fish.find((f) => f.id === state.tether?.fishId);
  if (fish) {
    fish.tethered = false;
    if (broken) {
      fish.awareness = 1;
      state.stats.tethersBroken++;
    }
  }
  state.tether = null;
}

function captureFish(state: HuntState, f: Fish): void {
  f.mode = 'captured';
  f.tethered = false;
  state.captured++;
  state.capturedIds.push(f.id);
  refund(state.venom, TUNING.venom.refundPerCapture);
}

function startle(state: HuntState, at: Vec2, amount: number): void {
  for (const f of state.fish) {
    if (f.mode === 'captured' || f.tethered) continue;
    if (Math.hypot(f.pos.x - at.x, f.pos.y - at.y) < TUNING.escape.startleRadius) {
      f.awareness = Math.max(f.awareness, amount * f.responsiveness);
    }
  }
}

function clampToRange(from: Vec2, aim: Vec2, range: number): Vec2 {
  const offset = { x: aim.x - from.x, y: aim.y - from.y };
  const d = length(offset);
  const k = d > range ? range / d : 1;
  return { x: from.x + offset.x * k, y: from.y + offset.y * k };
}

/** Whether a fish should show the "catchable" marker for this character. */
export function isCatchable(state: HuntState, f: Fish): boolean {
  const cap = state.character.abilities.capture;
  if (f.mode === 'captured') return false;
  if (cap.kind === 'reel') return f.tethered;
  if (cap.kind === 'engulf')
    return vulnerability(f, cap.unawareBonus) >= TUNING.capture.vulnerabilityThreshold;
  return false;
}
