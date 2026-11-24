// Optional hooks for the planned Minus 80 virtual world ("Project Yeti"). MUCK LIFE never depends
// on them: with no host listening, nothing happens. Events report *facts* (what was completed,
// the score, accuracy), never reward amounts — the host platform decides any Cryovial rewards
// itself and should treat client-reported scores as untrusted. See docs/RESEARCH_HOOKS.md.

export const GAME_ID = 'muck-life';
export const EVENT_VERSION = 1;
export const DOM_EVENT = 'minus80:game-event';

export type YetiEvent =
  | {
      type: 'level_complete';
      levelId: string;
      score: number;
      accuracy: number;
      objectivesMet: boolean;
    }
  | { type: 'mode_complete'; mode: string; score: number; accuracy: number; observations: number }
  | { type: 'discovery_unlocked'; discoveryId: string }
  | { type: 'campaign_complete' };

export interface YetiEnvelope {
  gameId: typeof GAME_ID;
  version: typeof EVENT_VERSION;
  at: string;
  event: YetiEvent;
}

export function envelope(event: YetiEvent, now: Date = new Date()): YetiEnvelope {
  return { gameId: GAME_ID, version: EVENT_VERSION, at: now.toISOString(), event };
}

/** Broadcasts to the page (CustomEvent) and, when embedded, to the parent window. */
export function emit(event: YetiEvent): YetiEnvelope {
  const env = envelope(event);
  if (typeof window === 'undefined') return env;
  try {
    window.dispatchEvent(new CustomEvent(DOM_EVENT, { detail: env }));
    if (window.parent && window.parent !== window) window.parent.postMessage(env, '*');
  } catch {
    // never let an integration hook break the game
  }
  return env;
}
