import type { EnemyKind } from './arsenal';

// Gameplay notes for the Enemy Intel screen: what each machine actually does, not science.
// Entries unlock the first time you meet one in a run; see content/science.ts for the real
// biology this game is loosely inspired by.

export const BESTIARY_ORDER: EnemyKind[] = [
  'cutter',
  'stalker',
  'swarm',
  'twinblade',
  'shredder',
  'commander',
  'megacutter',
  'prime',
];

export const BEHAVIOUR: Record<EnemyKind, string> = {
  cutter: 'Chases you directly. Slow and simple, but there are a lot of them.',
  stalker: 'Faster than a Cutter and lines up its approach before closing in.',
  swarm: 'Weak alone, but comes in clusters. Dangerous in a crowd.',
  twinblade: 'Darts in sharp zigzags. Harder to lead a shot on than it looks.',
  shredder: 'Slow, but telegraphs a beam attack first. Watch the warning line, then move.',
  commander: 'Keeps changing which Cutters and Swarms show up. Worth stopping early.',
  megacutter: 'A boss. Telegraphs a lunge, then rushes straight at you. Dodge the line.',
  prime: 'The final boss. Its beam sweeps slowly, and it keeps calling in Swarms.',
};
