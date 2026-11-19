import { describe, expect, it } from 'vitest';
import { CHARACTERS, getCharacter } from '../src/characters';
import { TUNING } from '../src/config/tuning';

describe('character configs', () => {
  it('has exactly the three launch characters, all available', () => {
    expect(CHARACTERS.map((c) => c.id).sort()).toEqual(['atlas', 'catalyst', 'nightshade']);
  });

  it.each(CHARACTERS.map((c) => [c.id, c] as const))('%s is valid', (_id, c) => {
    expect(c.name).toBe(c.name.toUpperCase());
    expect(c.species).toMatch(/^Conus [a-z]+$/);
    expect(c.snailSpeed).toBeGreaterThan(0);
    for (const a of Object.values(c.abilities)) {
      expect(a.label.length).toBeGreaterThan(0);
      expect(a.blurb.length).toBeGreaterThan(10);
      expect(a.cost).toBeGreaterThanOrEqual(0);
      expect(a.cost).toBeLessThanOrEqual(TUNING.venom.max);
      expect(a.cooldown).toBeGreaterThan(0);
      if ('radius' in a) expect(a.radius).toBeGreaterThan(0);
      if ('range' in a) expect(a.range).toBeGreaterThan(0);
    }
    expect(['engulf', 'reel']).toContain(c.abilities.capture.kind);
    for (const v of Object.values(c.attributes)) expect(v).toBeGreaterThanOrEqual(1);
    for (const v of Object.values(c.attributes)) expect(v).toBeLessThanOrEqual(5);
    expect(c.strengths.length).toBeGreaterThan(0);
    expect(c.weaknesses.length).toBeGreaterThan(0);
  });

  it('falls back to a default for unknown ids', () => {
    expect(getCharacter('nope').id).toBe('atlas');
  });
});
