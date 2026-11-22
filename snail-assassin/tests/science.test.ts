import { describe, expect, it } from 'vitest';
import { QUICK_FACTS, randomQuickFact } from '../src/content/science';

describe('randomQuickFact', () => {
  const characterIds = Object.keys(QUICK_FACTS) as (keyof typeof QUICK_FACTS)[];

  it('always returns one of the known facts for that character', () => {
    for (const id of characterIds) {
      for (let seed = 0; seed < 20; seed++)
        expect(QUICK_FACTS[id]).toContain(randomQuickFact(id, seed));
    }
  });

  it('handles negative seeds the same as positive ones', () => {
    for (const id of characterIds) {
      expect(randomQuickFact(id, -3)).toBe(randomQuickFact(id, 3));
    }
  });
});
