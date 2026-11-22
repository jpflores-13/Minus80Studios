import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/levels';
import { generateLevel } from '../src/systems/procedural';
import { parseLandscape, TILE, type Landscape } from '../src/systems/network';
import { TERRAIN } from '../src/systems/terrain';

// Re-validates every hand-built level the same way systems/procedural.ts validates a generated
// one: the map is rectangular, start and destination exist, and a passable route connects them.
// "Stars achievable" is checked empirically in tests/difficulty.test.ts via a scripted bot.

function reachable(land: Landscape): boolean {
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
      const i = ny * land.cols + nx;
      if (!TERRAIN[land.tiles[i] ?? 'barrier'].passable) continue;
      seen.add(k);
      q.push([nx, ny]);
    }
  }
  return false;
}

describe('the five campaign levels', () => {
  for (const level of LEVELS) {
    describe(level.name, () => {
      it('is a rectangular grid', () => {
        const cols = level.map[0]?.length ?? 0;
        expect(cols).toBeGreaterThan(0);
        for (const row of level.map) expect(row.length).toBe(cols);
      });

      it('fills more of the 1280x720 canvas than the previous, too-small levels did', () => {
        // The bug this fixes: a map smaller than the camera viewport at ZOOM 1.4 (914x514px)
        // leaves blank space around it. Every level's world must exceed that in both axes.
        const land = parseLandscape(level.map);
        expect(land.cols * TILE).toBeGreaterThan(914);
        expect(land.rows * TILE).toBeGreaterThan(514);
      });

      it('has a start and a destination', () => {
        const land = parseLandscape(level.map);
        expect(land.start).not.toEqual(land.destination);
      });

      it('has a passable route from start to destination', () => {
        const land = parseLandscape(level.map);
        expect(reachable(land)).toBe(true);
      });
    });
  }

  it('gets spatially larger from level 1 to level 5', () => {
    const area = (l: (typeof LEVELS)[number]) => {
      const land = parseLandscape(l.map);
      return land.cols * land.rows;
    };
    for (let i = 1; i < LEVELS.length; i++) {
      expect(area(LEVELS[i]!)).toBeGreaterThan(area(LEVELS[i - 1]!));
    }
  });
});

describe('Beyond the Divide (procedural)', () => {
  it('always generates a reachable map, several seeds in a row', () => {
    for (let seed = 0; seed < 15; seed++) {
      const level = generateLevel(seed * 997, 1);
      const land = parseLandscape(level.map);
      expect(reachable(land)).toBe(true);
    }
  });

  it('also exceeds the camera viewport, same as the hand-built levels', () => {
    const level = generateLevel(42, 1);
    const land = parseLandscape(level.map);
    expect(land.cols * TILE).toBeGreaterThan(914);
    expect(land.rows * TILE).toBeGreaterThan(514);
  });
});
