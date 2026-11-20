import type { Rng } from '../utils/rng';

// WORMAGEDDON's own upgrade list. Same pick-one-of-three pattern DR. ANTI-CRISPR uses for its
// wave upgrades: a plain multiplier object, a pool of upgrades with a stack limit, offered at
// random and applied on pick. Gameplay fiction, same as everything else in this mode.

export interface WormageddonMods {
  /** Multiplies how much evidence each touch gives (SUPER SNOOT). */
  senseMult: number;
  /** Multiplies how long touch marks and scent last (STAR MEMORY). */
  memoryMult: number;
  /** Px radius edible things get gently pulled toward you from (WORM MAGNET). 0 = off. */
  magnetRadius: number;
  /** Extra max energy, added on top of your character's own (BIG APPETITE). */
  maxEnergyBonus: number;
  /** Multiplies dig speed (DIG DEEP). */
  digSpeedMult: number;
  /** Multiplies BUBBLE SNIFF's range (BUBBLE MASTER). */
  bubbleRangeMult: number;
  /** Multiplies BUBBLE SNIFF's cooldown, lower is faster (BUBBLE MASTER). */
  bubbleCooldownMult: number;
  /** Multiplies the cooldown between bites, lower is faster (QUICK BITE). */
  biteCooldownMult: number;
  /** Extra seconds added to the combo window (COMBO KING). */
  comboWindowBonus: number;
  /** Extra score multiplier on top of the combo multiplier (COMBO KING). */
  comboScoreBonus: number;
  /** Multiplies move speed while swimming, which is slower than land here (MUD SKIPPER). */
  waterSpeedMult: number;
}

export const BASE_WORMAGEDDON_MODS: WormageddonMods = {
  senseMult: 1,
  memoryMult: 1,
  magnetRadius: 0,
  maxEnergyBonus: 0,
  digSpeedMult: 1,
  bubbleRangeMult: 1,
  bubbleCooldownMult: 1,
  biteCooldownMult: 1,
  comboWindowBonus: 0,
  comboScoreBonus: 0,
  waterSpeedMult: 1,
};

export type WormageddonUpgradeId =
  | 'superSnoot'
  | 'starMemory'
  | 'wormMagnet'
  | 'bigAppetite'
  | 'digDeep'
  | 'bubbleMaster'
  | 'quickBite'
  | 'comboKing'
  | 'mudSkipper';

export interface WormageddonUpgrade {
  id: WormageddonUpgradeId;
  name: string;
  text: string;
  /** How many times it can be taken. */
  max: number;
  apply: (m: WormageddonMods) => void;
}

export const WORMAGEDDON_UPGRADES: WormageddonUpgrade[] = [
  {
    id: 'superSnoot',
    name: 'Super Snoot',
    text: 'Every touch tells you 25% more.',
    max: 4,
    apply: (m) => void (m.senseMult *= 1.25),
  },
  {
    id: 'starMemory',
    name: 'Star Memory',
    text: 'Touch marks and scent last 30% longer.',
    max: 4,
    apply: (m) => void (m.memoryMult *= 1.3),
  },
  {
    id: 'wormMagnet',
    name: 'Worm Magnet',
    text: 'Edible things within reach gently drift toward you.',
    max: 3,
    apply: (m) => void (m.magnetRadius += 36),
  },
  {
    id: 'bigAppetite',
    name: 'Big Appetite',
    text: 'Max energy up by 20.',
    max: 5,
    apply: (m) => void (m.maxEnergyBonus += 20),
  },
  {
    id: 'digDeep',
    name: 'Dig Deep',
    text: 'Dig 25% faster.',
    max: 4,
    apply: (m) => void (m.digSpeedMult *= 1.25),
  },
  {
    id: 'bubbleMaster',
    name: 'Bubble Master',
    text: 'BUBBLE SNIFF reaches 25% farther and recharges 20% faster.',
    max: 4,
    apply: (m) => {
      m.bubbleRangeMult *= 1.25;
      m.bubbleCooldownMult *= 0.8;
    },
  },
  {
    id: 'quickBite',
    name: 'Quick Bite',
    text: 'Bite 20% more often.',
    max: 4,
    apply: (m) => void (m.biteCooldownMult *= 0.8),
  },
  {
    id: 'comboKing',
    name: 'Combo King',
    text: 'A full second added to your combo window, and every combo scores 15% more.',
    max: 4,
    apply: (m) => {
      m.comboWindowBonus += 1;
      m.comboScoreBonus += 0.15;
    },
  },
  {
    id: 'mudSkipper',
    name: 'Mud Skipper',
    text: 'Swim 25% faster.',
    max: 4,
    apply: (m) => void (m.waterSpeedMult *= 1.25),
  },
];

/** Offer `n` random upgrades, excluding anything already taken the maximum number of times. */
export function offerWormageddonUpgrades(
  taken: Partial<Record<WormageddonUpgradeId, number>>,
  rng: Rng,
  n = 3,
): WormageddonUpgrade[] {
  const open = WORMAGEDDON_UPGRADES.filter((u) => (taken[u.id] ?? 0) < u.max);
  const picks: WormageddonUpgrade[] = [];
  while (picks.length < n && open.length) {
    const i = Math.floor(rng.next() * open.length);
    picks.push(...open.splice(i, 1));
  }
  return picks;
}
