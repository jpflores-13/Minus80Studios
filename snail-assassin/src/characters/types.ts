/**
 * Characters are data. Each one picks three reusable ability *kinds* and gives
 * them parameters, so adding Catalyst or Nightshade means writing a config
 * plus (at most) one new ability kind, not a new game architecture.
 */
export type CloudEffect = 'insulin' | 'override';

export interface CloudAbility {
  kind: 'cloud';
  label: string;
  effect: CloudEffect;
  cost: number;
  cooldown: number;
  /** Max distance from the snail at which the cloud can be placed (px). */
  range: number;
  radius: number;
  lifeSeconds: number;
  potency: number;
}

export interface EngulfAbility {
  kind: 'engulf';
  label: string;
  cost: number;
  cooldown: number;
  radius: number;
  maxCaptures: number;
}

export type AbilityConfig = CloudAbility | EngulfAbility;

export interface CharacterConfig {
  id: string;
  name: string;
  species: string;
  commonName: string;
  title: string;
  tagline: string;
  personality: string;
  snailSpeed: number;
  palette: { shell: number; pattern: number; body: number; accent: number; cloud: number };
  abilities: { primary: AbilityConfig; secondary: AbilityConfig; capture: AbilityConfig };
  strengths: string[];
  weaknesses: string[];
}
