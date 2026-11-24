// Map key, one character per 32px tile:
//   ~  stream (favourable corridor, moisture regenerates)   #  forest floor (drains moisture)
//   M  mossy refuge (barely drains)    L  fallen log (sheltered, slower)
//   C  exposed clearing (drains fast)  X  barrier (impassable: a road, a river too big to cross)
//   .  plain ground (same as forest floor)
//   P  start   E  destination (a neighbouring population's habitat)
//   S  garter snake den on forest floor: rests, rears up (warning), then strikes within ~1.5 tiles
//   G  Pacific giant salamander lurking in a stream pool (the tile is stream): slower, longer reach

export interface RainEvent {
  /** Seconds into the level. */
  at: number;
  duration: number;
}

/**
 * Which real Pacific Northwest setting this level's art is grounded in (see docs/SCIENCE.md,
 * "Backdrop / set-dressing notes" for what's verified vs. a stylistic choice per biome):
 *  - headwater:     a shaded, narrow old-growth headwater stream (Little Creek, Against the Current)
 *  - end-of-stream: a headwater network's edge, giving way to drier upland forest floor (End of the Line)
 *  - ridge:         an overland ridge crossing between two drainages (Over the Ridge)
 *  - floodplain:    a wider valley-bottom crossing, more open than a headwater (When It Rains)
 * Undefined falls back to the plain headwater palette.
 */
export type Biome = 'headwater' | 'end-of-stream' | 'ridge' | 'floodplain';

export interface LevelConfig {
  id: string;
  number: number;
  name: string;
  tagline: string;
  /** Shown before the level starts. */
  intro: string[];
  map: string[];
  timeLimit: number;
  rain: RainEvent[];
  /** Score for one, two and three rankings. */
  stars: [number, number, number];
  biome?: Biome;
}
