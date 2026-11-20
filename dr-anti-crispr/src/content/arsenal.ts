// Enemies, weapons and which weapon works on which enemy. This file is for scientific
// collaborators to refine: change compatibility, odds and durations here, not in the engine.
// "inspiredBy" labels are loose inspirations for fictional characters and are marked for review.
// The game never claims these are real mechanisms; see docs/SCIENCE.md.

export type EnemyKind =
  'cutter' | 'stalker' | 'twinblade' | 'shredder' | 'swarm' | 'commander' | 'megacutter' | 'prime';
export type WeaponId = 'blockade' | 'lockdown' | 'doubleTrouble' | 'pulse';
/** How an inhibited enemy looks and behaves. Shape-coded so it reads without colour. */
export type InhibitState = 'blocked' | 'locked' | 'linked' | 'frozen';

export interface EnemyDef {
  kind: EnemyKind;
  name: string;
  inspiredBy: string;
  /** px per second */
  speed: number;
  /** Genome damage per second while touching the hero. */
  damage: number;
  /** Size of the hit circle, px. */
  radius: number;
  /** Compatible hits needed before it is inhibited (bosses need many). */
  resistance: number;
  points: number;
  behaviour:
    'chase' | 'stalk' | 'zigzag' | 'slow-beam' | 'swarm' | 'command' | 'boss-lunge' | 'boss-sweep';
  color: number;
}

export const ENEMIES: Record<EnemyKind, EnemyDef> = {
  cutter: {
    kind: 'cutter',
    name: 'The Cutter',
    inspiredBy: 'Cas9 (REVIEW)',
    speed: 70,
    damage: 14,
    radius: 20,
    resistance: 1,
    points: 10,
    behaviour: 'chase',
    color: 0xd6334a,
  },
  stalker: {
    kind: 'stalker',
    name: 'The Stalker',
    inspiredBy: 'guided target surveillance (REVIEW)',
    speed: 95,
    damage: 10,
    radius: 16,
    resistance: 1,
    points: 15,
    behaviour: 'stalk',
    color: 0x9b4fd6,
  },
  twinblade: {
    kind: 'twinblade',
    name: 'The Twin Blade',
    inspiredBy: 'Cas12a (REVIEW)',
    speed: 85,
    damage: 16,
    radius: 18,
    resistance: 2,
    points: 20,
    behaviour: 'zigzag',
    color: 0xc23ab0,
  },
  shredder: {
    kind: 'shredder',
    name: 'The Shredder',
    inspiredBy: 'Cas3-associated defence (REVIEW)',
    speed: 40,
    damage: 30,
    radius: 26,
    resistance: 3,
    points: 30,
    behaviour: 'slow-beam',
    color: 0x8f1f3a,
  },
  swarm: {
    kind: 'swarm',
    name: 'The Swarm',
    inspiredBy: 'multi-protein CRISPR complexes (REVIEW)',
    speed: 80,
    damage: 6,
    radius: 10,
    resistance: 1,
    points: 5,
    behaviour: 'swarm',
    color: 0xe0607a,
  },
  commander: {
    kind: 'commander',
    name: 'The Commander',
    inspiredBy: 'CRISPR adaptation machinery (REVIEW)',
    speed: 35,
    damage: 8,
    radius: 24,
    resistance: 4,
    points: 50,
    behaviour: 'command',
    color: 0x6a3fd6,
  },
  megacutter: {
    kind: 'megacutter',
    name: 'MEGA CUTTER',
    inspiredBy: 'fictional boss',
    speed: 45,
    damage: 25,
    radius: 60,
    resistance: 40,
    points: 500,
    behaviour: 'boss-lunge',
    color: 0xd6334a,
  },
  prime: {
    kind: 'prime',
    name: 'HOST DEFENCE PRIME',
    inspiredBy: 'fictional boss',
    speed: 30,
    damage: 30,
    radius: 70,
    resistance: 70,
    points: 1000,
    behaviour: 'boss-sweep',
    color: 0x6a3fd6,
  },
};

export interface WeaponDef {
  id: WeaponId;
  name: string;
  inspiredBy: string;
  /** What it does in the game, in plain words. */
  blurb: string;
  /** Shots per second. */
  rate: number;
  /** px per second */
  projectileSpeed: number;
  /** px */
  range: number;
  /** Chance a compatible hit counts toward inhibition. */
  chance: number;
  /** Seconds an inhibited enemy stays disabled before drifting away. */
  duration: number;
  compatible: EnemyKind[];
  effect: InhibitState;
  /** Wave after which it can be equipped (0 = from the start). */
  unlockAfter: number;
  color: number;
}

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  blockade: {
    id: 'blockade',
    name: 'BLOCKADE',
    inspiredBy: 'AcrIIA4 (REVIEW)',
    blurb: 'Puts a shield in front of a machine so it can’t reach its target.',
    rate: 2.2,
    projectileSpeed: 520,
    range: 520,
    chance: 0.85,
    duration: 3,
    compatible: ['cutter', 'stalker', 'swarm', 'megacutter'],
    effect: 'blocked',
    unlockAfter: 0,
    color: 0x4fe0c0,
  },
  lockdown: {
    id: 'lockdown',
    name: 'LOCKDOWN',
    inspiredBy: 'AcrIIC1 (REVIEW)',
    blurb: 'Locks a machine’s blades. It can still drift about, but it can’t hurt your genome.',
    rate: 1.6,
    projectileSpeed: 460,
    range: 560,
    chance: 0.9,
    duration: 4,
    compatible: ['cutter', 'stalker', 'commander', 'megacutter', 'prime'],
    effect: 'locked',
    unlockAfter: 2,
    color: 0x9ff0d0,
  },
  doubleTrouble: {
    id: 'doubleTrouble',
    name: 'DOUBLE TROUBLE',
    inspiredBy: 'AcrIIC3 (REVIEW)',
    blurb: 'Ties two machines together so neither can attack.',
    rate: 1.0,
    projectileSpeed: 420,
    range: 480,
    chance: 1,
    duration: 4,
    compatible: ['cutter', 'stalker'],
    effect: 'linked',
    unlockAfter: 4,
    color: 0x7fd0ff,
  },
  pulse: {
    id: 'pulse',
    name: 'PULSE',
    inspiredBy: 'fictional; to be assigned after scientific review',
    blurb: 'A fictional wide shot that works on the machines the others can’t touch.',
    rate: 1.3,
    projectileSpeed: 400,
    range: 460,
    chance: 0.7,
    duration: 3.5,
    compatible: ['twinblade', 'shredder', 'prime'],
    effect: 'frozen',
    unlockAfter: 5,
    color: 0xb0ffe8,
  },
};

export const WEAPON_ORDER: WeaponId[] = ['blockade', 'lockdown', 'doubleTrouble', 'pulse'];

/** ACR CLOUD: a fictional area power (not a specific real mechanism). */
export const CLOUD = {
  radius: 170,
  duration: 2.5,
  cooldown: 12,
  holds: 'frozen' as InhibitState,
  unlockAfter: 2,
};

/** Phage Reinforcements: an abstract, fictional take on many phages helping each other. */
export const REINFORCEMENTS = { charge: 100, allies: 4, duration: 6, shotRate: 3, unlockAfter: 4 };

export function compatible(weapon: WeaponId, enemy: EnemyKind): boolean {
  return WEAPONS[weapon].compatible.includes(enemy);
}
