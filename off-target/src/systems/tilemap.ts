// Stages are drawn as text, one character per 16×16 tile, so they can be read and edited by
// hand. This turns that text into a tile grid plus a list of things that start in the level.
//
//   #  wall or floor            =  ledge you can jump up through     H  ladder (a filament)
//   ^  spikes (hurt)            ~  crowded goo (slows you down)      G  gate that opens and shuts
//   D  locked door (needs key)  V  bouncy vesicle                    .  empty
//
//   P  start         C  checkpoint     *  collectible     k  passage key
//   s  sprint        h  shield         j  double jump     t  slow motion
//   R  roller spawner (rolls left)     r  roller spawner (rolls right)
//   Y  hero swap pod                   B  boss (in the order listed in the stage)

export const TILE = 16;

export type Tile =
  'empty' | 'solid' | 'ledge' | 'ladder' | 'spikes' | 'goo' | 'gate' | 'door' | 'bouncer';

const TILE_CHARS: Record<string, Tile> = {
  '#': 'solid',
  '=': 'ledge',
  H: 'ladder',
  '^': 'spikes',
  '~': 'goo',
  G: 'gate',
  D: 'door',
  V: 'bouncer',
};

export type SpawnKind =
  | 'start'
  | 'checkpoint'
  | 'bit'
  | 'key'
  | 'sprint'
  | 'shield'
  | 'doubleJump'
  | 'slowMotion'
  | 'rollerLeft'
  | 'rollerRight'
  | 'swap'
  | 'boss';

const SPAWN_CHARS: Record<string, SpawnKind> = {
  P: 'start',
  C: 'checkpoint',
  '*': 'bit',
  k: 'key',
  s: 'sprint',
  h: 'shield',
  j: 'doubleJump',
  t: 'slowMotion',
  R: 'rollerLeft',
  r: 'rollerRight',
  Y: 'swap',
  B: 'boss',
};

export interface Spawn {
  kind: SpawnKind;
  tx: number;
  ty: number;
}

export interface TileMap {
  width: number;
  height: number;
  tiles: Tile[];
  spawns: Spawn[];
}

export function parseMap(rows: string[]): TileMap {
  const height = rows.length;
  const width = Math.max(...rows.map((r) => r.length));
  const tiles: Tile[] = new Array<Tile>(width * height).fill('empty');
  const spawns: Spawn[] = [];
  rows.forEach((row, ty) => {
    for (let tx = 0; tx < row.length; tx++) {
      const ch = row[tx] ?? '.';
      const tile = TILE_CHARS[ch];
      if (tile) tiles[ty * width + tx] = tile;
      const spawn = SPAWN_CHARS[ch];
      if (spawn) spawns.push({ kind: spawn, tx, ty });
    }
  });
  return { width, height, tiles, spawns };
}

export function tileAt(map: TileMap, tx: number, ty: number): Tile {
  if (tx < 0 || tx >= map.width) return 'solid'; // the ends of the level are walls
  if (ty < 0) return 'empty';
  if (ty >= map.height) return 'solid';
  return map.tiles[ty * map.width + tx] ?? 'empty';
}

export function setTile(map: TileMap, tx: number, ty: number, tile: Tile): void {
  if (tx >= 0 && tx < map.width && ty >= 0 && ty < map.height)
    map.tiles[ty * map.width + tx] = tile;
}
