import { describe, expect, it } from 'vitest';
import { MEASURED } from '../src/config/tuning';
import * as science from '../src/content/science';
import { envelope } from '../src/integration/yeti';

import siteHtml from '../../site/index.html?raw';
import pagesYml from '../../.github/workflows/pages.yml?raw';
import viteConfig from '../vite.config.ts?raw';
import titleScene from '../src/scenes/TitleScene.ts?raw';

const workflows = import.meta.glob('../../.github/workflows/*.yml', { query: '?raw' });
const docs = import.meta.glob('../docs/*', { query: '?raw' });
const readme = import.meta.glob('../README.md', { query: '?raw' });
const allText = JSON.stringify(science);

describe('scientific content', () => {
  it('cites the primary paper and the MBL article with working-looking links', () => {
    expect(science.PRIMARY.url).toBe('https://doi.org/10.1111/nph.71593');
    for (const c of science.ALL_CITATIONS) expect(c.url).toMatch(/^https:\/\//);
  });

  it('presents seven discoveries and the required closing lines', () => {
    expect(science.DISCOVERIES).toHaveLength(7);
    expect(science.ENDING_CLOSE).toEqual([
      'The game ends here. The discovery doesn’t.',
      'A Minus 80 Studios production.',
      'Play the discovery.',
    ]);
  });

  it('states measured numbers that match the tuning MEASURED block', () => {
    expect(science.COMPARISON.growthLow).toBe(MEASURED.growthPoolRangePct[0]);
    expect(science.COMPARISON.growthHigh).toBe(MEASURED.growthPoolRangePct[1]);
    expect(allText).toContain('502');
    expect(allText).toContain('95');
  });

  it('never claims the study measured or changed greenhouse gas emissions', () => {
    expect(allText).toMatch(/did not (directly )?measure greenhouse gas/);
    expect(allText).not.toMatch(
      /(reduces|reduced|increases|increased|lowers) (methane|greenhouse)/i,
    );
  });

  it('labels the game as inspired by, not endorsed by, the research', () => {
    expect(science.NOT_AFFILIATED).toMatch(/not developed in collaboration with, or endorsed by/);
  });

  it('scientist profiles use published facts only, with no quotes', () => {
    expect(science.SCIENTISTS.map((s) => s.name)).toEqual([
      'Ilana R. Stein',
      'Zoe G. Cardon',
      'Suzanne Thomas',
    ]);
    for (const s of science.SCIENTISTS) {
      expect(s.source.length).toBeGreaterThan(0);
      expect(s.facts.join(' ')).not.toMatch(/["“]/);
    }
  });

  it('includes the What We Simplified list and explore topics with basis tags', () => {
    expect(science.SIMPLIFICATIONS.length).toBeGreaterThanOrEqual(12);
    expect(science.TOPICS.length).toBe(15);
    for (const t of science.TOPICS)
      for (const p of t.paragraphs) expect(science.BASIS_LABEL[p.basis]).toBeDefined();
  });
});

describe('Project Yeti hooks', () => {
  it('report facts, never reward amounts', () => {
    const e = envelope({
      type: 'level_complete',
      levelId: 'level1',
      score: 10,
      accuracy: 1,
      objectivesMet: true,
    });
    expect(e.gameId).toBe('muck-life');
    expect(JSON.stringify(e)).not.toMatch(/cryovial|reward/i);
  });
});

describe('website integration', () => {
  it('the landing page links to the game', () => {
    expect(siteHtml).toContain('href="./muck-life/"');
    expect(siteHtml).toContain('MUCK LIFE');
  });

  it('the Pages build and CI include the game', () => {
    expect(pagesYml).toContain('working-directory: muck-life');
    expect(pagesYml).toContain('cp -r muck-life/dist _site/muck-life');
    expect(Object.keys(workflows)).toContain('../../.github/workflows/muck-life.yml');
  });

  it('builds with relative paths on its own port', () => {
    expect(viteConfig).toContain("base: './'");
    expect(viteConfig).toContain('8090');
  });

  it('the title screen links back to the arcade', () => {
    expect(titleScene).toContain("window.location.href = '../'");
  });

  it('all required docs exist', () => {
    const names = Object.keys(docs).map((k) => k.replace('../docs/', ''));
    for (const d of [
      'GAME_DESIGN.md',
      'SCIENCE.md',
      'REFERENCES.md',
      'SCIENCE_TO_GAMEPLAY.md',
      'SCIENTIST_PROFILES.md',
      'ART_DIRECTION.md',
      'ARTIST_BRIEF.md',
      'ASSET_MANIFEST.csv',
      'ACCESSIBILITY.md',
      'PLAYTESTING.md',
      'CHANGELOG.md',
      'CREDITS.md',
      'RESEARCH_HOOKS.md',
      'SCIENTIFIC_REVIEW.md',
    ])
      expect(names, d).toContain(d);
    expect(Object.keys(readme)).toHaveLength(1);
  });
});
