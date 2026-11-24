import { describe, expect, it } from 'vitest';
import { ARCADE } from '../src/config/tuning';
import { campaignLevel } from '../src/levels/campaign';
import { observability, type Region } from '../src/systems/regions';
import { Session } from '../src/systems/session';

function region(over: Partial<Region> = {}): Region {
  return {
    key: 'seg:1',
    kind: 'tip',
    organ: 'adventitious',
    visible: true,
    x: 100,
    y: 300,
    radius: 30,
    strength: 25,
    cells: [],
    firstSeenSim: 0,
    firstSeenGame: 0,
    lastSeenGame: 0,
    lastDoc: null,
    docCount: 0,
    lost: false,
    ...over,
  };
}

describe('observation rules', () => {
  const doc = { x: 100, y: 300, strength: 25, simHour: 10, gameSec: 5 };
  it('new until documented, then a repeat', () => {
    expect(observability(region(), 10, 5)).toBe('new');
    expect(observability(region({ lastDoc: doc, docCount: 1 }), 11, 10)).toBe('documented');
  });
  it('re-observable after it moves, changes, or a new measurement period begins', () => {
    expect(
      observability(region({ lastDoc: doc, y: 300 + ARCADE.moveThresholdPx + 1 }), 11, 10),
    ).toBe('moved');
    expect(observability(region({ lastDoc: doc, strength: 5 }), 11, 10)).toBe('changed');
    expect(observability(region({ lastDoc: doc }), 10 + ARCADE.measurementPeriodHours, 10)).toBe(
      'period',
    );
  });
  it('has a short cooldown so double taps do nothing', () => {
    expect(observability(region({ lastDoc: doc, y: 999 }), 11, 5.5)).toBe('cooldown');
  });
});

describe('target detection in a live session', () => {
  const s = new Session(campaignLevel(0));
  for (let i = 0; i < 90; i++) s.update(1 / 30);

  it('detects oxygen regions around tissue and documents them', () => {
    const r = s.observableRegions()[0]!;
    expect(r).toBeDefined();
    const res = s.click(r.x, r.y);
    expect(res.kind).toBe('observed');
    expect(s.stats.score).toBeGreaterThanOrEqual(ARCADE.basePoints);
    expect(s.stats.observations).toBe(1);
  });

  it('prevents unlimited points from re-clicking the same pool', () => {
    const r = s.tracker.visible().find((x) => x.docCount > 0)!;
    for (let i = 0; i < 60; i++) s.update(1 / 30); // past the cooldown
    const before = s.stats.score;
    const res = s.click(r.x, r.y);
    expect(['duplicate', 'observed']).toContain(res.kind);
    if (res.kind === 'duplicate') expect(s.stats.score).toBe(before);
  });

  it('incorrect clicks in empty mud are a harmless miss', () => {
    const streakBefore = s.stats.misses;
    const res = s.click(1200, 640);
    expect(res.kind === 'empty' || res.kind === 'distractor').toBe(true);
    expect(s.stats.misses).toBe(streakBefore + 1);
    expect(s.stats.streak).toBe(0);
    expect(() => s.update(1 / 30)).not.toThrow();
  });

  it('artefact clicks count as misses and read ~0% oxygen', () => {
    const d = s.distractors.spawn();
    if (!d) return;
    expect(s.readout(d.x, d.y)).toBeLessThan(5);
    const res = s.click(d.x, d.y);
    expect(['distractor', 'observed']).toContain(res.kind);
  });
});
