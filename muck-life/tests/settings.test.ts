import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  _resetCache,
  progress,
  recordLevel,
  recordRush,
  saveProgress,
  STORAGE_KEY,
} from '../src/config/progress';
import { ARCADE } from '../src/config/tuning';
import { colorFor, luminance } from '../src/render/colormap';
import {
  actionForKey,
  KEYMAP,
  moveForKey,
  pointerIntent,
  sessionSettings,
} from '../src/systems/settings';

class MemoryStorage {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}

describe('save system', () => {
  let store: MemoryStorage;
  beforeEach(() => {
    store = new MemoryStorage();
    (globalThis as unknown as { window: unknown }).window = {
      localStorage: store,
      matchMedia: () => ({ matches: false }),
    };
    _resetCache();
  });
  afterEach(() => {
    delete (globalThis as unknown as { window?: unknown }).window;
    _resetCache();
  });

  it('saves and reloads progress and settings', () => {
    saveProgress({ campaignCleared: 3, colormap: 'viridis', largeTargets: true });
    _resetCache();
    expect(progress().campaignCleared).toBe(3);
    expect(progress().colormap).toBe('viridis');
    expect(JSON.parse(store.getItem(STORAGE_KEY)!).largeTargets).toBe(true);
  });

  it('keeps only improved level bests', () => {
    expect(recordLevel('level1', 500, 1, 'Mud Rookie')).toBe(true);
    expect(recordLevel('level1', 400, 1, 'Mud Rookie')).toBe(false);
    expect(progress().best.level1!.score).toBe(500);
  });

  it('tracks O2 RUSH records', () => {
    recordRush('classic', {
      score: 900,
      accuracy: 0.8,
      combo: 6,
      observations: 10,
      efficiency: 0.7,
    });
    const beaten = recordRush('classic', {
      score: 500,
      accuracy: 0.9,
      combo: 2,
      observations: 8,
      efficiency: 0.9,
    });
    expect(beaten).toEqual(['accuracy', 'efficiency']);
    expect(progress().rush.classic!.runs).toBe(2);
  });

  it('survives corrupt saves', () => {
    store.setItem(STORAGE_KEY, '{not json');
    _resetCache();
    expect(progress().campaignCleared).toBe(0);
  });
});

describe('accessibility settings', () => {
  it('maps saved settings to gameplay', () => {
    const s = sessionSettings({ timer: 'untimed', largeTargets: true, difficulty: 'gentle' });
    expect(s.timerScale).toBe(Infinity);
    expect(s.hitRadius).toBe(ARCADE.largeHitRadiusPx);
    expect(s.distractorScale).toBe(0.5);
    expect(
      sessionSettings({ timer: 'relaxed', largeTargets: false, difficulty: 'spicy' })
        .distractorScale,
    ).toBeGreaterThan(1);
  });

  it('every heatmap scale brightens monotonically (readable without colour)', () => {
    for (const map of ['optode', 'viridis', 'gray'] as const) {
      let prev = -1;
      for (let v = 0; v <= 40; v += 0.5) {
        const l = luminance(colorFor(map, v));
        expect(l).toBeGreaterThanOrEqual(prev - 1e-9);
        prev = l;
      }
    }
  });
});

describe('input', () => {
  it('every action has at least two keys; pause is Esc and P; restart is R', () => {
    for (const keys of Object.values(KEYMAP)) expect(keys.length).toBeGreaterThanOrEqual(2);
    expect(actionForKey('Escape')).toBe('pause');
    expect(actionForKey('p')).toBe('pause');
    expect(actionForKey('R')).toBe('restart');
    expect(actionForKey(' ')).toBe('capture');
    expect(actionForKey('Tab')).toBe('snap');
    const all = Object.values(KEYMAP).flat();
    expect(new Set(all).size).toBe(all.length);
  });

  it('arrow keys and WASD move the reticle', () => {
    expect(moveForKey('ArrowLeft')).toEqual({ dx: -1, dy: 0 });
    expect(moveForKey('s')).toEqual({ dx: 0, dy: 1 });
    expect(moveForKey('q')).toBeNull();
  });

  it('touch/mouse taps in the toolbar never count as observations', () => {
    expect(pointerIntent(700, 676, false)).toBe('toolbar');
    expect(pointerIntent(400, 676, false)).toBe('capture');
    expect(pointerIntent(400, 676, true)).toBe('roi');
  });
});
