import { describe, expect, it } from 'vitest';
import { CHARACTERS, getCharacter } from '../src/characters';
import { TUNING } from '../src/config/tuning';

describe('character configs', () => {
  it('has the three launch characters plus both escalation levels, all available', () => {
    expect(CHARACTERS.map((c) => c.id).sort()).toEqual([
      'atlas',
      'blueshark',
      'catalyst',
      'nightshade',
      'octopus',
    ]);
  });

  it('the three launch characters are cone snails threatened by the octopus, hunting fish', () => {
    for (const c of CHARACTERS.filter((c) => c.id !== 'octopus' && c.id !== 'blueshark')) {
      expect(c.species).toMatch(/^Conus [a-z]+$/);
      expect(c.threat).toBe('octopus');
      expect(c.prey).toBe('fish');
    }
  });

  it('the octopus is threatened by the shark, and hunts cone snails instead of fish', () => {
    const octopus = CHARACTERS.find((c) => c.id === 'octopus')!;
    expect(octopus.species).toBe('Octopus bimaculoides');
    expect(octopus.threat).toBe('shark');
    expect(octopus.prey).toBe('snail');
  });

  it('the blue shark is threatened by the orca pod, and hunts squid instead of fish', () => {
    const blueshark = CHARACTERS.find((c) => c.id === 'blueshark')!;
    expect(blueshark.species).toBe('Prionace glauca');
    expect(blueshark.threat).toBe('orca');
    expect(blueshark.prey).toBe('squid');
  });

  it.each(CHARACTERS.map((c) => [c.id, c] as const))('%s is valid', (_id, c) => {
    expect(c.name).toBe(c.name.toUpperCase());
    expect(c.species).toMatch(/^[A-Z][a-z]+ [a-z]+$/);
    expect(c.animalLabel.length).toBeGreaterThan(0);
    expect(c.speed).toBeGreaterThan(0);
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
