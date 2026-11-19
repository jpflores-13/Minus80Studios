// Every piece of litter has exactly one state, and each change is logged, so nothing
// can be scored twice.
//
//   generated -> prevented                      (bin)
//   generated -> onLand -> intercepted          (drain filter)
//                       -> floating -> intercepted    (trap)
//                                   -> retained -> floating (washed loose) or removed (crew)
//                                   -> escaped        (reached the ocean)
//   intercepted -> removed when a crew empties the trap or filter.
//
// GPS bottles are tracked separately and never counted here.
export type LitterState =
  | 'generated'
  | 'prevented'
  | 'onLand'
  | 'floating'
  | 'retained'
  | 'intercepted'
  | 'removed'
  | 'escaped';

export type LitterCategory = 'bottle' | 'bag' | 'wrapper' | 'ball' | 'toy';

export interface LitterItem {
  id: number;
  sourceId: string;
  category: LitterCategory;
  state: LitterState;
  segmentId: string;
  /** Arc-length position along the current segment (px). */
  s: number;
  /** Position across the channel, −1 … 1. */
  lateral: number;
  /** Which trap, filter, or hotspot currently holds it (if intercepted or retained). */
  holder: string;
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
    holder: '',
    history: [{ t, to: 'generated' }],
  };
}

/** Change state, enforcing the allowed transitions above. Throws on an illegal move (a bookkeeping bug). */
export function transition(item: LitterItem, to: LitterState, t: number, holder = ''): void {
  if (!ALLOWED[item.state].includes(to)) {
    throw new Error(`Illegal litter transition #${item.id}: ${item.state} → ${to}`);
  }
  item.state = to;
  if (to === 'intercepted' || to === 'retained') item.holder = holder;
  else if (to !== 'removed') item.holder = '';
  item.history.push({ t, to });
}
