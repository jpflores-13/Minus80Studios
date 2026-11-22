import { TUNING } from '../config/tuning';
import { approach, clamp, length, normalize, type Vec2 } from '../utils/math';
import type { Rng } from '../utils/rng';
import type { Arena } from './fish';

// A threat (the octopus, or the shark in the escalation level) patrols the reef. It spots the
// player when they move nearby, chases, and grabs on contact. Holding still is how you stay
// hidden, though how much it helps depends on the tuning (see TUNING.predator vs TUNING.shark).
// It doesn't end the hunt: a grab stuns the player and costs venom.

export type PredatorMode = 'patrol' | 'chase' | 'retreat';
export type PredatorTuning = typeof TUNING.predator;

export interface Predator {
  pos: Vec2;
  vel: Vec2;
  heading: number;
  waypoint: Vec2;
  awareness: number;
  mode: PredatorMode;
  retreatTimer: number;
}

export function createPredator(arena: Arena, rng: Rng): Predator {
  const pos = { x: arena.width * 0.85, y: arena.height * rng.range(0.2, 0.8) };
  return {
    pos,
    vel: { x: 0, y: 0 },
    heading: Math.PI,
    waypoint: randomPoint(arena, rng),
    awareness: 0,
    mode: 'patrol',
    retreatTimer: 0,
  };
}

// Returns true on the frame the threat grabs the player.
export function stepPredator(
  o: Predator,
  snailPos: Vec2,
  snailMotion: number,
  arena: Arena,
  rng: Rng,
  dt: number,
  tuning: PredatorTuning = TUNING.predator,
): boolean {
  const p = tuning;
  const toSnail = { x: snailPos.x - o.pos.x, y: snailPos.y - o.pos.y };
  const dist = length(toSnail);

  // Awareness: a moving snail close by is easy to spot, a still one hardly at all.
  const proximity = dist < p.sightRadius ? 1 - dist / p.sightRadius : 0;
  const stimulus =
    proximity * (p.stillVisibility + (1 - p.stillVisibility) * clamp(snailMotion, 0, 1));
  o.awareness = clamp(o.awareness + (p.gain * stimulus - p.decay * o.awareness) * dt, 0, 1);

  let grabbed = false;
  if (o.mode === 'retreat') {
    o.retreatTimer -= dt;
    if (o.retreatTimer <= 0) {
      o.mode = 'patrol';
      o.awareness = 0;
    }
  } else if (o.mode === 'chase') {
    if (o.awareness < p.loseInterestBelow) o.mode = 'patrol';
    if (dist < p.grabRadius) {
      grabbed = true;
      o.mode = 'retreat';
      o.retreatTimer = p.retreatSeconds;
      o.waypoint = farPoint(arena, snailPos, rng);
    }
  } else if (o.awareness > p.chaseAbove) {
    o.mode = 'chase';
  }

  let desired: Vec2;
  if (o.mode === 'chase') {
    desired = scale(normalize(toSnail), p.chaseSpeed);
  } else {
    const toWaypoint = { x: o.waypoint.x - o.pos.x, y: o.waypoint.y - o.pos.y };
    if (length(toWaypoint) < 30) o.waypoint = randomPoint(arena, rng);
    const speed = o.mode === 'retreat' ? p.chaseSpeed : p.patrolSpeed;
    desired = scale(normalize(toWaypoint), speed);
  }
  o.vel = approach(o.vel, desired, p.agility * dt);
  o.pos.x = wrap(o.pos.x + o.vel.x * dt, arena.width);
  o.pos.y = wrap(o.pos.y + o.vel.y * dt, arena.height);
  if (length(o.vel) > 2) o.heading = Math.atan2(o.vel.y, o.vel.x);
  return grabbed;
}

export function wrap(v: number, size: number): number {
  return ((v % size) + size) % size;
}

function randomPoint(arena: Arena, rng: Rng): Vec2 {
  return { x: rng.range(60, arena.width - 60), y: rng.range(60, arena.height - 60) };
}

function farPoint(arena: Arena, from: Vec2, rng: Rng): Vec2 {
  for (let i = 0; i < 10; i++) {
    const pt = randomPoint(arena, rng);
    if (Math.hypot(pt.x - from.x, pt.y - from.y) > arena.width * 0.4) return pt;
  }
  return randomPoint(arena, rng);
}

const scale = (a: Vec2, k: number): Vec2 => ({ x: a.x * k, y: a.y * k });
