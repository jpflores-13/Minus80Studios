import type { Material } from '../content/objects';

// Map key, one character per 32px tile:
//   #  soft soil (dig through it)   O  rock (no way through)   .  tunnel
//   P  start   w  earthworm   l  larva   b  beetle   o  pebble   T  root (grows from a nearby wall)

export type PromptTrigger =
  'start' | 'firstTouch' | 'firstId' | 'firstRock' | 'firstEat' | 'firstDig' | 'focus';

export interface LevelConfig {
  id: string;
  number: number;
  name: string;
  objective: { kind: 'eat'; material: Material; count: number };
  /** Seconds. */
  timeLimit: number;
  prompts: { at: PromptTrigger; text: string }[];
  /** Score for one, two and three stars. */
  stars: [number, number, number];
  map: string[];
}
