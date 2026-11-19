import { prefersReducedMotion } from '../utils/accessibility';

// Player settings, saved in this browser. Storage can be blocked, so every access is wrapped.
export interface Settings {
  volume: number;
  muted: boolean;
  reducedEffects: boolean;
  /** Characters whose science reveal the player has seen (enables instant skip). */
  seenDiscovery: string[];
  /** Characters whose tutorial checklist has been completed. */
  tutorialDone: string[];
}

const KEY = 'minus80.snail-assassin.settings';

const defaults = (): Settings => ({
  volume: 0.7,
  muted: false,
  reducedEffects: prefersReducedMotion(),
  seenDiscovery: [],
  tutorialDone: [],
});

let current: Settings | null = null;

export function settings(): Settings {
  if (current) return current;
  current = defaults();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) current = { ...current, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    // Storage unavailable: keep defaults.
  }
  return current;
}

export function updateSettings(patch: Partial<Settings>): Settings {
  current = { ...settings(), ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // Not persisted; fine for this session.
  }
  return current;
}

export function markOnce(list: 'seenDiscovery' | 'tutorialDone', id: string): void {
  const s = settings();
  if (!s[list].includes(id)) updateSettings({ [list]: [...s[list], id] });
}
