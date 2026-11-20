import type { Material } from '../content/objects';

// Map key, one character per 32px tile:
//   #  soft soil (dig through it)      O  rock (no way through)       .  tunnel
//   ~  water (swimmable)               F  tunnel that floods over time
//   P  start   E  exit (Level 5's safety)
//   w  earthworm   l  larva   b  beetle   o  pebble   T  root (grows from a nearby wall)
//   a  aquatic worm   q  aquatic larva (both only sensed well with BUBBLE SNIFF underwater)
//   S  a predator's starting spot

export type PromptTrigger =
  | 'start'
  | 'firstTouch'
  | 'firstId'
  | 'firstRock'
  | 'firstEat'
  | 'firstDig'
  | 'focus'
  | 'firstCombo'
  | 'firstSwim'
  | 'firstBubble'
  | 'firstFlood'
  | 'firstPredator'
  | 'special';

export type Objective =
  /** Eat `count` things of any of these materials. */
  | { kind: 'eat'; materials: Material[]; count: number }
  /** Reach this combo (in one chain) before time runs out. */
  | { kind: 'combo'; target: number }
  /** Reach the exit tile (E) with energy to spare. */
  | { kind: 'reach' };

export interface LevelConfig {
  id: string;
  number: number;
  name: string;
  objective: Objective;
  /** Seconds. */
  timeLimit: number;
  prompts: { at: PromptTrigger; text: string }[];
  /** Score for one, two and three stars. */
  stars: [number, number, number];
  map: string[];
  /** Seconds for the flood (F tiles) to fully submerge, bottom row first. Omit for no flood. */
  floodSeconds?: number;
  /** Predator starting routes (loop waypoints in tile coords), matched to S spawns in order. */
  predators?: { route: [number, number][] }[];
}
