import { describe, expect, it } from 'vitest';
import { currentSpeedAt, interceptionRate } from '../src/systems/current';

describe('currentSpeedAt (placeholder profile)', () => {
  const [top, bottom, max] = [100, 300, 50];

  it('is zero at both banks and maximal mid-channel', () => {
    expect(currentSpeedAt(top, top, bottom, max)).toBe(0);
    expect(currentSpeedAt(bottom, top, bottom, max)).toBe(0);
    expect(currentSpeedAt(200, top, bottom, max)).toBe(max);
  });

  it('is symmetric across the channel', () => {
    expect(currentSpeedAt(150, top, bottom, max)).toBeCloseTo(
      currentSpeedAt(250, top, bottom, max),
    );
  });

  it('is zero outside the channel or for a degenerate channel', () => {
    expect(currentSpeedAt(50, top, bottom, max)).toBe(0);
    expect(currentSpeedAt(150, 200, 200, max)).toBe(0);
  });
});

describe('interceptionRate', () => {
  it('handles the empty case', () => {
    expect(interceptionRate({ intercepted: 0, escaped: 0 })).toBe(0);
  });

  it('computes the intercepted share', () => {
    expect(interceptionRate({ intercepted: 3, escaped: 1 })).toBe(0.75);
  });
});
