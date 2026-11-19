import { describe, expect, it } from 'vitest';
import { createLitter, transition } from '../src/systems/litter';

describe('litter ledger', () => {
  it('records an auditable history of transitions', () => {
    const item = createLitter(1, 'store', 'bottle', 0);
    transition(item, 'onLand', 1);
    transition(item, 'floating', 2);
    transition(item, 'intercepted', 3);
    expect(item.history.map((h) => h.to)).toEqual([
      'generated',
      'onLand',
      'floating',
      'intercepted',
    ]);
  });

  it('rejects impossible transitions (no double counting)', () => {
    const item = createLitter(2, 'store', 'bag', 0);
    transition(item, 'prevented', 0);
    expect(() => transition(item, 'onLand', 1)).toThrow(/Illegal/);
    const escaped = createLitter(3, 'store', 'bag', 0);
    transition(escaped, 'onLand', 0);
    transition(escaped, 'floating', 0);
    transition(escaped, 'escaped', 1);
    expect(() => transition(escaped, 'intercepted', 2)).toThrow();
  });

  it('allows retention and remobilization', () => {
    const item = createLitter(4, 'park', 'wrapper', 0);
    transition(item, 'onLand', 0);
    transition(item, 'floating', 1);
    transition(item, 'retained', 2);
    transition(item, 'floating', 3);
    expect(item.state).toBe('floating');
  });
});
