import { OBJECTS } from './objects';
import type { GameState } from '../systems/game';
import type { Progress } from '../config/progress';

// Ten milestones, checked right after a level ends. Gameplay fiction, same as everything else
// in this file: no claim about the real star-nosed mole is made by any of these names or texts.

export type AchievementId =
  | 'noseKnows'
  | 'touchAndGo'
  | 'dirtyDancing'
  | 'wormWhisperer'
  | 'underwaterDetective'
  | 'twentyTwoAndCounting'
  | 'wormageddon'
  | 'lordOfTheWorms'
  | 'starPerformer'
  | 'diggyStardom';

export interface AchievementDef {
  id: AchievementId;
  name: string;
  description: string;
}

export const ACHIEVEMENT_ORDER: AchievementId[] = [
  'noseKnows',
  'touchAndGo',
  'dirtyDancing',
  'wormWhisperer',
  'underwaterDetective',
  'twentyTwoAndCounting',
  'wormageddon',
  'lordOfTheWorms',
  'starPerformer',
  'diggyStardom',
];

export const ACHIEVEMENTS: Record<AchievementId, AchievementDef> = {
  noseKnows: { id: 'noseKnows', name: 'Nose Knows', description: 'Identify something by touch.' },
  touchAndGo: {
    id: 'touchAndGo',
    name: 'Touch and Go',
    description: 'Clear a level without digging a single tile.',
  },
  dirtyDancing: {
    id: 'dirtyDancing',
    name: 'Dirty Dancing',
    description: 'Dig 50 tiles, lifetime.',
  },
  wormWhisperer: {
    id: 'wormWhisperer',
    name: 'Worm Whisperer',
    description: 'Eat 100 worms, lifetime.',
  },
  underwaterDetective: {
    id: 'underwaterDetective',
    name: 'Underwater Detective',
    description: 'Have a BUBBLE SNIFF find something.',
  },
  twentyTwoAndCounting: {
    id: 'twentyTwoAndCounting',
    name: '22 and Counting',
    description: 'Touch something with all 22 rays in one level.',
  },
  wormageddon: {
    id: 'wormageddon',
    name: 'WORMAGEDDON',
    description: 'Reach an 8-combo in one level.',
  },
  lordOfTheWorms: {
    id: 'lordOfTheWorms',
    name: 'Lord of the Worms',
    description: 'Eat everything edible in a level.',
  },
  starPerformer: {
    id: 'starPerformer',
    name: 'Star Performer',
    description: 'Earn three stars on every level.',
  },
  diggyStardom: {
    id: 'diggyStardom',
    name: 'Diggy Stardom',
    description: 'Clear every level playing as Diggy.',
  },
};

interface CheckContext {
  /** The level that just ended. */
  state: GameState;
  /** Progress AFTER this level's score, stars and lifetime totals have already been saved. */
  progress: Progress;
  levelCount: number;
}

/** Which of these just became true. Call after saving this level's result, not before. */
export function checkAchievements(ctx: CheckContext): AchievementId[] {
  const { state: s, progress: p, levelCount } = ctx;
  const won = s.status === 'won';
  const have = new Set(p.achievements);
  const earned: AchievementId[] = [];
  const earn = (id: AchievementId) => {
    if (!have.has(id)) earned.push(id);
  };

  if (s.memory.marks.length > 0) earn('noseKnows');
  if (won && s.diggedTiles === 0) earn('touchAndGo');
  if (p.lifetimeDug >= 50) earn('dirtyDancing');
  if (p.lifetimeWormsEaten >= 100) earn('wormWhisperer');
  if (s.bubbleHits > 0) earn('underwaterDetective');
  if (s.touchedRays.size >= 22) earn('twentyTwoAndCounting');
  if (s.bestCombo >= 8) earn('wormageddon');
  if (won && s.things.filter((t) => OBJECTS[t.material].edible).every((t) => !t.alive))
    earn('lordOfTheWorms');
  if (Object.values(p.best).filter((b) => b.stars >= 3).length >= levelCount) earn('starPerformer');
  if (p.character === 'diggy' && Object.keys(p.best).length >= levelCount) earn('diggyStardom');

  return earned;
}
