import type { Segment } from '../systems/network';
import type { StarThresholds } from '../systems/score';
import type { Vec2 } from '../utils/math';

export type EquipmentKind = 'bin' | 'trap';

/** A neighbourhood that generates litter and drains to a waterway entry point. */
export interface PollutionSource {
  id: string;
  label: string;
  pos: Vec2;
  /** Potential litter items generated per second. Fictional balancing value. */
  rate: number;
  /** Where its runoff enters the network. */
  entry: { segmentId: string; s: number };
  /** Visual style for the placeholder art. */
  look: 'houses' | 'store' | 'school' | 'park';
}

/** A designated location where one piece of equipment may be placed. */
export interface Slot {
  id: string;
  kind: EquipmentKind;
  pos: Vec2;
  /** Bins: the source they serve. */
  sourceId?: string;
  /** Traps: where they sit in the network, and how much of the channel width they span (0–1). */
  segmentId?: string;
  s?: number;
  coverage?: number;
}

/** Levels are pure data, so new watersheds need no new code. */
export interface LevelConfig {
  id: string;
  number: number;
  name: string;
  intro: string;
  seed: number;
  /** Litter is generated for this long; the flow then runs to `durationSeconds`. */
  generationSeconds: number;
  durationSeconds: number;
  /** Fraction (0–1) of potential litter that must be kept from the ocean to complete the level. */
  target: number;
  stars: StarThresholds;
  inventory: Record<EquipmentKind, number>;
  segments: Segment[];
  sources: PollutionSource[];
  slots: Slot[];
}
