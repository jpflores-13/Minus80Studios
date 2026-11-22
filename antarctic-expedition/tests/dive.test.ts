import { describe, expect, it } from 'vitest';
import { diveRoundFor } from '../src/levels/diveRounds';
import {
  collectSample,
  createDive,
  stepDive,
  takePhoto,
  totalPhotoScore,
  type DiveState,
} from '../src/systems/dive';

const DT = 1 / 30;
const run = (s: DiveState, seconds: number, mx = 0, my = 0) => {
  for (let t = 0; t < seconds; t += DT) stepDive(s, DT, mx, my);
};

describe('DIVE', () => {
  it('keeps the diver inside the field bounds', () => {
    const s = createDive(diveRoundFor('dive-1', 'Test', 'drop'), 1);
    run(s, 10, -1, -1);
    expect(s.diverX).toBeGreaterThanOrEqual(0);
    expect(s.diverY).toBeGreaterThanOrEqual(0);
    run(s, 10, 1, 1);
    expect(s.diverX).toBeLessThanOrEqual(s.config.fieldWidth);
    expect(s.diverY).toBeLessThanOrEqual(s.config.fieldHeight);
  });

  it('returns noSubject when nothing is in frame', () => {
    const s = createDive(diveRoundFor('dive-1', 'Test', 'drop'), 1);
    s.wildlife = [];
    const ev = takePhoto(s);
    expect(ev.some((e) => e.type === 'noSubject')).toBe(true);
    expect(s.battery).toBe(s.config.battery - 1);
  });

  it('photographing nearby wildlife scores and records the species as documented', () => {
    const s = createDive(diveRoundFor('dive-1', 'Test', 'drop'), 1);
    s.wildlife = [
      {
        id: 1,
        speciesId: 'weddellSeal',
        x: s.diverX + 100,
        y: s.diverY,
        heading: 0,
        mood: 'idle',
        behaviorActive: false,
        behaviorTimer: 5,
        wanderTimer: 2,
      },
    ];
    const ev = takePhoto(s);
    const photo = ev.find((e) => e.type === 'photo');
    expect(photo).toBeDefined();
    expect(s.speciesPhotographed.has('weddellSeal')).toBe(true);
    expect(totalPhotoScore(s)).toBeGreaterThan(0);
  });

  it('runs out of battery after enough photos', () => {
    const s = createDive(diveRoundFor('dive-1', 'Test', 'drop'), 1);
    s.wildlife = [];
    for (let i = 0; i < s.config.battery; i++) takePhoto(s);
    const ev = takePhoto(s);
    expect(ev.some((e) => e.type === 'outOfBattery')).toBe(true);
  });

  it('fast, close approach disturbs wildlife', () => {
    const s = createDive(diveRoundFor('dive-1', 'Test', 'drop'), 1);
    s.wildlife = [
      {
        id: 1,
        speciesId: 'adeliePenguin',
        x: s.diverX + 10,
        y: s.diverY,
        heading: 0,
        mood: 'idle',
        behaviorActive: false,
        behaviorTimer: 5,
        wanderTimer: 2,
      },
    ];
    const ev = stepDive(s, DT, 1, 0);
    expect(ev.some((e) => e.type === 'disturbed')).toBe(true);
    expect(s.wildlife[0]?.mood).toBe('fleeing');
    expect(s.disturbanceEvents).toBe(1);
  });

  it('collects the sample only within the site radius', () => {
    const s = createDive(diveRoundFor('dive-1', 'Test', 'drop'), 1);
    expect(collectSample(s).length).toBe(0);
    s.diverX = s.config.sampleSite.x;
    s.diverY = s.config.sampleSite.y;
    const ev = collectSample(s);
    expect(ev.some((e) => e.type === 'sampleCollected')).toBe(true);
    expect(s.sampleCollected).toBe(true);
  });

  it('surfaces once the duration elapses', () => {
    const s = createDive(diveRoundFor('dive-1', 'Test', 'drop'), 1);
    run(s, s.config.durationSeconds + 1);
    expect(s.status).toBe('surfaced');
  });

  it('the same seed gives the same expedition', () => {
    const a = createDive(diveRoundFor('dive-1', 'Test', 'drop'), 7);
    const b = createDive(diveRoundFor('dive-1', 'Test', 'drop'), 7);
    run(a, 5, 0.5, 0.2);
    run(b, 5, 0.5, 0.2);
    expect(a.wildlife.map((w) => [w.speciesId, w.x.toFixed(2), w.y.toFixed(2)])).toEqual(
      b.wildlife.map((w) => [w.speciesId, w.x.toFixed(2), w.y.toFixed(2)]),
    );
  });
});
