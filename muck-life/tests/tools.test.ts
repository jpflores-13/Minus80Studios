import { describe, expect, it } from 'vitest';
import { ARCADE } from '../src/config/tuning';
import { campaignLevel } from '../src/levels/campaign';
import { RoiRecorder } from '../src/systems/roi';
import { Session } from '../src/systems/session';
import { TimeLapse } from '../src/systems/timelapse';

describe('time-lapse', () => {
  it('records at an interval and keeps only the window', () => {
    const tl = new TimeLapse(1, 48);
    let n = 0;
    for (let h = 0; h < 100; h += 0.25) if (tl.maybeRecord(h, () => new Uint8Array([n++]))) void 0;
    expect(tl.length).toBeLessThanOrEqual(49);
    expect(tl.all()[0]!.simHour).toBeGreaterThanOrEqual(100 - 48 - 1);
    expect(tl.at(0)!.simHour).toBeLessThan(tl.at(1)!.simHour);
  });

  it('a live session builds a replayable image series', () => {
    const s = new Session(campaignLevel(4));
    for (let i = 0; i < 30 * 20; i++) s.update(1 / 30);
    expect(s.timelapse.length).toBeGreaterThan(4);
  });
});

describe('regions of interest', () => {
  it('records hourly readings and flags a real change once', () => {
    const roi = new RoiRecorder();
    roi.place(10, 10, 0);
    let v = 0;
    const events: number[] = [];
    for (let h = 0; h < 20; h += 0.5) {
      v = h > 8 ? 20 : 0;
      events.push(roi.update(h, () => v).length);
    }
    expect(events.reduce((a, b) => a + b)).toBe(1);
    expect(roi.rois[0]!.eventRecorded).toBe(true);
  });

  it('keeps at most three ROIs', () => {
    const roi = new RoiRecorder();
    for (let i = 0; i < 5; i++) roi.place(i, i, 0);
    expect(roi.rois).toHaveLength(ARCADE.maxRois);
  });
});

describe('optode scan', () => {
  it('has a cooldown', () => {
    const s = new Session(campaignLevel(2));
    expect(s.scan()).toBe(true);
    expect(s.scanning).toBe(true);
    expect(s.scan()).toBe(false);
    for (let i = 0; i < 30 * (ARCADE.scanCooldownSec + 0.5); i++) s.update(1 / 30);
    expect(s.scan()).toBe(true);
  });

  it('is unavailable where the level has not introduced it', () => {
    expect(new Session(campaignLevel(0)).scan()).toBe(false);
  });
});
