import { describe, expect, it } from 'vitest';
import { contrast, distinctForColourBlindness } from './colorMath';

// Keeps the palette readable. Text must reach WCAG AA contrast (4.5:1) against its background.
// Litter and GPS bottles have a dark outline, checked at 3:1 against the water and grass.
describe('colours and contrast', () => {
  it.each([
    ['light text on the top bar', '#fbf6ea', '#2d2a26'],
    ['text on the cream toolbar', '#2d2a26', '#f4ead2'],
    ['dim text on cream', '#6b6253', '#f4ead2'],
  ])('%s reaches 4.5:1', (_name, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('sprite outlines stand out from water and grass (3:1)', () => {
    expect(contrast('#10202a', '#3f86b0')).toBeGreaterThanOrEqual(3);
    expect(contrast('#10202a', '#6f9a52')).toBeGreaterThanOrEqual(3);
  });

  it('the GPS trail has a white edge that stands out from the water for everyone', () => {
    expect(contrast('#ffffff', '#3f86b0')).toBeGreaterThanOrEqual(3);
  });

  it('water and grass stay distinct for colour-blind players', () => {
    // Tritanopia makes them closer; the dark bank between them keeps the edge visible.
    expect(distinctForColourBlindness('#3f86b0', '#6f9a52', 15)).toBe(true);
  });
});
