import { ARCADE, SIM, type Organ } from '../config/tuning';
import type { OxygenField } from './oxygen';
import { releaseFactor, type RootSystem, type Segment } from './plant';

// Oxygen-rich *regions*: the game's targets. A region's existence and brightness come entirely from
// the measured field (cells above the imaging threshold); its identity comes from the biology that
// produced it (one growing root tip, one rhizome apex, one lateral-root cluster), so a moving pool
// keeps the same identity as the root advances and can be tracked.

export type RegionKind = 'tip' | 'apex' | 'lateral';

export const REGION_LABEL: Record<RegionKind, string> = {
  tip: 'Adventitious root tip',
  apex: 'Rhizome apex',
  lateral: 'Lateral root plume',
};

export interface Documentation {
  x: number;
  y: number;
  strength: number;
  simHour: number;
  gameSec: number;
}

export interface Region {
  /** Stable identity key: `seg:<id>` or `cluster:<id>`. */
  key: string;
  kind: RegionKind;
  organ: Organ;
  visible: boolean;
  x: number;
  y: number;
  radius: number;
  /** Peak % saturation in the region. */
  strength: number;
  /** Field cell indices above threshold that belong to this region. */
  cells: number[];
  firstSeenSim: number;
  firstSeenGame: number;
  lastSeenGame: number;
  lastDoc: Documentation | null;
  docCount: number;
  /** Vanished without ever being documented (counted once). */
  lost: boolean;
}

/** Why a click on a region does (or does not) count as a new observation. */
export type Observability = 'new' | 'moved' | 'changed' | 'period' | 'documented' | 'cooldown';

export function observability(r: Region, simHour: number, gameSec: number): Observability {
  const d = r.lastDoc;
  if (!d) return 'new';
  if (gameSec - d.gameSec < ARCADE.regionCooldownSec) return 'cooldown';
  if (Math.hypot(r.x - d.x, r.y - d.y) >= ARCADE.moveThresholdPx) return 'moved';
  const delta = Math.abs(r.strength - d.strength);
  if (delta >= Math.max(ARCADE.changeMinPct, d.strength * ARCADE.changeFraction)) return 'changed';
  if (simHour - d.simHour >= ARCADE.measurementPeriodHours) return 'period';
  return 'documented';
}

export function isObservable(o: Observability): boolean {
  return o === 'new' || o === 'moved' || o === 'changed' || o === 'period';
}

interface Group {
  key: string;
  kind: RegionKind;
  organ: Organ;
  segs: Segment[];
}

function groups(plant: RootSystem): Group[] {
  const out: Group[] = [];
  const clusters = new Map<number, Group>();
  for (const s of plant.segments) {
    if (s.organ === 'lateral' && s.clusterId !== null) {
      let g = clusters.get(s.clusterId);
      if (!g) {
        g = { key: `cluster:${s.clusterId}`, kind: 'lateral', organ: 'lateral', segs: [] };
        clusters.set(s.clusterId, g);
        out.push(g);
      }
      g.segs.push(s);
    } else {
      const kind: RegionKind = s.organ === 'rhizome' ? 'apex' : 'tip';
      out.push({ key: `seg:${s.id}`, kind, organ: s.organ, segs: [s] });
    }
  }
  return out;
}

export class RegionTracker {
  readonly regions = new Map<string, Region>();
  /** Regions lost undocumented since the last drain. */
  private lostQueue: Region[] = [];

  /** Re-measures every region from the field. `threshold` is the imaging threshold (%). */
  update(
    plant: RootSystem,
    field: OxygenField,
    simHour: number,
    gameSec: number,
    threshold: number,
  ): void {
    const seen = new Set<string>();
    for (const g of groups(plant)) {
      const m = measure(g, field, simHour, threshold);
      let r = this.regions.get(g.key);
      if (!m) {
        if (r?.visible && gameSec - r.lastSeenGame > ARCADE.vanishGraceSec) {
          r.visible = false;
          if (r.docCount === 0 && !r.lost) {
            r.lost = true;
            this.lostQueue.push(r);
          }
        }
        continue;
      }
      seen.add(g.key);
      if (!r) {
        r = {
          key: g.key,
          kind: g.kind,
          organ: g.organ,
          visible: true,
          ...m,
          firstSeenSim: simHour,
          firstSeenGame: gameSec,
          lastSeenGame: gameSec,
          lastDoc: null,
          docCount: 0,
          lost: false,
        };
        this.regions.set(g.key, r);
      } else {
        if (!r.visible) {
          // Reappeared: a fresh pool at the same organ is a new event.
          r.firstSeenSim = simHour;
          r.firstSeenGame = gameSec;
          r.lost = false;
        }
        r.visible = true;
        r.x = m.x;
        r.y = m.y;
        r.radius = m.radius;
        r.strength = m.strength;
        r.cells = m.cells;
        r.lastSeenGame = gameSec;
      }
    }
  }

  visible(): Region[] {
    return [...this.regions.values()].filter((r) => r.visible);
  }

  /**
   * The region under (x, y): first any region whose plume covers the clicked cell (strongest
   * wins), otherwise the nearest region centre within a forgiving hit radius.
   */
  hit(x: number, y: number, hitRadius: number, field?: OxygenField): Region | null {
    const cell = field?.cellOf(x, y);
    if (field && cell) {
      const i = field.index(cell.col, cell.row);
      let top: Region | null = null;
      for (const r of this.visible()) {
        if (!r.cells.includes(i)) continue;
        if (!top || Math.hypot(r.x - x, r.y - y) < Math.hypot(top.x - x, top.y - y)) top = r;
      }
      if (top) return top;
    }
    let best: Region | null = null;
    let bestD = Infinity;
    for (const r of this.visible()) {
      const d = Math.hypot(r.x - x, r.y - y);
      if (d <= Math.max(hitRadius, r.radius) && d < bestD) {
        best = r;
        bestD = d;
      }
    }
    return best;
  }

  document(r: Region, simHour: number, gameSec: number): void {
    r.lastDoc = { x: r.x, y: r.y, strength: r.strength, simHour, gameSec };
    r.docCount++;
  }

  drainLost(): Region[] {
    const l = this.lostQueue;
    this.lostQueue = [];
    return l;
  }
}

interface Measurement {
  x: number;
  y: number;
  radius: number;
  strength: number;
  cells: number[];
}

/**
 * Peak and extent over cells near the group's actively releasing tissue. For growing tips and
 * apices the reported position follows the newest tissue (so a pool can be tracked as it
 * advances); the whole above-threshold plume still counts as part of the region for clicks.
 */
function measure(
  g: Group,
  field: OxygenField,
  simHour: number,
  threshold: number,
): Measurement | null {
  const cells = new Set<number>();
  const tipCells = new Set<number>();
  for (const s of g.segs) {
    for (const p of s.points) {
      const age = simHour - p.born;
      // Only tissue that is (or very recently was) releasing can sustain a pool.
      if (releaseFactor(s.organ, age - 6) <= 0) continue;
      const c = field.cellOf(p.x, p.y);
      if (!c) continue;
      const young = g.kind !== 'lateral' && age <= ARCADE.tipWindowHours;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const cc = c.col + dc;
          const rr = c.row + dr;
          if (cc >= 0 && rr >= 0 && cc < field.cols && rr < field.rows) {
            const i = field.index(cc, rr);
            cells.add(i);
            if (young) tipCells.add(i);
          }
        }
    }
  }
  const above: number[] = [];
  let peak = 0;
  for (const i of cells) {
    const v = field.o[i]!;
    if (v < threshold) continue;
    above.push(i);
    peak = Math.max(peak, v);
  }
  if (above.length === 0) return null;
  const centroidOf = (list: Iterable<number>) => {
    let w = 0;
    let sx = 0;
    let sy = 0;
    for (const i of list) {
      const v = field.o[i]!;
      if (v < threshold) continue;
      const c = field.cellCenter(i % field.cols, Math.floor(i / field.cols));
      const wt = v - threshold + 0.5;
      w += wt;
      sx += c.x * wt;
      sy += c.y * wt;
    }
    return w > 0 ? { x: sx / w, y: sy / w } : null;
  };
  const centre = centroidOf(tipCells) ?? centroidOf(above)!;
  const radius = Math.max(SIM.cellPx * 1.5, Math.sqrt(above.length / Math.PI) * SIM.cellPx);
  return { ...centre, radius: Math.min(radius, 120), strength: peak, cells: above };
}
