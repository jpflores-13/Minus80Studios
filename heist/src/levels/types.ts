// Map key, one character per 32px tile:
//   #  wall      X  glass display case (blocks you, not sight)      .  floor
//   =  service corridor (the foldable pathway, a single unbranched line)
//   A  anchor on the corridor (the Folder's ends stop here)
//   P  start     V  getaway van    D  the diamond (primary loot)   *  optional loot
//   G  guard start (route in the job data)   C  security camera (sweep in the job data)

export interface GuardConfig {
  /** Tile coordinates the guard walks between, in a loop. */
  route: [number, number][];
  /** px per second while patrolling. */
  speed: number;
}

export interface CameraConfig {
  /** Degrees the camera sweeps between (0 = right, 90 = down). */
  sweep: [number, number];
  /** Seconds for a full sweep there and back. */
  period: number;
}

export interface JobConfig {
  id: string;
  number: number;
  name: string;
  briefing: string[];
  /** Seconds to reach the van once you have the primary loot. */
  escapeSeconds: number;
  guards: GuardConfig[];
  cameras: CameraConfig[];
  stars: [number, number, number];
  map: string[];
}
