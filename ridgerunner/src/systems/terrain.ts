// Terrain kinds and what they do to Moss. Numbers here are fictional gameplay balance, not
// measurements of real salamander physiology; see docs/SCIENCE.md for what's real.

export type Tile = 'stream' | 'floor' | 'moss' | 'log' | 'clearing' | 'barrier';

/** One character per 32px tile. See levels/types.ts for the full map key. */
export const TILE_CHARS: Record<string, Tile> = {
  '~': 'stream',
  '#': 'floor',
  M: 'moss',
  L: 'log',
  C: 'clearing',
  X: 'barrier',
  '.': 'floor',
};

export interface TerrainDef {
  kind: Tile;
  /** Moisture change per second while standing here, before rain or shade modifiers. */
  moistureRate: number;
  /** Movement speed multiplier. */
  speed: number;
  passable: boolean;
}

export const TERRAIN: Record<Tile, TerrainDef> = {
  stream: { kind: 'stream', moistureRate: 16, speed: 1, passable: true },
  floor: { kind: 'floor', moistureRate: -5, speed: 1, passable: true },
  moss: { kind: 'moss', moistureRate: -1, speed: 0.92, passable: true },
  log: { kind: 'log', moistureRate: -3, speed: 0.85, passable: true },
  clearing: { kind: 'clearing', moistureRate: -15, speed: 1.08, passable: true },
  barrier: { kind: 'barrier', moistureRate: 0, speed: 0, passable: false },
};

export function tileAt(kind: Tile): TerrainDef {
  return TERRAIN[kind];
}
