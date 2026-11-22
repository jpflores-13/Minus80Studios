import { createRng, type Rng } from '../utils/rng';
import type { LevelConfig } from '../levels/types';
import { parseLandscape, tileAt as landTileAt } from './network';
import { TERRAIN } from './terrain';

// Beyond the Divide: reproducible, randomized watershed crossings. Every generated map is
// checked for a passable route from start to destination before it's handed to the player.

// Sized to clear the camera viewport at ZOOM 1.4 (914x514px), the same fix applied to the five
// hand-built levels: a map smaller than that leaves blank space around it instead of filling
// the screen.
const W = 44;
const H = 18;

function randomWalk(rng: Rng, grid: string[][], x0: number, y0: number, steps: number): void {
  let x = x0;
  let y = y0;
  for (let i = 0; i < steps; i++) {
    if (y > 0 && y < grid.length && x > 0 && x < (grid[0]?.length ?? 0) - 1) grid[y]![x] = '~';
    const dir = rng.next();
    if (dir < 0.4) x += 1;
    else if (dir < 0.5) x -= 1;
    else if (dir < 0.75) y += rng.next() < 0.5 ? 1 : -1;
    x = Math.max(1, Math.min((grid[0]?.length ?? W) - 2, x));
    y = Math.max(1, Math.min(grid.length - 2, y));
  }
}

function reachable(map: string[]): boolean {
  const land = parseLandscape(map);
  const key = (tx: number, ty: number) => ty * land.cols + tx;
  const seen = new Set([key(land.start.tx, land.start.ty)]);
  const q: [number, number][] = [[land.start.tx, land.start.ty]];
  let qi = 0;
  while (qi < q.length) {
    const [tx, ty] = q[qi++] as [number, number];
    if (tx === land.destination.tx && ty === land.destination.ty) return true;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = tx + dx;
      const ny = ty + dy;
      if (nx < 0 || ny < 0 || nx >= land.cols || ny >= land.rows) continue;
      const k = key(nx, ny);
      if (seen.has(k)) continue;
      if (!TERRAIN[landTileAt(land, nx, ny)].passable) continue;
      seen.add(k);
      q.push([nx, ny]);
    }
  }
  return false;
}

function generateOnce(rng: Rng): string[] {
  const grid: string[][] = Array.from({ length: H }, (_, y) =>
    Array.from({ length: W }, (_, x) =>
      x === 0 || y === 0 || x === W - 1 || y === H - 1 ? 'X' : '.',
    ),
  );
  randomWalk(rng, grid, 3, 2 + Math.floor(rng.next() * 3), 90);
  randomWalk(rng, grid, W - 4, H - 4 - Math.floor(rng.next() * 3), 90);

  // scatter a few clearings, moss patches and logs on dry land
  for (let i = 0; i < 16; i++) {
    const x = 1 + Math.floor(rng.next() * (W - 2));
    const y = 1 + Math.floor(rng.next() * (H - 2));
    if (grid[y]?.[x] !== '.') continue;
    const kind = rng.pick(['C', 'C', 'M', 'L'] as const);
    grid[y]![x] = kind;
  }

  grid[2]![3] = 'P';
  grid[H - 3]![W - 4] = 'E';
  return grid.map((row) => row.join(''));
}

export function generateLevel(seed: number, number: number): LevelConfig {
  let map = generateOnce(createRng(seed));
  let tries = 0;
  while (!reachable(map) && tries < 20) {
    tries++;
    map = generateOnce(createRng(seed + tries * 7919));
  }
  return {
    id: `beyond-${seed}`,
    number,
    name: `Watershed ${seed}`,
    tagline: 'A new landscape, the same two questions: where is the water, and where isn’t it.',
    intro: [],
    map,
    timeLimit: 90 + number * 5,
    rain: number > 1 ? [{ at: 20 + (seed % 10), duration: 18 }] : [],
    stars: [700, 1000, 1300],
  };
}
