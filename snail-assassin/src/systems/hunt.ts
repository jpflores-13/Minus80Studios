import type {
  AbilityConfig,
  BurstAbility,
  CamouflageAbility,
  CharacterConfig,
  CloudAbility,
  CloudEffect,
  EngulfAbility,
  LockAbility,
  PursuitAbility,
  ReelAbility,
  StrikeAbility,
} from '../characters/types';
import { TUNING } from '../config/tuning';
import { clamp, length, type Vec2 } from '../utils/math';
import { createRng, type Rng } from '../utils/rng';
import { currentAt } from './current';
import {
  createFish,
  dampen,
  stepFish,
  vulnerability,
  type Arena,
  type Fish,
  type PreyTuning,
} from './fish';
import { expose } from './metabolic';
import { stepVelocity } from './movement';
import { createPredator, stepPredator, wrap, type Predator, type PredatorTuning } from './predator';
import { createVenom, refund, stepVenom, tryUse, type AbilitySlot, type VenomState } from './venom';

// The hunt as plain data plus a step function. No Phaser in here, so whole hunts can run in tests.
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

/** Glaucus's in-progress chase (see PursuitAbility, stepPursuit). */
export interface Pursuit {
  fishId: number;
  /** The chase fails if the target isn't caught before this time (HuntState.time). */
  until: number;
}

export interface HuntStats {
  abilitiesUsed: number;
  strikesHit: number;
  strikesMissed: number;
  tethersBroken: number;
  timesGrabbed: number;
}

export interface HuntState {
  character: CharacterConfig;
  arena: Arena;
  seed: number;
  rng: Rng;
  time: number;
  snail: { pos: Vec2; vel: Vec2; heading: number; stunned: number };
  predator: Predator;
  /**
   * Extra pod members when `character.threat === 'orca'` (empty otherwise). `predator` above is
   * always the pod's first member, so `[predator, ...pack]` is the whole pod — see `TUNING.orcaPod`
   * and the pack-coordination step in `stepHunt`.
   */
  pack: Predator[];
  fish: Fish[];
  clouds: Cloud[];
  tether: Tether | null;
  /** Cipher only: seconds remaining on an active Camouflage window (0 = not camouflaged). */
  camouflage: number;
  /** Glaucus only: an in-progress chase started by Pursuit (see stepPursuit). */
  pursuit: Pursuit | null;
  venom: VenomState;
  captured: number;
  capturedIds: number[];
  stats: HuntStats;
  options: HuntOptions;
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
  | { type: 'camouflage-on' }
  | { type: 'camouflage-off' }
  | { type: 'pursuit-start'; fishId: number }
  | { type: 'pursuit-miss' }
  | { type: 'pursuit-catch'; fishId: number }
  | { type: 'pursuit-lost'; fishId: number }
  | { type: 'burst' }
  | { type: 'predator-chase' }
  | { type: 'grabbed' }
  | { type: 'won' }
  | { type: 'lost' };

export const NO_INPUT: HuntInput = {
  move: { x: 0, y: 0 },
  aim: { x: 0, y: 0 },
  primary: false,
  secondary: false,
  capture: false,
};

export interface HuntOptions {
  /** Relaxed mode: no time limit, and the threat (octopus or shark) never grabs. */
  relaxed: boolean;
}

export function createHunt(
  character: CharacterConfig,
  seed: number,
  arena: Arena = { width: 1280, height: 720 },
  options: HuntOptions = { relaxed: false },
): HuntState {
  const rng = createRng(seed);
  const fish: Fish[] = [];
  const pt = preyTuning(character);
  if (character.prey === 'snail' || character.prey === 'squid') {
    // Cone snails are confirmed solitary foragers, and the blue shark's documented squid prey
    // are mostly non-schooling deep-water species (see docs/SCIENCE.md), so each one is its own
    // "school" of one. schoolingSteer() then naturally has no one to cohere/separate with.
    const { scatteredPreyCount } = TUNING.hunt;
    for (let i = 0; i < scatteredPreyCount; i++) {
      fish.push(createFish(i, i, scatteredPoint(arena, rng), rng, pt));
    }
  } else {
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
        fish.push(createFish(fish.length, s, pos, rng, pt));
      }
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
      stunned: 0,
    },
    predator: createPredator(arena, rng),
    pack:
      character.threat === 'orca'
        ? Array.from({ length: TUNING.orcaPod.size - 1 }, () => createPredator(arena, rng))
        : [],
    fish,
    clouds: [],
    tether: null,
    camouflage: 0,
    pursuit: null,
    venom: createVenom(TUNING.venom.max, TUNING.venom.regenPerSecond),
    captured: 0,
    capturedIds: [],
    stats: { abilitiesUsed: 0, strikesHit: 0, strikesMissed: 0, tethersBroken: 0, timesGrabbed: 0 },
    outcome: 'playing',
    options,
    nextId: 1,
  };
}

/** Advance the hunt by dt seconds. Mutates `state`; returns events for visual/audio feedback. */
export function stepHunt(state: HuntState, input: HuntInput, dt: number): HuntEvent[] {
  if (state.outcome !== 'playing') return [];
  const events: HuntEvent[] = [];
  state.time += dt;

  // Player movement. Slower while reeling in prey or camouflaged (Cipher), faster while
  // pursuing (Glaucus); frozen while stunned by the threat.
  const snail = state.snail;
  snail.stunned = Math.max(0, snail.stunned - dt);
  const reeling = state.tether?.reeling === true;
  const camo = abilityOfKind(state.character, 'camouflage');
  const camouflaged = camo !== undefined && state.camouflage > 0;
  const pursuitAbility = abilityOfKind(state.character, 'pursuit');
  const pursuing = pursuitAbility !== undefined && state.pursuit !== null;
  let speedMultiplier = 1;
  if (reeling) speedMultiplier = 0.3;
  else if (camouflaged && camo) speedMultiplier = camo.speedMultiplier;
  else if (pursuing && pursuitAbility) speedMultiplier = pursuitAbility.chaseSpeedMultiplier;
  const params = { maxSpeed: state.character.speed * speedMultiplier, ...TUNING.snail };
  const move = snail.stunned > 0 ? { x: 0, y: 0 } : input.move;
  snail.vel = stepVelocity(snail.vel, move, params, dt);
  snail.pos.x = wrap(snail.pos.x + snail.vel.x * dt, state.arena.width);
  snail.pos.y = wrap(snail.pos.y + snail.vel.y * dt, state.arena.height);
  if (length(snail.vel) > 2) snail.heading = Math.atan2(snail.vel.y, snail.vel.x);

  // Camouflage countdown: ends on its own, or the instant a strike/pursuit ability fires (see
  // useAbility) — a sudden lunge reveals the octopus either way.
  if (camo) {
    const was = state.camouflage > 0;
    state.camouflage = Math.max(0, state.camouflage - dt);
    if (was && state.camouflage <= 0) events.push({ type: 'camouflage-off' });
  }

  // The same motion signal both the threat's sightRadius detection and nearby prey's awareness
  // key off (see stepPredator, stepAwareness). While camouflaged, Cipher's real movement barely
  // registers on it — see CamouflageAbility.detectionMultiplier.
  const motionRatio = length(snail.vel) / state.character.speed;
  const motionSignal = camouflaged && camo ? motionRatio * camo.detectionMultiplier : motionRatio;

  // Abilities.
  stepVenom(state.venom, dt);
  const slots: [AbilitySlot, boolean][] = [
    ['primary', input.primary],
    ['secondary', input.secondary],
    ['capture', input.capture],
  ];
  for (const [slot, pressed] of slots) {
    if (pressed && snail.stunned <= 0)
      events.push(...useAbility(state, slot, state.character.abilities[slot], input.aim));
  }

  // Clouds drift with the current, spread, and fade.
  for (const c of state.clouds) {
    const flow = currentAt(c.pos, state.time);
    c.pos.x = wrap(c.pos.x + flow.x * dt, state.arena.width);
    c.pos.y = wrap(c.pos.y + flow.y * dt, state.arena.height);
    c.age += dt;
    c.radius += 4 * dt;
  }
  state.clouds = state.clouds.filter((c) => c.age < c.life);

  // Fish: exposure from clouds, then behaviour.
  const pt = preyTuning(state.character);
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
      motionSignal,
      state.arena,
      state.rng,
      dt,
      pt,
    );
  }

  events.push(...stepTether(state, dt));
  events.push(...stepPursuit(state, dt));

  // The threat: the octopus, the shark (when playing as the octopus), or the orca pod (when
  // playing as the blue shark). `pack` is empty outside the orca tier, so this loop behaves
  // exactly as a single threat for every other character.
  const threat = threatTuning(state.character);
  const pod = [state.predator, ...state.pack];
  const wasChasing = pod.some((m) => m.mode === 'chase');
  let grabbed = false;
  for (const m of pod) {
    // Pack coordination: once any pod member is chasing, the others are alerted toward the
    // player too, echoing the cooperative, coordinated hunting documented in real orca pods
    // (see docs/SCIENCE.md) without claiming a specific signalling mechanism. A no-op for a
    // lone threat, since there's nothing else in `pod` to alert.
    if (wasChasing && m.mode === 'patrol') {
      m.awareness = clamp(m.awareness + TUNING.orcaPod.alertGain * dt, 0, 1);
    }
    if (stepPredator(m, snail.pos, motionSignal, state.arena, state.rng, dt, threat))
      grabbed = true;
  }
  const isChasingNow = pod.some((m) => m.mode === 'chase');
  if (grabbed && !state.options.relaxed) {
    snail.stunned = threat.stunSeconds;
    snail.vel = { x: 0, y: 0 };
    state.venom.reserve = Math.max(0, state.venom.reserve - threat.venomLost);
    if (state.tether) releaseTether(state, true);
    state.camouflage = 0;
    state.pursuit = null;
    state.stats.timesGrabbed++;
    events.push({ type: 'grabbed' });
  } else if (!wasChasing && isChasingNow) {
    events.push({ type: 'predator-chase' });
  }

  if (state.captured >= TUNING.hunt.objectiveCaptures) {
    state.outcome = 'won';
    events.push({ type: 'won' });
  } else if (!state.options.relaxed && state.time >= TUNING.hunt.timeLimitSeconds) {
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
  if (ability.kind === 'burst' && !state.pursuit) {
    return [{ type: 'denied', slot, reason: 'no-target' }];
  }
  const result = tryUse(state.venom, slot, ability.cost, ability.cooldown);
  if (result !== 'ok') return [{ type: 'denied', slot, reason: result }];
  state.stats.abilitiesUsed++;
  // A lunge (Cipher's Pounce, Glaucus's Pursuit) reveals the octopus even if camouflaged.
  if (ability.kind === 'strike' || ability.kind === 'pursuit') state.camouflage = 0;
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
    case 'camouflage':
      return [activateCamouflage(state, ability)];
    case 'pursuit':
      return [beginPursuit(state, ability, slot)];
    case 'burst':
      return [extendPursuit(state, ability)];
  }
}

/** Find this character's ability of a given kind, wherever it lives among its three slots
 *  (primary/secondary/capture). Returns undefined for characters that don't have one. */
function abilityOfKind<K extends AbilityConfig['kind']>(
  character: CharacterConfig,
  kind: K,
): Extract<AbilityConfig, { kind: K }> | undefined {
  const { primary, secondary, capture } = character.abilities;
  return [primary, secondary, capture].find(
    (a): a is Extract<AbilityConfig, { kind: K }> => a.kind === kind,
  );
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
  if (a.instantGrip) target.lock = 1;
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

/** Camouflage (Cipher): start (or refresh) the stealth window. See CamouflageAbility and the
 *  motion-signal dampening in stepHunt. */
export function activateCamouflage(state: HuntState, a: CamouflageAbility): HuntEvent {
  state.camouflage = a.durationSeconds;
  return { type: 'camouflage-on' };
}

/** Pursuit (Glaucus): lock onto the nearest live, untethered squid in range and start a
 *  time-limited chase (see stepPursuit). No cursor aim check, unlike a strike. */
export function beginPursuit(state: HuntState, a: PursuitAbility, slot: AbilitySlot): HuntEvent {
  if (state.tether) releaseTether(state, false);
  const s = state.snail.pos;
  const target = state.fish
    .filter((f) => f.mode !== 'captured' && !f.tethered)
    .map((f) => ({ f, d: Math.hypot(f.pos.x - s.x, f.pos.y - s.y) }))
    .filter(({ d }) => d <= a.range)
    .sort((p, q) => p.d - q.d)[0]?.f;
  if (!target) {
    state.venom.cooldowns[slot] += a.missPenalty;
    return { type: 'pursuit-miss' };
  }
  startle(state, target.pos, TUNING.escape.hitStartle);
  state.pursuit = { fishId: target.id, until: state.time + a.durationSeconds };
  return { type: 'pursuit-start', fishId: target.id };
}

/** Burst (Glaucus): buy more time on an in-progress chase. Needs an active pursuit — denied
 *  otherwise (see the pre-check in useAbility). */
export function extendPursuit(state: HuntState, a: BurstAbility): HuntEvent {
  state.pursuit!.until += a.extraSeconds;
  return { type: 'burst' };
}

/** Pursuit rules (Glaucus): the chase ends in a catch — tethered exactly like a strike hit, see
 *  stepTether — if the snail reaches grabRadius before the window closes, or a lost chase
 *  otherwise. A caught fish is immediately fully restrained (neural = lock = 1): for a pursuit
 *  predator, closing the distance is the hard part, not holding on afterward, so there's no
 *  separate lock step (see docs/SCIENCE.md). */
function stepPursuit(state: HuntState, _dt: number): HuntEvent[] {
  const p = state.pursuit;
  if (!p) return [];
  const fish = state.fish.find((f) => f.id === p.fishId);
  if (!fish || fish.mode === 'captured') {
    state.pursuit = null;
    return [];
  }
  if (state.time >= p.until) {
    state.pursuit = null;
    return [{ type: 'pursuit-lost', fishId: fish.id }];
  }
  const grabRadius = abilityOfKind(state.character, 'pursuit')?.grabRadius ?? 0;
  const d = Math.hypot(fish.pos.x - state.snail.pos.x, fish.pos.y - state.snail.pos.y);
  if (d <= grabRadius) {
    fish.neural = 1;
    fish.lock = 1;
    fish.tethered = true;
    state.tether = { fishId: fish.id, reeling: false };
    state.pursuit = null;
    return [{ type: 'pursuit-catch', fishId: fish.id }];
  }
  return [];
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

/** Which threat tuning applies to this character (see CharacterConfig.threat). */
export function threatTuning(character: CharacterConfig): PredatorTuning {
  if (character.threat === 'shark') return TUNING.shark;
  if (character.threat === 'orca') return TUNING.orca;
  return TUNING.predator;
}

/** Which prey locomotion/schooling tuning applies to this character (see CharacterConfig.prey). */
export function preyTuning(character: CharacterConfig): PreyTuning {
  if (character.prey === 'snail') return TUNING.snailPrey;
  if (character.prey === 'squid') return TUNING.squidPrey;
  return TUNING.fish;
}

/** A scattered individual's spot on the reef: spread widely, away from the snail's start edge. */
function scatteredPoint(arena: Arena, rng: Rng): Vec2 {
  return {
    x: rng.range(arena.width * 0.22, arena.width * 0.96),
    y: rng.range(arena.height * 0.08, arena.height * 0.92),
  };
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
