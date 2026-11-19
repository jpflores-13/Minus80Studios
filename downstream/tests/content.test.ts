import { describe, expect, it } from 'vitest';
import scienceDoc from '../docs/SCIENCE.md?raw';
import { DISCLAIMER, LINKS, RESPONSIBLE, REVEAL, TEAM } from '../src/content/science';

describe('ending content', () => {
  it('every link is https and listed in docs/SCIENCE.md', () => {
    for (const link of Object.values(LINKS)) {
      expect(link.url).toMatch(/^https:\/\//);
      expect(scienceDoc, `missing from SCIENCE.md: ${link.url}`).toContain(link.url);
    }
  });

  it('names institutions only, no individual researchers', () => {
    const text = [REVEAL.text, REVEAL.lead, TEAM.text].join(' ');
    expect(text).toMatch(/NC State/);
    expect(text).not.toMatch(/\b(Dr\.|Professor|PhD student)\b/);
  });

  it('tells players not to release bottles, and says the game simplifies things', () => {
    expect(RESPONSIBLE).toMatch(/never put bottles/i);
    expect(DISCLAIMER).toMatch(/simplified/);
  });

  it('labels the tracker map honestly', () => {
    expect(LINKS.tracker.note).toMatch(/live or past/);
  });
});
