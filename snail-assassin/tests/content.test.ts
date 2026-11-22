import scienceDoc from '../docs/SCIENCE.md?raw';
import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '../src/characters';
import { DISCLAIMER, DISCOVERIES, MEDICINE, wordCount } from '../src/content/science';

describe('discovery content', () => {
  it.each(CHARACTERS.map((c) => [c.id, c] as const))(
    '%s has a species-specific discovery',
    (id, c) => {
      const d = DISCOVERIES[id];
      expect(d.reveal).toBe(`MEET THE REAL ${c.name}`);
      expect(wordCount(d.text)).toBeGreaterThanOrEqual(40);
      expect(wordCount(d.text)).toBeLessThanOrEqual(70);
      expect(d.research.length).toBeGreaterThanOrEqual(1);
      expect(d.research.length).toBeLessThanOrEqual(2);
    },
  );

  it('every link is https and traceable to docs/SCIENCE.md', () => {
    const links = [
      ...Object.values(DISCOVERIES).flatMap((d) => [d.explore, ...d.research]),
      MEDICINE.reference,
    ].map((r) => r.url);
    for (const url of links) {
      expect(url).toMatch(/^https:\/\//);
      expect(scienceDoc, `missing from SCIENCE.md: ${url}`).toContain(url);
    }
  });

  it('the shark has its own discovery, not a playable character but still cited the same way', () => {
    const d = DISCOVERIES.shark;
    expect(d.reveal).toBe('MEET THE REAL SHARK');
    expect(wordCount(d.text)).toBeGreaterThanOrEqual(40);
    expect(wordCount(d.text)).toBeLessThanOrEqual(70);
    expect(d.research.length).toBeGreaterThanOrEqual(1);
    expect(d.research.length).toBeLessThanOrEqual(2);
  });

  it('the medicine sequence names the source species and labels experimental leads honestly', () => {
    expect(MEDICINE.text).toContain('Conus magus');
    expect(MEDICINE.text).toMatch(/different species/);
    expect(MEDICINE.text).toMatch(/experimental/);
  });

  it('includes the simplification disclaimer', () => {
    expect(DISCLAIMER).toMatch(/simplified/);
  });
});
