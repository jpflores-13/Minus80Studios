import { prefersReducedMotion } from '../utils/accessibility';

// Saved in this browser only (localStorage); every access is wrapped because storage can be
// blocked. Nothing sensitive is stored: settings, best scores, and campaign progress.

export type Colormap = 'optode' | 'viridis' | 'gray';
export type TimerSetting = 'standard' | 'relaxed' | 'extended' | 'untimed';
export type DifficultySetting = 'gentle' | 'standard' | 'spicy';

export interface RushRecord {
  bestScore: number;
  bestAccuracy: number;
  longestCombo: number;
  mostObservations: number;
  bestEfficiency: number;
  runs: number;
}

export interface Progress {
  version: 1;
  best: Record<string, { score: number; stars: number; title: string }>;
  campaignCleared: number;
  rush: Record<string, RushRecord>;
  seenOpening: boolean;
  seenEnding: boolean;
  // Settings
  sfxVolume: number;
  musicVolume: number;
  ambience: boolean;
  muted: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  colormap: Colormap;
  outlines: boolean;
  timer: TimerSetting;
  difficulty: DifficultySetting;
  largeTargets: boolean;
}

export const STORAGE_KEY = 'minus80.muck-life.progress';

export function defaults(): Progress {
  return {
    version: 1,
    best: {},
    campaignCleared: 0,
    rush: {},
    seenOpening: false,
    seenEnding: false,
    sfxVolume: 0.7,
    musicVolume: 0.5,
    ambience: true,
    muted: false,
    reducedMotion: prefersReducedMotion(),
    largeText: false,
    colormap: 'optode',
    outlines: true,
    timer: 'standard',
    difficulty: 'standard',
    largeTargets: false,
  };
}

let cached: Progress | null = null;

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function progress(): Progress {
  if (cached) return cached;
  cached = defaults();
  try {
    const raw = storage()?.getItem(STORAGE_KEY);
    if (raw) cached = { ...cached, ...(JSON.parse(raw) as Partial<Progress>) };
  } catch {
    // unreadable save: start fresh
  }
  return cached;
}

export function saveProgress(patch: Partial<Progress>): Progress {
  cached = { ...progress(), ...patch };
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(cached));
  } catch {
    // not saved
  }
  return cached;
}

/** Test hook: forget the in-memory copy so the next read comes from storage. */
export function _resetCache(): void {
  cached = null;
}

export function textScale(): number {
  return progress().largeText ? 1.25 : 1;
}

export const TIMER_SCALE: Record<TimerSetting, number> = {
  standard: 1,
  relaxed: 1.5,
  extended: 2,
  untimed: Infinity,
};

export const TIMER_LABEL: Record<TimerSetting, string> = {
  standard: 'STANDARD',
  relaxed: 'RELAXED ×1.5',
  extended: 'EXTENDED ×2',
  untimed: 'UNTIMED',
};

export function recordLevel(id: string, score: number, stars: number, title: string): boolean {
  const best = progress().best;
  const prior = best[id];
  if (prior && prior.score >= score) return false;
  saveProgress({ best: { ...best, [id]: { score, stars, title } } });
  return true;
}

export function clearLevel(index: number): void {
  if (index + 1 > progress().campaignCleared) saveProgress({ campaignCleared: index + 1 });
}

export function emptyRushRecord(): RushRecord {
  return {
    bestScore: 0,
    bestAccuracy: 0,
    longestCombo: 0,
    mostObservations: 0,
    bestEfficiency: 0,
    runs: 0,
  };
}

/** Merges a run into the mode's records. Returns which records were beaten. */
export function recordRush(
  mode: string,
  run: { score: number; accuracy: number; combo: number; observations: number; efficiency: number },
): string[] {
  const all = progress().rush;
  const r = { ...(all[mode] ?? emptyRushRecord()) };
  const beaten: string[] = [];
  if (run.score > r.bestScore) {
    r.bestScore = run.score;
    beaten.push('score');
  }
  // Accuracy and efficiency only count once a run has a meaningful number of observations.
  if (run.observations >= 5 && run.accuracy > r.bestAccuracy) {
    r.bestAccuracy = run.accuracy;
    beaten.push('accuracy');
  }
  if (run.combo > r.longestCombo) {
    r.longestCombo = run.combo;
    beaten.push('combo');
  }
  if (run.observations > r.mostObservations) {
    r.mostObservations = run.observations;
    beaten.push('observations');
  }
  if (run.observations >= 5 && run.efficiency > r.bestEfficiency) {
    r.bestEfficiency = run.efficiency;
    beaten.push('efficiency');
  }
  r.runs++;
  saveProgress({ rush: { ...all, [mode]: r } });
  return beaten;
}
