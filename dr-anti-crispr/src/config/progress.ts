import type { EnemyKind } from '../content/arsenal';
import { prefersReducedMotion } from '../utils/accessibility';
import type { Difficulty } from '../systems/world';

// Saved in this browser only. Storage can be blocked, so every access is wrapped.

export interface Progress {
  bestCampaign: number;
  bestEndless: number;
  /** Best Daily Challenge score per day, keyed by seed. */
  daily: Record<string, number>;
  campaignWon: boolean;
  difficulty: Difficulty;
  autoAim: boolean;
  /** Enemy and boss kinds seen at least once, for the Enemy Intel screen. */
  encountered: EnemyKind[];
  volume: number;
  muted: boolean;
  music: boolean;
  reducedEffects: boolean;
  largeText: boolean;
  /** Touch: move by dragging anywhere (true) or with an on-screen stick (false). */
  dragToMove: boolean;
  seenIntro: boolean;
}

const KEY = 'minus80.dr-anti-crispr.progress';
let cached: Progress | null = null;

export function progress(): Progress {
  if (cached) return cached;
  cached = {
    bestCampaign: 0,
    bestEndless: 0,
    daily: {},
    campaignWon: false,
    difficulty: 'normal',
    autoAim: true,
    encountered: [],
    volume: 0.7,
    muted: false,
    music: true,
    reducedEffects: prefersReducedMotion(),
    largeText: false,
    dragToMove: true,
    seenIntro: false,
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

export function textScale(): number {
  return progress().largeText ? 1.25 : 1;
}
