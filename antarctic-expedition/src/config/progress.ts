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
