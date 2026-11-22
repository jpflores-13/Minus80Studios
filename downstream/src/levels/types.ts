import type { Intensity } from '../config/tuning';
import type { Segment } from '../systems/network';
import type { StarThresholds } from '../systems/score';
import type { Vec2 } from '../utils/math';

/** Equipment placed on map slots. */
export type SlotKind = 'bin' | 'trap' | 'filter' | 'boom';
/** Limited-use actions (not placed on slots). */
export type ActionKind = 'gps' | 'cleanup' | 'reusables';
export type EquipmentKind = SlotKind | ActionKind;

export const EQUIPMENT_ORDER: readonly EquipmentKind[] = [
  'gps',
  'reusables',
  'bin',
  'filter',
  'trap',
  'boom',
  'cleanup',
];

/** A neighbourhood that generates litter and drains to a waterway entry point. */
export interface PollutionSource {
  id: string;
  label: string;
  pos: Vec2;
  /** Potential litter items generated per second in dry weather. Fictional balancing value. */
  rate: number;
  /**
   * 0–1: how strongly rain increases this source's runoff (paved lot ≈ 1, park ≈ 0.3).
   * So rainfall does not affect every setting identically.
   */
  runoffResponse: number;
  /** Where its runoff enters the network. */
  entry: { segmentId: string; s: number };
  look: 'houses' | 'store' | 'school' | 'park' | 'apartments' | 'lot' | 'market';
}

/** A designated location where one piece of slot equipment may be placed. */
export interface Slot {
  id: string;
  kind: SlotKind;
  pos: Vec2;
  /** Bins and filters: the source they serve. */
  sourceId?: string;
  /** Traps and booms: where they sit in the network. */
  segmentId?: string;
  s?: number;
  /** Traps: centre (−1…1) and half-width of the part of the channel they span. */
  offset?: number;
  coverage?: number;
}

/** A bank feature that snags floating litter, which may later break free. */
export interface Hotspot {
  id: string;
  label: string;
  segmentId: string;
  sFrom: number;
  sTo: number;
  /** Which bank: −1 or +1 (sign of lateral position). */
  side: -1 | 1;
  look: 'log' | 'reeds' | 'eddy';
}

export interface WeatherEvent {
  at: number;
  duration: number;
  intensity: Intensity;
}

// A level is plain data, so new watersheds don't need new code.
export interface LevelConfig {
  id: string;
  number: number;
  name: string;
  intro: string;
  /** New ideas introduced in this level (shown on the briefing). */
  teaches: string[];
  seed: number;
  /** Litter is generated for this long; the flow then runs to `durationSeconds`. */
  generationSeconds: number;
  durationSeconds: number;
  /** Fraction (0–1) of potential litter that must be kept from the ocean to complete the level. */
  target: number;
  stars: StarThresholds;
  inventory: Partial<Record<EquipmentKind, number>>;
  segments: Segment[];
  sources: PollutionSource[];
  slots: Slot[];
  hotspots: Hotspot[];
  weather: WeatherEvent[];
  /**
   * Year-long levels: the level is one year, and its rain comes from the player's chosen climate
   * instead of `weather`. Litter is dropped for the first `generationMonths` months.
   */
  year?: { generationMonths: number };
}
