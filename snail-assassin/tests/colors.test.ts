import { describe, expect, it } from 'vitest';
import { contrast, distinctForColourBlindness } from './colorMath';

// Keeps the palette readable. Text must reach WCAG AA contrast (4.5:1) against what it sits on;
// text over the reef has a dark outline, so it's checked against that outline.
// Important graphics need 3:1 against the sand, which the dark sprite outline provides.
describe('colours and contrast', () => {
  it.each([
    ['text on navy', '#eef6f3', '#06192b'],
    ['dim text on navy', '#9fc0c8', '#06192b'],
    ['warm text on navy', '#f3d9a4', '#06192b'],
    ['text against its outline (over the reef)', '#eef6f3', '#06192b'],
  ])('%s reaches 4.5:1', (_name, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('sprite outlines stand out from the sand (3:1)', () => {
    expect(contrast('#10202a', '#cdb58a')).toBeGreaterThanOrEqual(3);
  });

  it('the three characters’ colours stay distinct for colour-blind players', () => {
    expect(distinctForColourBlindness('#ffd36b', '#5fd3c6')).toBe(true);
    expect(distinctForColourBlindness('#5fd3c6', '#c9a2ff')).toBe(true);
  });
});
