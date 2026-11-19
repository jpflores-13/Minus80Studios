import { describe, expect, it } from 'vitest';
import { CHARACTERS, getCharacter } from '../src/characters';
import { TUNING } from '../src/config/tuning';

describe('character configs', () => {
  it.each(CHARACTERS.map((c) => [c.id, c] as const))('%s is valid', (_id, c) => {
    expect(c.name).toBeTruthy();
    expect(c.species).toMatch(/^Conus [a-z]+$/);
    expect(c.snailSpeed).toBeGreaterThan(0);
    for (const a of Object.values(c.abilities)) {
      expect(a.cost).toBeGreaterThanOrEqual(0);
      expect(a.cost).toBeLessThanOrEqual(TUNING.venom.max);
      expect(a.cooldown).toBeGreaterThan(0);
      expect(a.radius).toBeGreaterThan(0);
    }
    expect(c.abilities.capture.kind).toBe('engulf');
  });

  it('has unique ids and falls back to a default', () => {
    expect(new Set(CHARACTERS.map((c) => c.id)).size).toBe(CHARACTERS.length);
    expect(getCharacter('nope').id).toBe(CHARACTERS[0]?.id);
  });
});
