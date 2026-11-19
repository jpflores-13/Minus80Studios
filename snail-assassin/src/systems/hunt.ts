import type {
  AbilityConfig,
  CharacterConfig,
  CloudAbility,
  CloudEffect,
  EngulfAbility,
} from '../characters/types';
import { TUNING } from '../config/tuning';
import { clamp, length, type Vec2 } from '../utils/math';
import { createRng, type Rng } from '../utils/rng';
import { currentAt } from './current';
import { createFish, stepFish, vulnerability, type Arena, type Fish } from './fish';
import { expose } from './metabolic';
import { stepVelocity } from './movement';
import { createVenom, refund, stepVenom, tryUse, type AbilitySlot, type VenomState } from './venom';

/**
 * The whole hunt as plain data plus a step function: no Phaser here.
 * The scene reads this state to draw, and feeds player input in.
 * Tests can run complete hunts headlessly (like running a simulation script).
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

export interface HuntState {
  character: CharacterConfig;
  arena: Arena;
  rng: Rng;
  time: number;
  snail: { pos: Vec2; vel: Vec2; heading: number };
  fish: Fish[];
  clouds: Cloud[];
  venom: VenomState;
  captured: number;
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

export type HuntEvent =
  | { type: 'cloud'; effect: CloudEffect; pos: Vec2 }
  | { type: 'capture'; fishIds: number[] }
  | { type: 'capture-miss' }
  | { type: 'denied'; slot: AbilitySlot; reason: 'cooldown' | 'no-venom' }
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
  for (let s = 0; s < schools; s++) {
    // School centres spread across the upper and right reef, away from the snail's start.
    const centre = {
      x: rng.range(arena.width * 0.35, arena.width * 0.85),
      y: rng.range(arena.height * 0.2, arena.height * 0.8),
    };
    const perSchool = Math.ceil(fishCount / schools);
    for (let i = 0; i < perSchool && fish.length < fishCount; i++) {
      const pos = { x: centre.x + rng.range(-50, 50), y: centre.y + rng.range(-40, 40) };
      fish.push(createFish(fish.length, s, pos, rng));
    }
  }
  return {
    character,
    arena,
    rng,
    time: 0,
    snail: {
      pos: { x: arena.width * 0.12, y: arena.height * 0.5 },
      vel: { x: 0, y: 0 },
      heading: 0,
    },
    fish,
    clouds: [],
    venom: createVenom(TUNING.venom.max, TUNING.venom.regenPerSecond),
    captured: 0,
    outcome: 'playing',
    nextId: 1,
  };
}

/** Advance the hunt by dt seconds. Mutates `state`; returns events for visual/audio feedback. */
export function stepHunt(state: HuntState, input: HuntInput, dt: number): HuntEvent[] {
  if (state.outcome !== 'playing') return [];
  const events: HuntEvent[] = [];
  state.time += dt;

  // Snail movement.
  const params = { maxSpeed: state.character.snailSpeed, ...TUNING.snail };
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
      if (d < c.radius) {
        const falloff = 1 - d / c.radius;
        const strength = c.potency * (1 - c.age / c.life);
        expose(f, c.effect, TUNING.metabolic.uptakeRate * strength * falloff * dt);
      }
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
  const result = tryUse(state.venom, slot, ability.cost, ability.cooldown);
  if (result !== 'ok') return [{ type: 'denied', slot, reason: result }];
  return ability.kind === 'cloud' ? [releaseCloud(state, ability, aim)] : [engulf(state, ability)];
}

/** Place a cloud at the aim point, clamped to the ability's range from the snail. */
export function releaseCloud(state: HuntState, a: CloudAbility, aim: Vec2): HuntEvent {
  const s = state.snail.pos;
  const offset = { x: aim.x - s.x, y: aim.y - s.y };
  const d = length(offset);
  const k = d > a.range ? a.range / d : 1;
  const pos = { x: s.x + offset.x * k, y: s.y + offset.y * k };
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
    .filter((f) => f.mode !== 'captured')
    .map((f) => ({ f, d: Math.hypot(f.pos.x - s.x, f.pos.y - s.y) }))
    .filter(
      ({ f, d }) => d <= a.radius && vulnerability(f) >= TUNING.capture.vulnerabilityThreshold,
    )
    .sort((p, q) => p.d - q.d)
    .slice(0, a.maxCaptures)
    .map(({ f }) => f);
  if (caught.length === 0) return { type: 'capture-miss' };
  for (const f of caught) {
    f.mode = 'captured';
    state.captured++;
    refund(state.venom, TUNING.venom.refundPerCapture);
  }
  return { type: 'capture', fishIds: caught.map((f) => f.id) };
}
