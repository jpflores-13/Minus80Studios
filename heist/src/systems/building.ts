// The building as tiles, plus its foldable pathway: the service corridor read off the map as an
// ordered line of positions. The order never changes; folding only links two of them for a while.

export const TILE = 32;

export type Tile = 'wall' | 'case' | 'floor' | 'corridor';

export interface Spot {
  tx: number;
  ty: number;
}

export interface Building {
  cols: number;
  rows: number;
  tiles: Tile[];
  /** The corridor, in order from one end to the other. */
  path: Spot[];
  /** Index on the path of each (omnidirectional) anchor. */
  anchors: number[];
  /** One-way security anchors (Job 2+): locked against one facing, open to the other. */
  oneWayAnchors: { bin: number; facing: 1 | -1 }[];
  start: Spot;
  van: Spot;
  diamond: Spot;
  loot: Spot[];
  guards: Spot[];
  cameras: Spot[];
}

export function parseBuilding(map: string[]): Building {
  const rows = map.length;
  const cols = Math.max(...map.map((r) => r.length));
  const tiles: Tile[] = [];
  const find = (ch: string): Spot[] => {
    const out: Spot[] = [];
    map.forEach((row, ty) => {
      for (let tx = 0; tx < row.length; tx++) if (row[tx] === ch) out.push({ tx, ty });
    });
    return out;
  };
  map.forEach((row) => {
    for (let tx = 0; tx < cols; tx++) {
      const ch = row[tx] ?? '#';
      tiles.push(
        ch === '#'
          ? 'wall'
          : ch === 'X'
            ? 'case'
            : ch === '=' || ch === 'A' || ch === '>' || ch === '<'
              ? 'corridor'
              : 'floor',
      );
    }
  });
  const b: Building = {
    cols,
    rows,
    tiles,
    path: [],
    anchors: [],
    oneWayAnchors: [],
    start: find('P')[0] ?? { tx: 1, ty: 1 },
    van: find('V')[0] ?? { tx: 1, ty: 1 },
    diamond: find('D')[0] ?? { tx: 1, ty: 1 },
    loot: find('*'),
    guards: find('G'),
    cameras: find('C'),
  };
  b.path = tracePath(b);
  const anchorSpots = find('A');
  b.anchors = b.path
    .map((s, i) => (anchorSpots.some((a) => a.tx === s.tx && a.ty === s.ty) ? i : -1))
    .filter((i) => i >= 0);
  // '>' locks against leftward ends, letting rightward ones through; '<' is the mirror
  const oneWay: { ch: string; facing: 1 | -1 }[] = [
    { ch: '>', facing: 1 },
    { ch: '<', facing: -1 },
  ];
  b.oneWayAnchors = oneWay.flatMap(({ ch, facing }) =>
    find(ch).flatMap((spot) => {
      const i = b.path.findIndex((s) => s.tx === spot.tx && s.ty === spot.ty);
      return i >= 0 ? [{ bin: i, facing }] : [];
    }),
  );
  return b;
}

export function tileAt(b: Building, tx: number, ty: number): Tile {
  if (tx < 0 || ty < 0 || tx >= b.cols || ty >= b.rows) return 'wall';
  return b.tiles[ty * b.cols + tx] ?? 'wall';
}

const NEIGHBOURS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

/** Walk the corridor from one end to the other. It must be a single line with two ends. */
function tracePath(b: Building): Spot[] {
  const isPath = (tx: number, ty: number) => tileAt(b, tx, ty) === 'corridor';
  const cells: Spot[] = [];
  for (let ty = 0; ty < b.rows; ty++)
    for (let tx = 0; tx < b.cols; tx++) if (isPath(tx, ty)) cells.push({ tx, ty });
  const degree = (s: Spot) => NEIGHBOURS.filter(([dx, dy]) => isPath(s.tx + dx, s.ty + dy)).length;
  const ends = cells.filter((s) => degree(s) === 1);
  if (cells.length === 0) return [];
  // start from the end nearest the top-left so the order is stable
  const first = ends.sort((a, c) => a.ty + a.tx - (c.ty + c.tx))[0] ?? cells[0]!;
  const path: Spot[] = [first];
  const seen = new Set([`${first.tx},${first.ty}`]);
  for (;;) {
    const cur = path[path.length - 1]!;
    const next = NEIGHBOURS.map(([dx, dy]) => ({ tx: cur.tx + dx, ty: cur.ty + dy })).find(
      (s) => isPath(s.tx, s.ty) && !seen.has(`${s.tx},${s.ty}`),
    );
    if (!next) break;
    seen.add(`${next.tx},${next.ty}`);
    path.push(next);
  }
  return path;
}

export function pathIndexAt(b: Building, tx: number, ty: number): number {
  return b.path.findIndex((s) => s.tx === tx && s.ty === ty);
}

export function centre(s: Spot): { x: number; y: number } {
  return { x: s.tx * TILE + TILE / 2, y: s.ty * TILE + TILE / 2 };
}

/** Can light (or a guard's gaze) pass from a to b? Glass display cases block you, not sight. */
export function lineOfSight(b: Building, ax: number, ay: number, bx: number, by: number): boolean {
  const d = Math.hypot(bx - ax, by - ay);
  const steps = Math.ceil(d / 8);
  for (let i = 1; i < steps; i++) {
    const x = ax + ((bx - ax) * i) / steps;
    const y = ay + ((by - ay) * i) / steps;
    if (tileAt(b, Math.floor(x / TILE), Math.floor(y / TILE)) === 'wall') return false;
  }
  return true;
}

/** Blocks movement: walls and glass display cases. */
export function solid(t: Tile): boolean {
  return t === 'wall' || t === 'case';
}
