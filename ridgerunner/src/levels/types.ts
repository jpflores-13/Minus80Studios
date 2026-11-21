// Map key, one character per 32px tile:
//   ~  stream (favourable corridor, moisture regenerates)   #  forest floor (drains moisture)
//   M  mossy refuge (barely drains)    L  fallen log (sheltered, slower)
//   C  exposed clearing (drains fast)  X  barrier (impassable: a road, a river too big to cross)
//   .  plain ground (same as forest floor)
//   P  start   E  destination (a neighbouring population's habitat)

export interface RainEvent {
  /** Seconds into the level. */
  at: number;
  duration: number;
}

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
}
