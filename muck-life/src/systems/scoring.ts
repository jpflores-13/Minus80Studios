import { ARCADE } from '../config/tuning';
import type { Observability, Region } from './regions';

// Points reward observation skill: distinct events, quick streaks, tracking moving pools, and
// returning to persistent ones. Total oxygen in the simulation is never part of the score.

export interface Award {
  points: number;
  streak: number;
  multiplier: number;
  bonuses: { label: string; points: number }[];
}

export interface ScoreStats {
  score: number;
  streak: number;
  bestStreak: number;
  observations: number;
  misses: number;
  duplicates: number;
  clicks: number;
  tracked: number;
  fresh: number;
  persistent: number;
  night: number;
  byOrgan: Record<'rhizome' | 'adventitious' | 'lateral', number>;
  roiEvents: number;
  predictions: number;
  lostEvents: number;
}

export function emptyStats(): ScoreStats {
  return {
    score: 0,
    streak: 0,
    bestStreak: 0,
    observations: 0,
    misses: 0,
    duplicates: 0,
    clicks: 0,
    tracked: 0,
    fresh: 0,
    persistent: 0,
    night: 0,
    byOrgan: { rhizome: 0, adventitious: 0, lateral: 0 },
    roiEvents: 0,
    predictions: 0,
    lostEvents: 0,
  };
}

/** Combo multiplier for the Nth consecutive observation (1-based): 1, 1.25, 1.5, … capped. */
export function comboMultiplier(streak: number): number {
  const s = Math.min(Math.max(1, streak), ARCADE.comboMaxStreak);
  return 1 + ((s - 1) * ARCADE.comboStep) / ARCADE.basePoints;
}

export class Scorer {
  readonly stats: ScoreStats = emptyStats();
  private lastHitGame = -Infinity;

  constructor(private readonly thresholdIndex: () => number = () => 0) {}

  /** Combo lapses if too long passes between observations. */
  tick(gameSec: number): void {
    if (this.stats.streak > 0 && gameSec - this.lastHitGame > ARCADE.comboWindowSec)
      this.stats.streak = 0;
  }

  observe(
    r: Region,
    why: Observability,
    ctx: { simHour: number; gameSec: number; night: boolean; nightBonus: boolean },
  ): Award {
    const s = this.stats;
    s.clicks++;
    s.observations++;
    s.streak++;
    s.bestStreak = Math.max(s.bestStreak, s.streak);
    this.lastHitGame = ctx.gameSec;
    s.byOrgan[r.organ]++;
    const multiplier = comboMultiplier(s.streak);
    const bonuses: Award['bonuses'] = [];
    if (why === 'new' && ctx.simHour - r.firstSeenSim <= ARCADE.freshWindowHours) {
      bonuses.push({ label: 'FRESH EMERGENCE', points: ARCADE.freshBonus });
      s.fresh++;
    }
    if (why === 'moved') {
      bonuses.push({ label: 'TRACKED GROWTH', points: ARCADE.trackedBonus });
      s.tracked++;
    }
    if (why === 'period' && r.kind === 'lateral') {
      bonuses.push({ label: 'PERSISTENT PLUME', points: ARCADE.persistentBonus });
      s.persistent++;
    }
    if (ctx.night) {
      s.night++;
      if (ctx.nightBonus) bonuses.push({ label: 'NIGHT SIGNAL', points: ARCADE.nightBonus });
    }
    const stringency = ARCADE.thresholdMultiplier[this.thresholdIndex()] ?? 1;
    const base = ARCADE.basePoints * multiplier;
    const points = Math.round((base + bonuses.reduce((a, b) => a + b.points, 0)) * stringency);
    s.score += points;
    return { points, streak: s.streak, multiplier, bonuses };
  }

  miss(): void {
    this.stats.clicks++;
    this.stats.misses++;
    this.stats.streak = 0;
  }

  /** Clicking something already in the record: interrupts the combo, never costs accuracy. */
  duplicate(): void {
    this.stats.clicks++;
    this.stats.duplicates++;
    this.stats.streak = 0;
  }

  bonus(points: number): void {
    this.stats.score += points;
  }
}

/** Accuracy: observations over observations + misses (duplicates don't count against you). */
export function accuracy(s: ScoreStats): number {
  const d = s.observations + s.misses;
  return d === 0 ? 1 : s.observations / d;
}

/** Observations per click, the "documentation efficiency" record. */
export function efficiency(s: ScoreStats): number {
  return s.clicks === 0 ? 0 : s.observations / s.clicks;
}

export const PERFORMANCE_TITLES = [
  'Mud Rookie',
  'Root Tracker',
  'Oxygen Observer',
  'Rhizosphere Ranger',
  'Muck Master',
] as const;

/** A title from score relative to the level's target, and accuracy. */
export function performanceTitle(score: number, target: number, acc: number): string {
  const ratio = target > 0 ? score / target : 1;
  let tier = ratio >= 1.6 ? 4 : ratio >= 1.25 ? 3 : ratio >= 1 ? 2 : ratio >= 0.6 ? 1 : 0;
  if (acc < 0.6) tier = Math.min(tier, 2);
  return PERFORMANCE_TITLES[tier]!;
}

/** 0–3 stars, same thresholds as the title. */
export function stars(score: number, target: number): number {
  const ratio = target > 0 ? score / target : 1;
  return ratio >= 1.5 ? 3 : ratio >= 1 ? 2 : ratio >= 0.5 ? 1 : 0;
}
