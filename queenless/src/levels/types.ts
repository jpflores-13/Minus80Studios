import type { ColonyConfig } from '../systems/colony';

export interface LevelConfig {
  id: string;
  number: number;
  name: string;
  tagline: string;
  /** Short lines shown before the level starts. */
  intro: string[];
  colony: ColonyConfig;
  /** Buzz Pulse isn't available until Level 2. */
  buzzPulseEnabled: boolean;
  /** Score for one, two and three stars (see systems/colony.ts's colonyHealth, time-averaged). */
  stars: [number, number, number];
}
