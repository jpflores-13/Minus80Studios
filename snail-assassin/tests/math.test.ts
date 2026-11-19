import { describe, expect, it } from 'vitest';
import { approach, clamp, normalize } from '../src/utils/math';

describe('math utils', () => {
  it('clamps values into range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it('normalizes vectors and leaves zero vectors alone', () => {
    expect(normalize({ x: 3, y: 4 })).toEqual({ x: 0.6, y: 0.8 });
    expect(normalize({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
  });

  it('approaches a target without overshooting', () => {
    expect(approach({ x: 0, y: 0 }, { x: 10, y: 0 }, 3)).toEqual({ x: 3, y: 0 });
    expect(approach({ x: 9, y: 0 }, { x: 10, y: 0 }, 3)).toEqual({ x: 10, y: 0 });
  });
});
