import type { Physics } from '../systems/physics';

// Every gameplay number in one place. Units: pixels (16 per tile) and seconds.

export const PHYSICS: Physics = {
  gravity: 980,
  maxFall: 420,
  runSpeed: 112,
  groundAccel: 1100,
  airAccel: 750,
  groundFriction: 1300,
  jumpSpeed: 300,
  jumpCut: 0.86,
  coyoteTime: 0.1,
  jumpBuffer: 0.12,
  climbSpeed: 80,
  bounceSpeed: 430,
};

export type Difficulty = 'casual' | 'arcade' | 'precision';

export interface DifficultySettings {
  name: string;
  description: string;
  /** Multiplies every boss countdown. */
  timeScale: number;
  /** Multiplies hazard speeds. */
  hazardSpeed: number;
  maxHp: number;
  /** Use every checkpoint, or only every other one. */
  checkpoints: 'all' | 'every-other';
}

export const DIFFICULTIES: Record<Difficulty, DifficultySettings> = {
  casual: {
    name: 'Casual',
    description: 'Generous countdowns, more health, every checkpoint.',
    timeScale: 1.5,
    hazardSpeed: 0.85,
    maxHp: 5,
    checkpoints: 'all',
  },
  arcade: {
    name: 'Arcade',
    description: 'The intended challenge.',
    timeScale: 1,
    hazardSpeed: 1,
    maxHp: 3,
    checkpoints: 'all',
  },
  precision: {
    name: 'Precision',
    description: 'Shorter countdowns, faster hazards, half the checkpoints.',
    timeScale: 0.8,
    hazardSpeed: 1.15,
    maxHp: 3,
    checkpoints: 'every-other',
  },
};

export const GAME = {
  /** Fixed simulation step (s). */
  step: 1 / 120,
  /** How close (px) a boss must be for the hero's burst to reach it. */
  burstRangeX: 56,
  burstRangeY: 48,
  burstCooldown: 0.6,
  invulnerable: 1.2,
  knockback: { vx: 140, vy: 230 },
  rollerSpeed: 70,
  rollerSize: 12,
  shockSpeed: 150,
  shockLife: 1.6,
  sprintSeconds: 6,
  sprintFactor: 1.45,
  gooFactor: 0.5,
  slowMotionSeconds: 5,
  shieldHits: 1,
};

export const SCORE = {
  rescue: 1000,
  perSecondLeft: 20,
  accurate: 300,
  wastedBurst: 50,
  unnecessary: 500,
  bit: 50,
  noDamage: 500,
  underPar: 10,
};
