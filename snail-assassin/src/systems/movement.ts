import { approach, length, normalize, type Vec2 } from '../utils/math';

export interface MovementParams {
  maxSpeed: number;
  acceleration: number;
  deceleration: number;
}

// Move velocity toward the input direction (or toward zero with no input) for one frame.
export function stepVelocity(
  velocity: Vec2,
  direction: Vec2,
  params: MovementParams,
  dtSeconds: number,
): Vec2 {
  const hasInput = length(direction) > 0;
  const dir = length(direction) > 1 ? normalize(direction) : direction;
  const target = { x: dir.x * params.maxSpeed, y: dir.y * params.maxSpeed };
  const rate = hasInput ? params.acceleration : params.deceleration;
  return approach(velocity, target, rate * dtSeconds);
}

/** Direction from keyboard-style booleans (diagonals are normalised). */
export function directionFromKeys(left: boolean, right: boolean, up: boolean, down: boolean): Vec2 {
  return normalize({ x: Number(right) - Number(left), y: Number(down) - Number(up) });
}

/** Direction toward a pointer/touch target, or (0, 0) once within `arrivalRadius`. */
export function directionToward(from: Vec2, to: Vec2, arrivalRadius: number): Vec2 {
  const offset = { x: to.x - from.x, y: to.y - from.y };
  return length(offset) <= arrivalRadius ? { x: 0, y: 0 } : normalize(offset);
}
