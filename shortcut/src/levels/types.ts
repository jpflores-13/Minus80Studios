import type { Checkpoint, EngineParams } from '../systems/extrusion';

export type Resource = 'bread' | 'power';
export type BuildingKind = 'bakery' | 'cafe' | 'plant' | 'factory';

export interface Building {
  id: string;
  name: string;
  kind: BuildingKind;
  /** Suppliers make a resource, consumers need it. */
  role: 'supplier' | 'consumer';
  resource: Resource;
  /** Road address the building sits beside. */
  bin: number;
  active: boolean;
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
  /** Most of the time (0-1) a shortcut may join two districts before the level fails. */
  maxMixups?: number;
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
  goal: Goal;
}
