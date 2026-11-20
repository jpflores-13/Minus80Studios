import type { ClimateId } from '../levels/climates';
import type { Tally } from '../systems/score';
import { prefersReducedMotion } from '../utils/accessibility';

// Saved in this browser only. Storage can be blocked (private mode etc.),
// so every read/write is wrapped and the game still works without it.

export interface LevelRecord {
  bestPerformance: number;
  bestStars: number;
  bestTally: Tally;
}

export interface Progress {
  levels: Record<string, LevelRecord>;
  volume: number;
  muted: boolean;
  reducedEffects: boolean;
  /** Flow runs at half speed and pauses by itself when rain starts. */
  relaxed: boolean;
  /** All text 25% bigger. */
  largeText: boolean;
  seenEnding: boolean;
  climate: ClimateId;
  /** Whether the player has picked a climate yet (asked once, before Level 1). */
  climateChosen: boolean;
}

const KEY = 'minus80.downstream.progress';

let cached: Progress | null = null;

export function progress(): Progress {
  if (cached) return cached;
  cached = {
    levels: {},
    volume: 0.7,
    muted: false,
    reducedEffects: prefersReducedMotion(),
    relaxed: false,
    largeText: false,
    seenEnding: false,
    climate: 'four-seasons',
    climateChosen: false,
  };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) cached = { ...cached, ...(JSON.parse(raw) as Partial<Progress>) };
  } catch {
    // no storage, use defaults
  }
  return cached;
}

export function saveProgress(patch: Partial<Progress>): Progress {
  cached = { ...progress(), ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cached));
  } catch {
    // not saved, fine for this session
  }
  return cached;
}

export function recordResult(
  levelId: string,
  performance: number,
  stars: number,
  tally: Tally,
): void {
  const old = progress().levels[levelId];
  if (old && old.bestPerformance >= performance) {
    if (stars > old.bestStars)
      saveProgress({ levels: { ...progress().levels, [levelId]: { ...old, bestStars: stars } } });
    return;
  }
  saveProgress({
    levels: {
      ...progress().levels,
      [levelId]: {
        bestPerformance: performance,
        bestStars: Math.max(stars, old?.bestStars ?? 0),
        bestTally: tally,
      },
    },
  });
}

// A level is open if it's the first one or the one before it has been passed.
export function isUnlocked(
  levelIds: readonly string[],
  index: number,
  targets: readonly number[],
): boolean {
  if (index === 0) return true;
  const prev = progress().levels[levelIds[index - 1] ?? ''];
  return prev !== undefined && prev.bestPerformance >= (targets[index - 1] ?? 1);
}

export function textScale(): number {
  return progress().largeText ? 1.25 : 1;
}
