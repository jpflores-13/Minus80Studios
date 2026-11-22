import { prefersReducedMotion } from '../utils/accessibility';

// Saved in this browser only; every access is wrapped because storage can be blocked.

export interface JournalEntry {
  discovered: boolean;
  bestQuality: number;
}

export interface Progress {
  best: Record<string, { score: number; stars: number }>;
  bestEndless: number;
  journal: Record<string, JournalEntry>;
  mysteriesSolved: string[];
  /** How many campaign expeditions have been cleared, in order. */
  campaignCleared: number;
  volume: number;
  muted: boolean;
  music: boolean;
  reducedEffects: boolean;
  largeText: boolean;
  relaxedMicroscopy: boolean;
  seenIntro: boolean;
  seenEnding: boolean;
}

const KEY = 'minus80.antarctic-expedition.progress';
let cached: Progress | null = null;

export function progress(): Progress {
  if (cached) return cached;
  cached = {
    best: {},
    bestEndless: 0,
    journal: {},
    mysteriesSolved: [],
    campaignCleared: 0,
    volume: 0.7,
    muted: false,
    music: true,
    reducedEffects: prefersReducedMotion(),
    largeText: false,
    relaxedMicroscopy: false,
    seenIntro: false,
    seenEnding: false,
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

export function bestFor(roundId: string): { score: number; stars: number } | null {
  return progress().best[roundId] ?? null;
}

/** Records a round result if it beats the saved best for that round. */
export function recordBest(roundId: string, score: number, stars: number): void {
  const current = progress().best;
  const prior = current[roundId];
  if (prior && prior.score >= score) return;
  saveProgress({ best: { ...current, [roundId]: { score, stars } } });
}

/** Marks a journal entry discovered, keeping the best quality seen so far. */
export function discover(entryId: string, quality: number): void {
  const current = progress().journal;
  const prior = current[entryId];
  const bestQuality = Math.max(prior?.bestQuality ?? 0, quality);
  saveProgress({ journal: { ...current, [entryId]: { discovered: true, bestQuality } } });
}

/** Records a mystery's chosen interpretation as resolved, without judging right or wrong. */
export function resolveMystery(mysteryId: string): void {
  const solved = progress().mysteriesSolved;
  if (solved.includes(mysteryId)) return;
  saveProgress({ mysteriesSolved: [...solved, mysteryId] });
}

/** Advances campaign progress to at least this many expeditions cleared. */
export function clearExpedition(index: number): void {
  const cleared = progress().campaignCleared;
  if (index + 1 > cleared) saveProgress({ campaignCleared: index + 1 });
}

/** Records an Endless Expedition run if it beats the saved best. */
export function recordEndless(score: number): void {
  if (score > progress().bestEndless) saveProgress({ bestEndless: score });
}
