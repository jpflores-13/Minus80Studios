import { ARCADE } from '../config/tuning';
import type { Segment } from '../systems/plant';
import { ALL_FEATURES, baseConfig, matureRhizome } from './builders';
import type { DirectorContext, SessionConfig } from './types';

// O2 RUSH: endless arcade growth. Difficulty raises the *amount* of biology (more roots, more
// branching, more rhizomes, more artefacts) rather than its speed: growth rate and time
// compression stay fixed, so the link between growth and oxygen stays readable.

export type RushMode = 'classic' | 'endless' | 'zen' | 'timelapse';

export const RUSH_MODES: { id: RushMode; name: string; help: string }[] = [
  {
    id: 'classic',
    name: 'CLASSIC RUSH',
    help: '90 seconds. Document as many distinct oxygenation events as you can.',
  },
  {
    id: 'endless',
    name: 'ENDLESS MUCK',
    help: 'No clock, but every pool that fades away undocumented is a data gap. Six gaps ends the run.',
  },
  {
    id: 'zen',
    name: 'ZEN OPTODE',
    help: 'No timer, no penalties, no artefacts. Just watch the roots grow and document what you like.',
  },
  {
    id: 'timelapse',
    name: 'TIME-LAPSE CHALLENGE',
    help: 'Predict where the next oxygen pools will appear, then fast-forward a day to see. Five rounds.',
  },
];

export interface Difficulty {
  maxGrowingRoots: number;
  emergenceEveryHours: number;
  lateralDelayHours: number;
  distractorRate: number;
  maxRhizomes: number;
}

/** Difficulty after `sec` game seconds. Monotonic and capped. */
export function rushDifficulty(sec: number): Difficulty {
  const t = Math.min(1, sec / 150);
  return {
    maxGrowingRoots: Math.round(3 + t * 9),
    emergenceEveryHours: 12 - t * 8,
    lateralDelayHours: 70 - t * 30,
    distractorRate: 0.12 + t * 0.55,
    maxRhizomes: 1 + Math.floor(t * 3),
  };
}

const HOURS_PER_SECOND = 2;

export function rushConfig(mode: RushMode, seed: number): SessionConfig {
  const b = baseConfig();
  const zen = mode === 'zen';
  const makeDirector = () => {
    let nextEmergence = 0;
    let nextRhizomeSec = 25;
    return (ctx: DirectorContext) => {
      const d = rushDifficulty(zen ? 40 : ctx.gameSec);
      const { plant, rng } = ctx;
      plant.opts.maxGrowingRoots = d.maxGrowingRoots;
      plant.opts.lateralDelayHours = d.lateralDelayHours;
      ctx.setDistractorRate(zen ? 0 : d.distractorRate);
      if (ctx.simHour >= nextEmergence) {
        nextEmergence = ctx.simHour + d.emergenceEveryHours * rng.range(0.7, 1.3);
        const rhizomes = plant.segments.filter((s) => s.organ === 'rhizome');
        const parent: Segment | undefined = rhizomes[Math.floor(rng.range(0, rhizomes.length))];
        if (parent && parent.points.length > 4) {
          const p = parent.points[Math.floor(rng.range(2, parent.points.length - 1))]!;
          plant.scheduleRoots(parent.id, p.x, p.y, ctx.simHour, 1 + Math.floor(rng.range(0, 2)));
        }
      }
      const rhizomes = plant.segments.filter((s) => s.organ === 'rhizome' && s.growing).length;
      if (ctx.gameSec >= nextRhizomeSec && rhizomes < d.maxRhizomes) {
        nextRhizomeSec = ctx.gameSec + 30;
        const dir = rng.next() < 0.5 ? 1 : -1;
        const x = dir === 1 ? rng.range(60, 400) : rng.range(880, 1220);
        plant.addRhizome(x, rng.range(226, 250), dir, ctx.simHour, plant.ramets.length);
      }
    };
  };
  return {
    ...b,
    id: `rush-${mode}`,
    title: RUSH_MODES.find((m) => m.id === mode)!.name,
    duration: mode === 'classic' ? 90 : Infinity,
    hoursPerSecond: HOURS_PER_SECOND,
    startHour: 10,
    warmupHours: 40,
    dayNight: true,
    nightBonus: true,
    growth: { growthBoost: 2.6, adventitiousDelayHours: 26, rhizomeMaxLength: 420 },
    setup: (plant, rng, t0) => {
      const x0 = rng.range(100, 300);
      const x1 = rng.range(900, 1180);
      const { seg, nodes } = matureRhizome(plant, x0, x1, rng.range(228, 244), t0 - 600);
      for (let i = 0; i < 3; i++) {
        const n = nodes[Math.floor(rng.range(0, nodes.length))];
        if (n) plant.scheduleRoots(seg.id, n.x, n.y, t0 + i * 10, 1);
      }
    },
    makeDirector,
    distractorRate: 0,
    features: ALL_FEATURES,
    objectives: [],
    targetScore: mode === 'classic' ? 10000 : 0,
    music: zen ? 'zen' : 'rush',
    seed,
    maxDataGaps: mode === 'endless' ? ARCADE.endlessDataGaps : 0,
  };
}

/** Time-Lapse Challenge: points for each prediction marker near a pool that newly appeared. */
export function scorePredictions(
  markers: { x: number; y: number }[],
  appeared: { x: number; y: number }[],
): {
  points: number;
  hits: number;
  details: { marker: number; distance: number; points: number }[];
} {
  const used = new Set<number>();
  const details: { marker: number; distance: number; points: number }[] = [];
  let points = 0;
  let hits = 0;
  markers.forEach((m, mi) => {
    let best = -1;
    let bestD = Infinity;
    appeared.forEach((a, ai) => {
      if (used.has(ai)) return;
      const d = Math.hypot(a.x - m.x, a.y - m.y);
      if (d < bestD) {
        bestD = d;
        best = ai;
      }
    });
    const p = best >= 0 ? Math.max(0, Math.round(400 - bestD * 2.5)) : 0;
    if (p > 0) {
      used.add(best);
      hits++;
    }
    points += p;
    details.push({ marker: mi, distance: bestD, points: p });
  });
  return { points, hits, details };
}

/** How far a Time-Lapse Challenge round fast-forwards (sim hours). */
export const PREDICTION_HOURS = 24;
export const PREDICTION_ROUNDS = 5;
export const PREDICTION_MARKERS = 3;
