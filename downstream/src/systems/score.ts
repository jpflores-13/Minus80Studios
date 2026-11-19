import type { LitterItem } from './litter';

export interface Tally {
  potential: number;
  prevented: number;
  intercepted: number;
  removed: number;
  retained: number;
  mobile: number;
  escaped: number;
}

/** Count items by their CURRENT state. One item → exactly one bucket. */
export function tally(items: readonly LitterItem[]): Tally {
  const t: Tally = {
    potential: items.length,
    prevented: 0,
    intercepted: 0,
    removed: 0,
    retained: 0,
    mobile: 0,
    escaped: 0,
  };
  for (const item of items) {
    switch (item.state) {
      case 'prevented':
        t.prevented++;
        break;
      case 'intercepted':
        t.intercepted++;
        break;
      case 'removed':
        t.removed++;
        break;
      case 'retained':
        t.retained++;
        break;
      case 'escaped':
        t.escaped++;
        break;
      case 'generated':
      case 'onLand':
      case 'floating':
        t.mobile++;
        break;
    }
  }
  return t;
}

/**
 * Primary metric: (prevented + securely intercepted + permanently removed) / potential.
 * Retained and still-mobile litter earn no credit.
 */
export function performance(t: Tally): number {
  return t.potential === 0 ? 0 : (t.prevented + t.intercepted + t.removed) / t.potential;
}

export interface StarThresholds {
  one: number;
  two: number;
  three: number;
}

export function stars(perf: number, th: StarThresholds): 0 | 1 | 2 | 3 {
  return perf >= th.three ? 3 : perf >= th.two ? 2 : perf >= th.one ? 1 : 0;
}
