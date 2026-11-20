import type { WeaponId } from './arsenal';

// Fictional arcade upgrades. They are game mechanics, not biology (the ending says so).

export interface Mods {
  fireRate: number;
  chance: number;
  duration: number;
  pierce: number;
  extraShots: number;
  cloudCooldown: number;
  shield: number;
  speed: number;
  allies: number;
  allyTime: number;
  magnet: number;
}

export const BASE_MODS: Mods = {
  fireRate: 1,
  chance: 0,
  duration: 1,
  pierce: 0,
  extraShots: 0,
  cloudCooldown: 1,
  shield: 0,
  speed: 1,
  allies: 0,
  allyTime: 0,
  magnet: 90,
};

export type UpgradeId =
  | 'rapidFire'
  | 'highAffinity'
  | 'extended'
  | 'proteinFactory'
  | 'doubleShot'
  | 'quickRecovery'
  | 'genomeShield'
  | 'agile'
  | 'cooperative'
  | 'magnet'
  | `weapon:${WeaponId}`;

export interface Upgrade {
  id: UpgradeId;
  name: string;
  text: string;
  /** How many times it can be taken. */
  max: number;
  apply: (m: Mods) => void;
}

export const UPGRADES: Upgrade[] = [
  {
    id: 'rapidFire',
    name: 'Rapid Fire',
    text: 'Fire 20% faster.',
    max: 5,
    apply: (m) => void (m.fireRate *= 1.2),
  },
  {
    id: 'highAffinity',
    name: 'High Affinity',
    text: 'Shots work 8% more often.',
    max: 3,
    apply: (m) => void (m.chance += 0.08),
  },
  {
    id: 'extended',
    name: 'Extended Inhibition',
    text: 'Machines stay switched off 30% longer.',
    max: 3,
    apply: (m) => void (m.duration *= 1.3),
  },
  {
    id: 'proteinFactory',
    name: 'Protein Factory',
    text: 'Every shot passes through one more machine.',
    max: 3,
    apply: (m) => void (m.pierce += 1),
  },
  {
    id: 'doubleShot',
    name: 'Double Shot',
    text: 'One more shot in every volley.',
    max: 3,
    apply: (m) => void (m.extraShots += 1),
  },
  {
    id: 'quickRecovery',
    name: 'Quick Recovery',
    text: 'ACR Cloud recharges 25% faster.',
    max: 3,
    apply: (m) => void (m.cloudCooldown *= 0.75),
  },
  {
    id: 'genomeShield',
    name: 'Genome Shield',
    text: 'Block the next two hits completely.',
    max: 9,
    apply: (m) => void (m.shield += 2),
  },
  {
    id: 'agile',
    name: 'Agile Phage',
    text: 'Move 15% faster.',
    max: 3,
    apply: (m) => void (m.speed *= 1.15),
  },
  {
    id: 'cooperative',
    name: 'Cooperative Infection',
    text: 'Reinforcements bring two more allies and stay longer.',
    max: 3,
    apply: (m) => {
      m.allies += 2;
      m.allyTime += 2;
    },
  },
  {
    id: 'magnet',
    name: 'Protein Magnet',
    text: 'Pick up resources from further away.',
    max: 2,
    apply: (m) => void (m.magnet *= 1.6),
  },
];
