import { TILE_CHARS, type Tile } from './terrain';
import type { LevelConfig } from '../levels/types';

// The landscape as a tile grid, plus which connected stream network ("watershed") each stream
// tile belongs to. Moss crossing from one watershed's network to another's, overland, is the
// whole point of the game: see docs/SCIENCE.md for what's real and what's a research question.

export const TILE = 32;

export interface Spot {
  tx: number;
  ty: number;
}

/** A predator that waits in one place: a garter snake's den on land ('S'), or a Pacific giant
 * salamander lurking in a stream pool ('G'). */
export type PredatorKind = 'snake' | 'giant';

export interface Den extends Spot {
  kind: PredatorKind;
}

export interface Landscape {
  cols: number;
  rows: number;
  tiles: Tile[];
  /** Watershed id per tile; null off any stream network (dry land). */
  watershed: (number | null)[];
  /** How many separate stream networks this map has. */
  watershedCount: number;
  start: Spot;
  destination: Spot;
  /** Predator dens: 'S' (garter snake, on forest floor) and 'G' (giant salamander, in a
   * stream pool, so the tile underneath stays stream and part of its watershed). */
  dens: Den[];
}

function index(cols: number, tx: number, ty: number): number {
  return ty * cols + tx;
}

export function parseLandscape(map: string[]): Landscape {
  const rows = map.length;
  const cols = Math.max(...map.map((r) => r.length));
  const tiles: Tile[] = [];
  let start: Spot = { tx: 1, ty: 1 };
  let destination: Spot = { tx: 1, ty: 1 };
  const dens: Den[] = [];
  map.forEach((row, ty) => {
    for (let tx = 0; tx < cols; tx++) {
      const ch = row[tx] ?? '#';
      tiles.push(TILE_CHARS[ch] ?? 'floor');
      if (ch === 'P') start = { tx, ty };
      if (ch === 'E') destination = { tx, ty };
      if (ch === 'S') dens.push({ tx, ty, kind: 'snake' });
      if (ch === 'G') dens.push({ tx, ty, kind: 'giant' });
    }
  });

  // flood-fill connected stream tiles into watershed ids
  const watershed: (number | null)[] = tiles.map(() => null);
  let nextId = 0;
  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      const i = index(cols, tx, ty);
      if (tiles[i] !== 'stream' || watershed[i] !== null) continue;
      const id = nextId++;
      const queue: Spot[] = [{ tx, ty }];
      watershed[i] = id;
      while (queue.length) {
        const cur = queue.pop() as Spot;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const) {
          const nx = cur.tx + dx;
          const ny = cur.ty + dy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          const ni = index(cols, nx, ny);
          if (tiles[ni] !== 'stream' || watershed[ni] !== null) continue;
          watershed[ni] = id;
          queue.push({ tx: nx, ty: ny });
        }
      }
    }
  }

  return { cols, rows, tiles, watershed, watershedCount: nextId, start, destination, dens };
}

export function tileAt(land: Landscape, tx: number, ty: number): Tile {
  if (tx < 0 || ty < 0 || tx >= land.cols || ty >= land.rows) return 'barrier';
  return land.tiles[index(land.cols, tx, ty)] ?? 'barrier';
}

export function watershedAt(land: Landscape, tx: number, ty: number): number | null {
  if (tx < 0 || ty < 0 || tx >= land.cols || ty >= land.rows) return null;
  return land.watershed[index(land.cols, tx, ty)] ?? null;
}

export function fromLevel(level: LevelConfig): Landscape {
  return parseLandscape(level.map);
}
