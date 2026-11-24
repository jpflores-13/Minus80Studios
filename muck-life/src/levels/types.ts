import type { GrowthOptions, RootSystem } from '../systems/plant';
import type { FieldOptions } from '../systems/oxygen';
import type { Rng } from '../utils/rng';

export type ObjectiveKind =
  'observations' | 'tracked' | 'lateral' | 'apex' | 'fresh' | 'night' | 'roi' | 'streak' | 'score';

export interface Objective {
  kind: ObjectiveKind;
  n: number;
}

export interface Features {
  scan: boolean;
  timelapse: boolean;
  threshold: boolean;
  roi: boolean;
  chemistry: boolean;
}

export interface SessionConfig {
  id: string;
  title: string;
  /** Game seconds; Infinity for untimed modes. */
  duration: number;
  /** Sim hours per game second (time compression). */
  hoursPerSecond: number;
  /** Sim hour the level begins at (hour 0 = Day 1, 00:00). */
  startHour: number;
  /** Simulated hours run before the player starts, so the system is mid-development. */
  warmupHours: number;
  /** Day–night cycle (visual + small diel release term). Off = a fixed daytime lab view. */
  dayNight: boolean;
  growth: Partial<GrowthOptions>;
  field: Partial<FieldOptions>;
  /** Builds the starting plant. `t0` is the sim hour the warmup begins. */
  setup: (plant: RootSystem, rng: Rng, t0: number) => void;
  /** Endless modes: makes a fresh per-frame hook (spawning growth as difficulty rises) for each
   * session, so restarting never inherits the previous run's state. */
  makeDirector?: () => (ctx: DirectorContext) => void;
  distractorRate: number;
  distractorStartSec: number;
  features: Features;
  objectives: Objective[];
  targetScore: number;
  /** Optode window grows with the rhizome (Level 4). */
  imagingExpands: boolean;
  nightTwist: boolean;
  nightBonus: boolean;
  /** Timed on-screen tips (game seconds). */
  tips: { at: number; text: string }[];
  music: 'muck' | 'rush' | 'night' | 'bloom' | 'zen';
  seed: number;
  /** Endless: ends when this many pools vanish undocumented. 0 = never. */
  maxDataGaps: number;
}

export interface DirectorContext {
  plant: RootSystem;
  rng: Rng;
  gameSec: number;
  simHour: number;
  dt: number;
  setDistractorRate: (r: number) => void;
}

export interface LevelMeta {
  index: number;
  name: string;
  briefing: string[];
  /** One verified science line shown on the results screen. */
  scienceNote: string;
}
