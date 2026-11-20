import type { EnemyKind, WeaponId } from './arsenal';
import type { Rng } from '../utils/rng';

export type Formation = 'line' | 'arc' | 'sides' | 'cluster' | 'random' | 'v';

export interface SpawnGroup {
  /** Seconds into the wave. */
  at: number;
  kind: EnemyKind;
  count: number;
  formation: Formation;
  /** Repeat every this many seconds until `until`. */
  every?: number;
  until?: number;
}

export interface WaveDef {
  number: number;
  name: string;
  /** One line shown as the wave starts. */
  intro: string;
  duration: number;
  groups: SpawnGroup[];
  /** Ribosome-like obstacles drifting down, per second. */
  obstacleRate: number;
  /** A crowded patch that slows you down. */
  crowding: boolean;
  boss?: EnemyKind;
  /** Offer three upgrades after this wave. */
  upgradeAfter: boolean;
  /** A weapon that becomes available after this wave. */
  unlocks?: WeaponId;
}

const g = (
  at: number,
  kind: EnemyKind,
  count: number,
  formation: Formation,
  every?: number,
  until?: number,
): SpawnGroup => ({
  at,
  kind,
  count,
  formation,
  ...(every ? { every } : {}),
  ...(until ? { until } : {}),
});

export const CAMPAIGN: WaveDef[] = [
  {
    number: 1,
    name: 'Infiltration',
    intro: 'The host is throwing its defences at you! Move to dodge. You fire on your own.',
    duration: 32,
    obstacleRate: 0,
    crowding: false,
    upgradeAfter: true,
    groups: [g(1, 'cutter', 2, 'line', 4, 28), g(14, 'cutter', 4, 'arc'), g(24, 'cutter', 5, 'v')],
  },
  {
    number: 2,
    name: 'Detection',
    intro: 'More Cutters, and Stalkers that come at you from the sides.',
    duration: 40,
    obstacleRate: 0,
    crowding: false,
    upgradeAfter: true,
    unlocks: 'lockdown',
    groups: [
      g(1, 'cutter', 3, 'line', 4, 36),
      g(8, 'stalker', 2, 'sides', 7, 36),
      g(30, 'cutter', 8, 'arc'),
    ],
  },
  {
    number: 3,
    name: 'Molecular Traffic',
    intro: 'Crowded in here. Ribosomes drift past, block your shots and push you aside.',
    duration: 42,
    obstacleRate: 0.35,
    crowding: true,
    upgradeAfter: true,
    groups: [
      g(1, 'cutter', 3, 'random', 3.5, 38),
      g(5, 'stalker', 2, 'sides', 6, 38),
      g(20, 'swarm', 6, 'cluster', 9, 38),
    ],
  },
  {
    number: 4,
    name: 'Immune Response',
    intro: 'Formations, and something very big. Watch for its warning line.',
    duration: 60,
    obstacleRate: 0.15,
    crowding: false,
    upgradeAfter: true,
    boss: 'megacutter',
    unlocks: 'doubleTrouble',
    groups: [g(2, 'cutter', 6, 'v', 8, 50), g(5, 'swarm', 5, 'cluster', 10, 50)],
  },
  {
    number: 5,
    name: 'Reinforcements',
    intro: 'Your charge bar is live. When it’s full, call in reinforcements!',
    duration: 42,
    obstacleRate: 0.2,
    crowding: false,
    upgradeAfter: true,
    unlocks: 'pulse',
    groups: [
      g(1, 'cutter', 4, 'arc', 5, 38),
      g(4, 'stalker', 3, 'sides', 6, 38),
      g(12, 'swarm', 8, 'cluster', 8, 38),
    ],
  },
  {
    number: 6,
    name: 'Counterattack',
    intro: 'Twin Blades and Shredders. Your first weapons won’t touch them.',
    duration: 46,
    obstacleRate: 0.2,
    crowding: true,
    upgradeAfter: true,
    groups: [
      g(1, 'twinblade', 2, 'sides', 6, 42),
      g(6, 'shredder', 1, 'random', 12, 42),
      g(3, 'cutter', 4, 'line', 6, 42),
    ],
  },
  {
    number: 7,
    name: 'The Arms Race',
    intro: 'A Commander keeps changing the attack. Take it out early.',
    duration: 50,
    obstacleRate: 0.25,
    crowding: true,
    upgradeAfter: true,
    groups: [
      g(2, 'commander', 1, 'line', 20, 44),
      g(1, 'cutter', 4, 'v', 6, 46),
      g(4, 'twinblade', 2, 'sides', 8, 46),
      g(10, 'stalker', 3, 'sides', 9, 46),
    ],
  },
  {
    number: 8,
    name: 'Host Takeover',
    intro: 'Everything at once. Survive, and shut down the Prime.',
    duration: 75,
    obstacleRate: 0.25,
    crowding: true,
    upgradeAfter: false,
    boss: 'prime',
    groups: [
      g(2, 'cutter', 5, 'arc', 7, 70),
      g(5, 'swarm', 8, 'cluster', 9, 70),
      g(8, 'twinblade', 2, 'sides', 10, 70),
      g(12, 'shredder', 1, 'random', 15, 70),
    ],
  },
];

const ENDLESS_NAMES = [
  'Hold the Line',
  'Pressure',
  'Swarm Season',
  'No Let-Up',
  'Big Trouble',
  'Second Wind',
  'Crowded House',
  'Escalation',
  'Last Stand',
  'Overdrive',
];

const KINDS: EnemyKind[] = ['cutter', 'stalker', 'swarm', 'twinblade', 'shredder', 'commander'];
const FORMS: Formation[] = ['line', 'arc', 'sides', 'cluster', 'random', 'v'];

/** Endless and Daily waves: generated from a seeded RNG, harder every time. */
export function endlessWave(n: number, rng: Rng): WaveDef {
  const pool = KINDS.slice(0, Math.min(KINDS.length, 2 + Math.floor(n / 2)));
  const groups: SpawnGroup[] = [];
  const count = 3 + Math.floor(n / 2);
  for (let i = 0; i < count; i++) {
    const kind = pool[Math.floor(rng.next() * pool.length)] ?? 'cutter';
    const form = FORMS[Math.floor(rng.next() * FORMS.length)] ?? 'line';
    const size =
      kind === 'swarm'
        ? 5 + Math.floor(n / 3)
        : kind === 'shredder' || kind === 'commander'
          ? 1
          : 2 + Math.floor(n / 3);
    groups.push(g(1 + i * 3, kind, size, form, Math.max(4, 9 - n * 0.4), 40));
  }
  return {
    number: n,
    name: ENDLESS_NAMES[(n - 1) % ENDLESS_NAMES.length] ?? 'Survive',
    intro: n % 5 === 0 ? 'A boss is coming.' : 'Keep going.',
    duration: 42,
    groups,
    obstacleRate: Math.min(0.4, 0.05 * n),
    crowding: n % 3 === 0,
    ...(n % 5 === 0 ? { boss: (n % 10 === 0 ? 'prime' : 'megacutter') as EnemyKind } : {}),
    upgradeAfter: true,
  };
}

/** The same seed for everyone on the same day (local date). */
export function dailySeed(date = new Date()): number {
  const key = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  let h = key ^ 0x9e3779b9;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}
