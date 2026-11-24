import { describe, expect, it } from 'vitest';
import { campaignLevel, CAMPAIGN_LENGTH, CAMPAIGN_META } from '../src/levels/campaign';
import { DEFAULT_SETTINGS, objectiveLabel, Session } from '../src/systems/session';
import { autoplay } from './bot';

describe('campaign', () => {
  it('has seven levels lasting about 7-10 minutes in total', () => {
    expect(CAMPAIGN_LENGTH).toBe(7);
    const total = Array.from({ length: 7 }, (_, i) => campaignLevel(i).duration).reduce(
      (a, b) => a + b,
    );
    expect(total / 60).toBeGreaterThanOrEqual(7);
    expect(total / 60).toBeLessThanOrEqual(10);
    expect(CAMPAIGN_META.every((m) => m.briefing.length > 0 && m.scienceNote.length > 0)).toBe(
      true,
    );
  });

  it('every level is completable without exceptional reaction speed', () => {
    for (let i = 0; i < CAMPAIGN_LENGTH; i++) {
      const s = autoplay(campaignLevel(i), { reactionSec: 2.5 });
      expect(s.objectivesMet(), campaignLevel(i).id).toBe(true);
      expect(s.finished).toBe(true);
    }
  });

  it('level 5 contains the night twist and keeps oxygen visible after dusk', () => {
    const s = new Session(campaignLevel(4));
    const kinds: string[] = [];
    let atNight = 0;
    while (!s.finished) {
      kinds.push(...s.update(1 / 30).map((e) => e.kind));
      if (s.night) atNight = Math.max(atNight, s.tracker.visible().length);
    }
    expect(kinds).toContain('dusk');
    expect(kinds).toContain('twist');
    expect(atNight).toBeGreaterThan(0);
  });

  it('level 4 expands the imaging window as the rhizome grows', () => {
    const s = new Session(campaignLevel(3));
    const start = s.imaging.right;
    for (let i = 0; i < 30 * 40; i++) s.update(1 / 30);
    expect(s.imaging.right).toBeGreaterThan(start);
  });

  it('untimed levels finish shortly after objectives are met; relaxed timers extend duration', () => {
    const relaxed = new Session(campaignLevel(0), { ...DEFAULT_SETTINGS, timerScale: 1.5 });
    expect(relaxed.duration).toBe(75);
    const s = autoplay(campaignLevel(0), {
      reactionSec: 1,
      settings: { ...DEFAULT_SETTINGS, timerScale: Infinity },
    });
    expect(s.endReason).toBe('objectives');
  });

  it('objective labels read as plain instructions', () => {
    expect(objectiveLabel({ kind: 'night', n: 4 })).toBe('Document 4 signals at night');
  });
});
