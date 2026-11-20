import { BOSS_STAGES, type BossKind, type BossStage } from '../content/characters';

// A boss's countdown. It works through searching → recognition → engagement → cleavage; each
// stage lasts a set time. These are gameplay timers, not reaction kinetics.

export type BossRole =
  /** At the wrong target: must be stopped. */
  | 'off-target'
  /** At its intended target: leave it alone (stopping it is an unnecessary inhibition). */
  | 'intended'
  /** A wanted edit (Stage 6): it must be allowed to finish. */
  | 'desired';

export interface BossConfig {
  kind: BossKind;
  role: BossRole;
  /** Seconds spent in searching, recognition and engagement before the cut. */
  durations: [number, number, number];
  /** Seconds between ground shockwaves (0 = none). */
  shockEvery?: number;
  /** How far (tiles) it paces left and right while searching. */
  pace?: number;
}

export interface Boss {
  id: number;
  config: BossConfig;
  /** Home position, px (feet centre). */
  homeX: number;
  x: number;
  y: number;
  elapsed: number;
  frozenFor: number;
  state: 'active' | 'stopped' | 'cut';
  shockTimer: number;
  /** Seconds left of the shockwave warning flash (0 = none coming). */
  warning: number;
}

export function createBoss(
  id: number,
  config: BossConfig,
  x: number,
  y: number,
  timeScale: number,
): Boss {
  return {
    id,
    config: {
      ...config,
      durations: config.durations.map((d) => d * timeScale) as [number, number, number],
    },
    homeX: x,
    x,
    y,
    elapsed: 0,
    frozenFor: 0,
    state: 'active',
    shockTimer: config.shockEvery ?? 0,
    warning: 0,
  };
}

export function totalTime(b: Boss): number {
  return b.config.durations.reduce((s, d) => s + d, 0);
}

export function timeLeft(b: Boss): number {
  return Math.max(0, totalTime(b) - b.elapsed);
}

export function stageOf(b: Boss): BossStage {
  if (b.state === 'cut') return 'cleavage';
  let t = b.elapsed;
  for (let i = 0; i < 3; i++) {
    const d = b.config.durations[i] ?? 0;
    if (t < d) return BOSS_STAGES[i] ?? 'searching';
    t -= d;
  }
  return 'cleavage';
}

/** 0-1 progress through the whole countdown. */
export function progressOf(b: Boss): number {
  return Math.min(1, b.elapsed / Math.max(0.001, totalTime(b)));
}

export type BossEvent =
  | { type: 'stage'; boss: number; stage: BossStage }
  | { type: 'cut'; boss: number }
  | { type: 'warn'; boss: number }
  | { type: 'shock'; boss: number };

export function stepBoss(b: Boss, dt: number, now: number): BossEvent[] {
  if (b.state !== 'active') return [];
  const events: BossEvent[] = [];
  if (b.frozenFor > 0) {
    b.frozenFor = Math.max(0, b.frozenFor - dt);
    return events;
  }
  const before = stageOf(b);
  b.elapsed += dt;
  const after = stageOf(b);
  if (after !== before) events.push({ type: 'stage', boss: b.id, stage: after });
  if (b.elapsed >= totalTime(b)) {
    b.state = 'cut';
    events.push({ type: 'cut', boss: b.id });
    return events;
  }
  // pace while searching; settle on the target once it locks on
  const pace = (b.config.pace ?? 0) * 16;
  const target = before === 'searching' ? b.homeX + Math.sin(now * 0.8 + b.id) * pace : b.homeX;
  b.x += (target - b.x) * Math.min(1, dt * 3);

  if (b.config.shockEvery) {
    b.shockTimer -= dt;
    if (b.warning > 0) {
      b.warning -= dt;
      if (b.warning <= 0) events.push({ type: 'shock', boss: b.id });
    } else if (b.shockTimer <= 0) {
      b.warning = 0.9; // telegraph before every shockwave
      b.shockTimer = b.config.shockEvery;
      events.push({ type: 'warn', boss: b.id });
    }
  }
  return events;
}
