import type { Layout } from '../systems/run';
import { prefersReducedMotion } from '../utils/accessibility';

// Saved in this browser only. Storage can be blocked (private mode etc.),
// so every read/write is wrapped and the game still works without it.

export interface LevelRecord {
  bestValue: number;
  bestStars: number;
  passed: boolean;
  /** The plan that got the best result, so the player can pick up where they left off. */
  layout: Layout;
}

export interface Progress {
  levels: Record<string, LevelRecord>;
  volume: number;
  muted: boolean;
  reducedEffects: boolean;
  /** All text 25% bigger. */
  largeText: boolean;
  /** The player has seen the ending reveal (unlocks Science Mode, City Planner and Blueprint). */
  revealed: boolean;
  /** Show the science view instead of the city. */
  scienceMode: boolean;
  /** Blueprint challenges solved, by id, with the best similarity. */
  blueprints: Record<string, number>;
}

const KEY = 'minus80.shortcut.progress';

let cached: Progress | null = null;

export function progress(): Progress {
  if (cached) return cached;
  cached = {
    levels: {},
    volume: 0.7,
    muted: false,
    reducedEffects: prefersReducedMotion(),
    largeText: false,
    revealed: false,
    scienceMode: false,
    blueprints: {},
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

export function recordResult(levelId: string, value: number, stars: number, layout: Layout): void {
  const old = progress().levels[levelId];
  const better =
    !old || stars > old.bestStars || (stars === old.bestStars && value > old.bestValue);
  if (!better) return;
  saveProgress({
    levels: {
      ...progress().levels,
      [levelId]: { bestValue: value, bestStars: stars, passed: stars > 0 || !!old?.passed, layout },
    },
  });
}

/** A level is open if it's the first, or the one before it has been passed. */
export function isUnlocked(levelIds: readonly string[], index: number): boolean {
  if (index === 0) return true;
  return progress().levels[levelIds[index - 1] ?? '']?.passed === true;
}

export function textScale(): number {
  return progress().largeText ? 1.25 : 1;
}

/** Science Mode is unlocked by finishing the campaign and watching the reveal. */
export function view(): 'city' | 'science' {
  return progress().revealed && progress().scienceMode ? 'science' : 'city';
}
