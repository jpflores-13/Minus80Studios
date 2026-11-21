import { describe, expect, it } from 'vitest';
import { QUICK_FACTS, randomQuickFact } from '../src/content/science';

describe('randomQuickFact', () => {
  it('always returns one of the known facts', () => {
    for (let seed = 0; seed < 20; seed++) expect(QUICK_FACTS).toContain(randomQuickFact(seed));
  });

  it('handles negative seeds the same as positive ones', () => {
    expect(randomQuickFact(-3)).toBe(randomQuickFact(3));
  });
});
