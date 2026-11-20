import type { Checkpoint, EngineParams, Route } from '../systems/extrusion';
import type { Layout } from '../systems/run';

export type Resource = 'bread' | 'power' | 'water';
export type BuildingKind =
  | 'bakery'
  | 'cafe'
  | 'plant'
  | 'factory'
  | 'tower'
  | 'homes'
  | 'cooling'
  | 'workshop'
  | 'greenhouse';

export interface Building {
  id: string;
  name: string;
  kind: BuildingKind;
  /** Suppliers make a resource, consumers need it. */
  role: 'supplier' | 'consumer';
  resource: Resource;
  /** Road address the building sits beside. */
  bin: number;
  /** Closed buildings neither make nor need anything. */
  active: boolean;
  /** Opens partway through the minute (seconds), e.g. when a heat advisory starts. */
  activeFrom?: number;
}

export interface District {
  id: string;
  name: string;
  from: number;
  to: number;
}

export interface Goal {
  /** What the level is scored on: total deliveries, or how much of the time consumers run. */
  metric: 'deliveries' | 'service';
  /** Thresholds for one, two and three stars. One star passes the level. */
  one: number;
  two: number;
  three: number;
  /** Most of the shortcut time (0-1) that may join two districts before the level fails. */
  maxMixups?: number;
  /** Every open customer must run at least this much of the time, or the level fails. */
  minEach?: number;
  /** Most of the shortcut time (0-1) that may join buildings that can't use each other. */
  maxWrong?: number;
}

/** A change partway through the minute. Illustrative only, see docs/SCIENCE.md. */
export interface WeatherEvent {
  at: number;
  name: string;
  /** Multiplies every checkpoint's reliability. */
  reliability: number;
  /** New running window (s): customers need deliveries more often. */
  runningWindow: number;
}

export interface PolicyOption {
  label: string;
  value: number;
  cost: number;
}

/** Maintenance and depot choices bought from a budget (Level 6). */
export interface Policies {
  budget: number;
  lifetime: PolicyOption[];
  loading: PolicyOption[];
  fleet: PolicyOption[];
}

export interface LevelConfig {
  id: string;
  number: number;
  name: string;
  tagline: string;
  /** Short briefing pages shown before the level. */
  intro: string[];
  /** One-line reminder shown in the planning bar. */
  hint: string;
  bins: number;
  durationSeconds: number;
  buildings: Building[];
  districts: District[];
  fixedDepots: number[];
  fixedCheckpoints: Checkpoint[];
  /** What the player gets to place. */
  tools: { depots: number; checkpoints: number };
  /** Level-specific changes to the default machine settings in tuning.ts. */
  engine?: Partial<EngineParams>;
  /** A plan already in place when the level starts (the player may change it). */
  startLayout?: Layout;
  routes?: Route[];
  weather?: WeatherEvent;
  policies?: Policies;
  goal: Goal;
}
