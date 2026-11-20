import type { CrewMember } from './crew';
import type { Rules } from '../systems/mission';

// Permanent crew upgrades, offered after a job's first clear. Fictional arcade mechanics, same
// as the rest of this game; no claim about real loop extrusion is made here (see docs/SCIENCE.md
// for the checked content that is).

export interface Mods {
  moveSpeed: number;
  folderSpeed: number;
  folderLifetime: number;
  folderCooldown: number;
  folderCharges: number;
  bypass: number;
  /** Multiplies RULES.coolRate: how fast suspicion drops once you are out of sight. */
  coolRate: number;
  /** Multiplies RULES.guardRange and RULES.cameraRange. Under 1 means they see less far. */
  detectRange: number;
}

export const BASE_MODS: Mods = {
  moveSpeed: 1,
  folderSpeed: 1,
  folderLifetime: 1,
  folderCooldown: 1,
  folderCharges: 0,
  bypass: 0,
  coolRate: 1,
  detectRange: 1,
};

export type UpgradeId =
  | 'quickFeet'
  | 'speedyReel'
  | 'longFold'
  | 'fastHands'
  | 'extraCharge'
  | 'slipperyLock'
  | 'coldBlood'
  | 'lowProfile';

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
    id: 'quickFeet',
    name: 'Quick Feet',
    text: 'Move 10% faster.',
    max: 4,
    apply: (m) => void (m.moveSpeed *= 1.1),
  },
  {
    id: 'speedyReel',
    name: 'Speedy Reel',
    text: 'The Folder reels in 15% faster.',
    max: 4,
    apply: (m) => void (m.folderSpeed *= 1.15),
  },
  {
    id: 'longFold',
    name: 'Long Fold',
    text: 'A fold lasts 20% longer before it lets go.',
    max: 4,
    apply: (m) => void (m.folderLifetime *= 1.2),
  },
  {
    id: 'fastHands',
    name: 'Fast Hands',
    text: 'The Folder is ready again 20% sooner.',
    max: 4,
    apply: (m) => void (m.folderCooldown *= 0.8),
  },
  {
    id: 'extraCharge',
    name: 'Extra Charge',
    text: 'One more Folder deployment per job.',
    max: 3,
    apply: (m) => void (m.folderCharges += 1),
  },
  {
    id: 'slipperyLock',
    name: 'Slippery Lock',
    text: 'A one-way lock is 10 percentage points easier to slip.',
    max: 3,
    apply: (m) => void (m.bypass += 0.1),
  },
  {
    id: 'coldBlood',
    name: 'Cold Blood',
    text: 'Suspicion cools 20% faster once you are out of sight.',
    max: 4,
    apply: (m) => void (m.coolRate *= 1.2),
  },
  {
    id: 'lowProfile',
    name: 'Low Profile',
    text: 'Guards and cameras notice you from 8% less distance.',
    max: 3,
    apply: (m) => void (m.detectRange *= 0.92),
  },
];

export function computeMods(owned: UpgradeId[]): Mods {
  const m: Mods = { ...BASE_MODS };
  for (const id of owned) UPGRADES.find((u) => u.id === id)?.apply(m);
  return m;
}

/** A crew member with every owned upgrade folded into its Folder spec and move speed. */
export function applyUpgrades(crew: CrewMember, owned: UpgradeId[]): CrewMember {
  const m = computeMods(owned);
  return {
    ...crew,
    moveSpeed: crew.moveSpeed * m.moveSpeed,
    folder: {
      ...crew.folder,
      speed: crew.folder.speed * m.folderSpeed,
      lifetime: crew.folder.lifetime * m.folderLifetime,
      cooldown: crew.folder.cooldown * m.folderCooldown,
      charges: crew.folder.charges + m.folderCharges,
      bypass: Math.min(0.95, crew.folder.bypass + m.bypass),
    },
  };
}

/** The mission-rule overrides a set of upgrades produces, for createMission's ruleOverrides. */
export function applyRuleMods(owned: UpgradeId[], base: Rules): Partial<Rules> {
  const m = computeMods(owned);
  return {
    coolRate: base.coolRate * m.coolRate,
    guardRange: base.guardRange * m.detectRange,
    cameraRange: base.cameraRange * m.detectRange,
  };
}

/** How many times this upgrade has already been taken. */
export function countTaken(owned: UpgradeId[], id: UpgradeId): number {
  return owned.filter((x) => x === id).length;
}

/** Up to three upgrades not yet maxed out, offered after a job's first clear. */
export function offerUpgrades(owned: UpgradeId[], rng: () => number): Upgrade[] {
  const pool = UPGRADES.filter((u) => countTaken(owned, u.id) < u.max);
  const picked: Upgrade[] = [];
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = Math.floor(rng() * pool.length);
    picked.push(pool.splice(idx, 1)[0] as Upgrade);
  }
  return picked;
}
