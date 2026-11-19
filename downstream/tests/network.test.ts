import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/levels';
import {
  lateralSpeedFactor,
  pointAt,
  segmentLength,
  validateNetwork,
  type Segment,
} from '../src/systems/network';

const line: Segment = {
  id: 'a',
  points: [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 50 },
  ],
  speed: 1,
  halfWidth: 10,
  downstream: null,
};

describe('waterway network', () => {
  it('measures arc length and interpolates along polylines', () => {
    expect(segmentLength(line)).toBe(150);
    expect(pointAt(line, 50).pos).toEqual({ x: 50, y: 0 });
    expect(pointAt(line, 125).pos).toEqual({ x: 100, y: 25 });
    expect(pointAt(line, 999).pos).toEqual({ x: 100, y: 50 });
  });

  it('flows faster mid-channel than at the banks', () => {
    expect(lateralSpeedFactor(0)).toBeGreaterThan(lateralSpeedFactor(0.9));
  });

  it('detects broken or cyclic networks', () => {
    expect(validateNetwork([{ ...line, downstream: 'missing' }])[0]).toMatch(/unknown/);
    expect(validateNetwork([{ ...line, downstream: 'a' }])[0]).toMatch(/cycle/);
  });

  it.each(LEVELS.map((l) => [l.id, l] as const))(
    '%s has a valid network and slots',
    (_id, level) => {
      expect(validateNetwork(level.segments)).toEqual([]);
      const segIds = new Set(level.segments.map((s) => s.id));
      const srcIds = new Set(level.sources.map((s) => s.id));
      for (const slot of level.slots) {
        if (slot.kind === 'trap') expect(segIds.has(slot.segmentId ?? '')).toBe(true);
        if (slot.kind === 'bin') expect(srcIds.has(slot.sourceId ?? '')).toBe(true);
      }
      for (const src of level.sources) expect(segIds.has(src.entry.segmentId)).toBe(true);
    },
  );
});
