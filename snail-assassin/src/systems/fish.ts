import { TUNING } from '../config/tuning';
import { approach, length, normalize, type Vec2 } from '../utils/math';
import type { Rng } from '../utils/rng';
import { shouldFlee, stepAwareness } from './escape';
import { stepMetabolic, swimPerformance, type MetabolicState } from './metabolic';

export type FishMode = 'roaming' | 'alert' | 'fleeing' | 'impaired' | 'captured';

/** One fish: physical state plus bounded physiological state variables (all 0–1). */
export interface Fish extends MetabolicState {
  id: number;
  school: number;
  pos: Vec2;
  vel: Vec2;
  heading: number;
  baseSpeed: number;
  awareness: number;
  /** 1 = normal escape responsiveness; lowered by escape-dampening abilities. */
  responsiveness: number;
  mode: FishMode;
}

export interface Arena {
  width: number;
  height: number;
}

export function createFish(id: number, school: number, pos: Vec2, rng: Rng): Fish {
  const f = TUNING.fish;
  return {
    id,
    school,
    pos: { ...pos },
    vel: { x: 0, y: 0 },
    heading: rng.range(0, Math.PI * 2),
    baseSpeed: rng.range(f.baseSpeedMin, f.baseSpeedMax),
    awareness: 0,
    responsiveness: 1,
    glucose: 1,
    insulin: 0,
    override: 0,
    mode: 'roaming',
  };
}

/** Capture vulnerability (0–1). Currently driven by metabolic state; neural effects will add to it later. */
export function vulnerability(fish: Fish): number {
  return 1 - fish.glucose;
}

/**
 * Advance one fish by dt: physiology, awareness, mode transitions, and steering.
 * Steering = wander + schooling + edge avoidance, or flee directly away from the snail.
 */
export function stepFish(
  fish: Fish,
  school: readonly Fish[],
  snailPos: Vec2,
  snailMotion: number,
  arena: Arena,
  rng: Rng,
  dt: number,
): void {
  if (fish.mode === 'captured') return;
  const p = TUNING.fish;

  stepMetabolic(fish, dt);
  fish.responsiveness = Math.min(1, fish.responsiveness + 0.1 * dt);

  const toSnail = { x: snailPos.x - fish.pos.x, y: snailPos.y - fish.pos.y };
  const dist = length(toSnail);
  // Low glucose dulls reactions as well as swimming.
  const alertness = 0.3 + 0.7 * fish.glucose;
  fish.awareness = stepAwareness(
    fish.awareness,
    dist,
    snailMotion,
    fish.responsiveness,
    alertness,
    dt,
  );

  const fleeing = shouldFlee(fish.awareness, fish.mode === 'fleeing');
  fish.mode = fleeing
    ? 'fleeing'
    : fish.glucose < TUNING.metabolic.impairedBelow
      ? 'impaired'
      : fish.awareness > TUNING.escape.alertAbove
        ? 'alert'
        : 'roaming';

  const performance = swimPerformance(fish.glucose);
  let desired: Vec2;
  if (fleeing) {
    const away = normalize({ x: -toSnail.x, y: -toSnail.y });
    desired = scale(away, fish.baseSpeed * performance * p.fleeSpeedMultiplier);
  } else {
    fish.heading += rng.range(-1, 1) * p.wanderRate * dt;
    let dir = { x: Math.cos(fish.heading), y: Math.sin(fish.heading) };
    dir = add(dir, schoolingSteer(fish, school));
    dir = add(dir, edgeSteer(fish.pos, arena));
    // Alert fish hold still-ish and face away; impaired fish drift slowly.
    const speedFactor = fish.mode === 'alert' ? 0.5 : 1;
    desired = scale(normalize(dir), fish.baseSpeed * performance * speedFactor);
  }

  fish.vel = approach(fish.vel, desired, p.agility * dt);
  fish.pos.x = Math.min(arena.width, Math.max(0, fish.pos.x + fish.vel.x * dt));
  fish.pos.y = Math.min(arena.height, Math.max(0, fish.pos.y + fish.vel.y * dt));
  if (length(fish.vel) > 1) fish.heading = Math.atan2(fish.vel.y, fish.vel.x);
}

function schoolingSteer(fish: Fish, school: readonly Fish[]): Vec2 {
  const p = TUNING.fish;
  let cx = 0;
  let cy = 0;
  let n = 0;
  let sep = { x: 0, y: 0 };
  for (const other of school) {
    if (other === fish || other.mode === 'captured') continue;
    const dx = other.pos.x - fish.pos.x;
    const dy = other.pos.y - fish.pos.y;
    const d = Math.hypot(dx, dy);
    if (d < p.schoolRadius) {
      cx += other.pos.x;
      cy += other.pos.y;
      n++;
    }
    if (d > 0 && d < p.separationRadius)
      sep = add(sep, scale({ x: -dx / d, y: -dy / d }, p.separationWeight));
  }
  if (n === 0) return sep;
  const cohesion = normalize({ x: cx / n - fish.pos.x, y: cy / n - fish.pos.y });
  return add(scale(cohesion, p.cohesionWeight), sep);
}

function edgeSteer(pos: Vec2, arena: Arena): Vec2 {
  const m = TUNING.fish.edgeMargin;
  return {
    x: pos.x < m ? 2 : pos.x > arena.width - m ? -2 : 0,
    y: pos.y < m ? 2 : pos.y > arena.height - m ? -2 : 0,
  };
}

const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
const scale = (a: Vec2, k: number): Vec2 => ({ x: a.x * k, y: a.y * k });
