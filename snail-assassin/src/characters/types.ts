/**
 * Characters are data. Each one picks three reusable ability *kinds* and gives
 * them parameters, so adding a character means writing a config (plus, rarely,
 * one new ability kind), not a new game architecture.
 *
 *   cloud   area effect released at the aim point; drifts with the current
 *   engulf  capture all vulnerable fish near the snail
 *   strike  aimed single-target harpoon: immobilizes and tethers one fish
 *   lock    extends immobilization of the tethered fish
 *   reel    pull the tethered fish in and capture it
 */
export type CloudEffect = 'insulin' | 'override' | 'dampen';

interface AbilityBase {
  label: string;
  /** One-line description for the character-select screen and tutorial. */
  blurb: string;
  cost: number;
  cooldown: number;
}

export interface CloudAbility extends AbilityBase {
  kind: 'cloud';
  effect: CloudEffect;
  /** Max distance from the snail at which the cloud can be placed (px). */
  range: number;
  radius: number;
  lifeSeconds: number;
  potency: number;
}

export interface EngulfAbility extends AbilityBase {
  kind: 'engulf';
  radius: number;
  maxCaptures: number;
  /**
   * Extra vulnerability for fish that are unaware AND have dampened escape
   * responsiveness: bonus·(1 − awareness)·(1 − responsiveness). 0 = ignore stealth.
   */
  unawareBonus: number;
}

export interface StrikeAbility extends AbilityBase {
  kind: 'strike';
  range: number;
  /** How close to the cursor a fish must be to count as aimed at (px). */
  aimTolerance: number;
  /** Extra cooldown added on a miss. */
  missPenalty: number;
}

export interface LockAbility extends AbilityBase {
  kind: 'lock';
  potency: number;
}

export interface ReelAbility extends AbilityBase {
  kind: 'reel';
  reelSpeed: number;
  captureRadius: number;
  /** The tether snaps if the fish is farther than this. */
  tetherLength: number;
}

export type AbilityConfig =
  CloudAbility | EngulfAbility | StrikeAbility | LockAbility | ReelAbility;

/** Qualitative 1–5 ratings shown on the selection screen (gameplay, not biology). */
export interface Attributes {
  speed: number;
  range: number;
  burst: number;
  area: number;
  stealth: number;
}

export interface CharacterConfig {
  id: 'catalyst' | 'atlas' | 'nightshade';
  name: string;
  species: string;
  commonName: string;
  title: string;
  tagline: string;
  personality: string;
  specialization: string;
  snailSpeed: number;
  palette: {
    shell: number;
    pattern: number;
    body: number;
    accent: number;
    cloud: number;
    ui: string;
  };
  abilities: { primary: AbilityConfig; secondary: AbilityConfig; capture: AbilityConfig };
  combo: string;
  strengths: string[];
  weaknesses: string[];
  attributes: Attributes;
}
