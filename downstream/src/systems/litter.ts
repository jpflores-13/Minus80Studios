/**
 * Litter ledger. Each ordinary litter item is in exactly ONE state at a time,
 * and every state change is appended to its history (an audit trail, like
 * provenance tracking for samples in a pipeline). Scoring reads current states
 * only, so an item can never be counted twice.
 *
 *   generated ─┬─> prevented                                  (stopped at source)
 *              └─> onLand ─> floating ─┬─> intercepted ─> removed
 *                                      ├─> retained ─> floating (remobilized)
 *                                      └─> escaped            (reached the outlet)
 */
export type LitterState =
  | 'generated'
  | 'prevented'
  | 'onLand'
  | 'floating'
  | 'retained'
  | 'intercepted'
  | 'removed'
  | 'escaped';

export type LitterCategory = 'bottle' | 'bag' | 'wrapper';

export interface LitterItem {
  id: number;
  sourceId: string;
  category: LitterCategory;
  state: LitterState;
  segmentId: string;
  /** Arc-length position along the current segment (px). */
  s: number;
  /** Position across the channel, −1 (left bank) … 1 (right bank). */
  lateral: number;
  /** Seconds remaining on land before runoff carries it into the waterway. */
  landTimer: number;
  history: { t: number; to: LitterState }[];
}

const ALLOWED: Record<LitterState, readonly LitterState[]> = {
  generated: ['prevented', 'onLand'],
  prevented: [],
  onLand: ['floating', 'intercepted'],
  floating: ['intercepted', 'retained', 'escaped'],
  retained: ['floating', 'removed'],
  intercepted: ['removed'],
  removed: [],
  escaped: [],
};

export function createLitter(
  id: number,
  sourceId: string,
  category: LitterCategory,
  t: number,
): LitterItem {
  return {
    id,
    sourceId,
    category,
    state: 'generated',
    segmentId: '',
    s: 0,
    lateral: 0,
    landTimer: 0,
    history: [{ t, to: 'generated' }],
  };
}

/** Change state, enforcing the allowed transitions above. Throws on an illegal move (a bookkeeping bug). */
export function transition(item: LitterItem, to: LitterState, t: number): void {
  if (!ALLOWED[item.state].includes(to)) {
    throw new Error(`Illegal litter transition #${item.id}: ${item.state} → ${to}`);
  }
  item.state = to;
  item.history.push({ t, to });
}
