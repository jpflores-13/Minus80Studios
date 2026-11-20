import type { HeroId } from '../content/characters';
import { prefersReducedMotion } from '../utils/accessibility';
import type { Difficulty } from './tuning';

// Saved in this browser only. Storage can be blocked, so every access is wrapped.

export interface StageRecord {
  bestScore: number;
  bestStars: number;
  /** Fastest clear (s), for time trials. */
  bestTime: number;
}

export interface Progress {
  /** Best results per stage per difficulty: records["stage-1:arcade"]. */
  records: Record<string, StageRecord>;
  /** Highest stage number cleared on any difficulty. */
  cleared: number;
  difficulty: Difficulty;
  volume: number;
  muted: boolean;
  music: boolean;
  reducedEffects: boolean;
  largeText: boolean;
  /** Bigger on-screen touch buttons. */
  bigButtons: boolean;
  seenIntro: boolean;
  seenEnding: boolean;
  lastHero: HeroId;
}

const KEY = 'minus80.off-target.progress';
let cached: Progress | null = null;

export function progress(): Progress {
  if (cached) return cached;
  cached = {
    records: {},
    cleared: 0,
    difficulty: 'arcade',
    volume: 0.7,
    muted: false,
    music: true,
    reducedEffects: prefersReducedMotion(),
    largeText: false,
    bigButtons: false,
    seenIntro: false,
    seenEnding: false,
    lastHero: 'ace',
  };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) cached = { ...cached, ...(JSON.parse(raw) as Partial<Progress>) };
  } catch {
    // no storage
  }
  return cached;
}

export function saveProgress(patch: Partial<Progress>): Progress {
  cached = { ...progress(), ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cached));
  } catch {
    // not saved
  }
  return cached;
}

export function recordKey(stageId: string, difficulty: Difficulty): string {
  return `${stageId}:${difficulty}`;
}

export function record(stageId: string, difficulty: Difficulty): StageRecord | undefined {
  return progress().records[recordKey(stageId, difficulty)];
}

/** Saves a cleared stage. Returns which records were beaten. */
export function recordClear(
  stageId: string,
  stageNumber: number,
  difficulty: Difficulty,
  score: number,
  stars: number,
  time: number,
): { newScore: boolean; newTime: boolean } {
  const k = recordKey(stageId, difficulty);
  const old = progress().records[k];
  const newScore = !old || score > old.bestScore;
  const newTime = !old || time < old.bestTime;
  saveProgress({
    records: {
      ...progress().records,
      [k]: {
        bestScore: Math.max(score, old?.bestScore ?? 0),
        bestStars: Math.max(stars, old?.bestStars ?? 0),
        bestTime: Math.min(time, old?.bestTime ?? Infinity),
      },
    },
    cleared: Math.max(progress().cleared, stageNumber),
  });
  return { newScore, newTime };
}

export function textScale(): number {
  return progress().largeText ? 1.25 : 1;
}
