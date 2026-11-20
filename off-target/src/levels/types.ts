import type { HeroId } from '../content/characters';
import type { BossConfig } from '../systems/boss';

/** A platform that moves back and forth between two tile positions. */
export interface PlatformConfig {
  tx: number;
  ty: number;
  /** Width in tiles. */
  w: number;
  toTx: number;
  toTy: number;
  /** Seconds for a full trip there and back. */
  period: number;
}

export interface StageConfig {
  id: string;
  number: number;
  name: string;
  tagline: string;
  /** Short lines shown before the stage. */
  intro: string[];
  /** One tile per character; see systems/tilemap.ts for the key. */
  map: string[];
  /** In the order their B tiles appear, left to right. */
  bosses: BossConfig[];
  platforms: PlatformConfig[];
  /** Seconds for a gate (G) to open and shut once. */
  gatePeriod: number;
  /** Seconds between rollers from each spawner. */
  rollerEvery: number;
  /** Tile column where the nucleus starts (changes the background), if any. */
  nucleusFrom?: number;
  /** Let the player pick a hero before this stage. */
  chooseHero: boolean;
  /** Hero used if the player doesn't choose. */
  defaultHero: HeroId;
  /** A good clear time (s), for the route bonus and time trials. */
  parTime: number;
  /** Score for one, two and three stars. */
  stars: [number, number, number];
}
