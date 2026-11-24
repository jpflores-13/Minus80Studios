import { ARCADE } from '../config/tuning';
import { TIMER_SCALE, type Progress } from '../config/progress';
import type { SessionSettings } from './session';

/** Turns the saved accessibility settings into gameplay session settings. */
export function sessionSettings(
  p: Pick<Progress, 'timer' | 'largeTargets' | 'difficulty'>,
): SessionSettings {
  return {
    timerScale: TIMER_SCALE[p.timer],
    hitRadius: p.largeTargets ? ARCADE.largeHitRadiusPx : ARCADE.hitRadiusPx,
    gentle: p.difficulty === 'gentle',
    distractorScale: p.difficulty === 'gentle' ? 0.5 : p.difficulty === 'spicy' ? 1.6 : 1,
  };
}

export type InputAction =
  | 'capture'
  | 'scan'
  | 'view'
  | 'threshold'
  | 'timelapse'
  | 'roi'
  | 'chemistry'
  | 'snap'
  | 'pause'
  | 'restart'
  | 'mute';

/**
 * Keyboard map. Every action has at least two keys (studio input convention); pause is Esc + P,
 * restart is R, the primary action is Space.
 */
export const KEYMAP: Record<InputAction, string[]> = {
  capture: [' ', 'Enter', 'e', 'E'],
  scan: ['q', 'Q', 'f', 'F'],
  view: ['v', 'V', '1'],
  threshold: ['t', 'T', 'g', 'G'],
  timelapse: ['l', 'L', 'k', 'K'],
  roi: ['o', 'O', 'i', 'I'],
  chemistry: ['c', 'C', 'x', 'X'],
  snap: ['Tab', 'n', 'N'],
  pause: ['Escape', 'p', 'P'],
  restart: ['r', 'R'],
  mute: ['m', 'M'],
};

export function actionForKey(key: string): InputAction | null {
  for (const [action, keys] of Object.entries(KEYMAP) as [InputAction, string[]][]) {
    if (keys.includes(key)) return action;
  }
  return null;
}

/** Keyboard reticle movement: arrows or WASD. */
export function moveForKey(key: string): { dx: number; dy: number } | null {
  switch (key) {
    case 'ArrowLeft':
    case 'a':
    case 'A':
      return { dx: -1, dy: 0 };
    case 'ArrowRight':
    case 'd':
    case 'D':
      return { dx: 1, dy: 0 };
    case 'ArrowUp':
    case 'w':
    case 'W':
      return { dx: 0, dy: -1 };
    case 'ArrowDown':
    case 's':
    case 'S':
      return { dx: 0, dy: 1 };
    default:
      return null;
  }
}

/**
 * Touch and mouse both resolve to the same thing: a tap at (x, y) moves the reticle there and
 * documents. A tap in the toolbar strip is a button press instead, never a documentation.
 */
export function pointerIntent(
  y: number,
  toolbarTop: number,
  roiArmed: boolean,
): 'toolbar' | 'roi' | 'capture' {
  if (y >= toolbarTop) return 'toolbar';
  return roiArmed ? 'roi' : 'capture';
}
