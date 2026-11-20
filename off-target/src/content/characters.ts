// Characters, abilities and compatibility. This file is meant to be edited by scientific
// collaborators: which hero can stop which boss, and at which stage, lives here, not in the engine.
// Every "inspiredBy" line is a loose inspiration for a fictional character, not a claim about
// mechanism. See docs/SCIENCE.md before changing anything marked REVIEW.

export type HeroId = 'ace' | 'block' | 'lock' | 'freeze';
export type BossKind = 'chop' | 'snip';

/** A boss works through these stages, in order. Cleavage at the end means the cut happened. */
export const BOSS_STAGES = ['searching', 'recognition', 'engagement', 'cleavage'] as const;
export type BossStage = (typeof BOSS_STAGES)[number];

export const STAGE_LABELS: Record<BossStage, string> = {
  searching: 'SEARCHING',
  recognition: 'LOCKING ON',
  engagement: 'GRIPPING',
  cleavage: 'CUTTING',
};

export interface Compatibility {
  boss: BossKind;
  /** The hero must act before the boss reaches this stage. */
  before: BossStage;
  /** 'stop' ends the boss's countdown for good; 'freeze' only holds it for a while. */
  effect: 'stop' | 'freeze';
}

export interface Hero {
  id: HeroId;
  name: string;
  title: string;
  inspiredBy: string;
  ability: string;
  limitation: string;
  /** Movement multipliers on top of the base physics. */
  speed: number;
  jump: number;
  works: Compatibility[];
  /** How long a freeze holds a boss (s), for 'freeze' effects. */
  freezeSeconds?: number;
  /** Stage number that unlocks this hero (0 = from the start). */
  unlockedAfter: number;
  color: number;
}

export const HEROES: Record<HeroId, Hero> = {
  ace: {
    id: 'ace',
    name: 'ACE',
    title: 'The Original',
    inspiredBy: 'anti-CRISPR proteins in general',
    ability: 'Stops CHOP before it cuts.',
    limitation: 'Only works on CHOP.',
    speed: 1,
    jump: 1,
    works: [{ boss: 'chop', before: 'cleavage', effect: 'stop' }],
    unlockedAfter: 0,
    color: 0xf2b632,
  },
  block: {
    id: 'block',
    name: 'BLOCK',
    title: 'The Gatekeeper',
    inspiredBy: 'AcrIIA4 (REVIEW)',
    ability: 'Interrupts target recognition. Fast on its feet.',
    limitation: 'Must reach CHOP before it grips the DNA.',
    speed: 1.15,
    jump: 1,
    works: [{ boss: 'chop', before: 'engagement', effect: 'stop' }],
    unlockedAfter: 2,
    color: 0xf5d16a,
  },
  lock: {
    id: 'lock',
    name: 'LOCK',
    title: 'The Saboteur',
    inspiredBy: 'AcrIIC1-like inhibition of cutting (REVIEW)',
    ability: 'Jams the cutting blades, even while gripping.',
    limitation: 'Works only on SNIP.',
    speed: 0.95,
    jump: 1.05,
    works: [{ boss: 'snip', before: 'cleavage', effect: 'stop' }],
    unlockedAfter: 4,
    color: 0xe39a3b,
  },
  freeze: {
    id: 'freeze',
    name: 'FREEZE',
    title: 'The Immobilizer',
    inspiredBy: 'a fictional archetype (no specific protein yet: REVIEW)',
    ability: 'Freezes any boss for a while. Jumps high.',
    limitation: 'Only holds them; someone has to finish the job.',
    speed: 1,
    jump: 1.15,
    works: [
      { boss: 'chop', before: 'cleavage', effect: 'freeze' },
      { boss: 'snip', before: 'cleavage', effect: 'freeze' },
    ],
    freezeSeconds: 8,
    unlockedAfter: 4,
    color: 0xffe28a,
  },
};

export const HERO_ORDER: HeroId[] = ['ace', 'block', 'lock', 'freeze'];

export interface BossInfo {
  kind: BossKind;
  name: string;
  inspiredBy: string;
  blurb: string;
  color: number;
}

export const BOSSES: Record<BossKind, BossInfo> = {
  chop: {
    kind: 'chop',
    name: 'CHOP',
    inspiredBy: 'Cas9',
    blurb:
      'A big, careful cutting machine. It follows GUIDE, and it isn’t evil: it just cuts where it is sent.',
    color: 0xb23a6b,
  },
  snip: {
    kind: 'snip',
    name: 'SNIP',
    inspiredBy: 'a different CRISPR cutting machine (fictional; to be assigned after review)',
    blurb: 'Smaller and quicker than CHOP, with a different set of blades.',
    color: 0x7a3fc4,
  },
};

/** What happens if this hero uses its power on this boss at this stage. */
export function interaction(
  hero: Hero,
  boss: BossKind,
  stage: BossStage,
): { ok: true; effect: 'stop' | 'freeze' } | { ok: false; reason: 'incompatible' | 'too-late' } {
  const rule = hero.works.find((w) => w.boss === boss);
  if (!rule) return { ok: false, reason: 'incompatible' };
  if (BOSS_STAGES.indexOf(stage) >= BOSS_STAGES.indexOf(rule.before))
    return { ok: false, reason: 'too-late' };
  return { ok: true, effect: rule.effect };
}
