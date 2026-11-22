import { prefersReducedMotion } from '../utils/accessibility';

// Player settings, saved in this browser. Storage can be blocked, so every access is wrapped.

export type Action =
  'up' | 'down' | 'left' | 'right' | 'primary' | 'secondary' | 'capture' | 'pause';

// Phaser key names (A, Q, SPACE, ESC, ...). Arrow keys always move as well.
export type KeyMap = Record<Action, string>;

export const DEFAULT_KEYS: KeyMap = {
  up: 'W',
  down: 'S',
  left: 'A',
  right: 'D',
  primary: 'Q',
  secondary: 'E',
  capture: 'SPACE',
  pause: 'ESC',
};

export interface Settings {
  volume: number;
  muted: boolean;
  reducedEffects: boolean;
  /** No hunt timer, and the current threat (octopus or shark) never grabs. */
  relaxed: boolean;
  /** All text 25% bigger. */
  largeText: boolean;
  /** Abilities aim themselves and capture happens automatically. */
  assist: boolean;
  keys: KeyMap;
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
  relaxed: false,
  largeText: false,
  assist: false,
  keys: { ...DEFAULT_KEYS },
  seenDiscovery: [],
  tutorialDone: [],
});

let current: Settings | null = null;

export function settings(): Settings {
  if (current) return current;
  current = defaults();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Settings>;
      current = { ...current, ...saved, keys: { ...DEFAULT_KEYS, ...saved.keys } };
    }
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

export function textScale(): number {
  return settings().largeText ? 1.25 : 1;
}
