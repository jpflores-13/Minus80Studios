import { TUNING } from '../config/tuning';
import type { LevelConfig } from '../levels/types';
import { createCity, stepCity, type CityEvent, type CityParams, type CityState } from './city';
import {
  createEngine,
  setDepots,
  stepEngine,
  type Checkpoint,
  type Engine,
  type EngineEvent,
  type EngineParams,
} from './extrusion';

// One play of a level: the player's layout plus the engine and the city, stepped together.

export interface Layout {
  depots: number[];
  checkpoints: Checkpoint[];
  /** Chosen option index for each policy dial (Level 6). */
  policy?: PolicyChoice;
}

export interface PolicyChoice {
  lifetime: number;
  loading: number;
  fleet: number;
}

export interface Run {
  level: LevelConfig;
  engine: Engine;
  city: CityState;
  cityParams: CityParams;
  weatherStarted: boolean;
}

export function policyCost(level: LevelConfig, choice: PolicyChoice): number {
  const p = level.policies;
  if (!p) return 0;
  return (
    (p.lifetime[choice.lifetime]?.cost ?? 0) +
    (p.loading[choice.loading]?.cost ?? 0) +
    (p.fleet[choice.fleet]?.cost ?? 0)
  );
}

export const DEFAULT_POLICY: PolicyChoice = { lifetime: 0, loading: 0, fleet: 0 };

export function startRun(level: LevelConfig, layout: Layout, seed: number): Run {
  const params = { ...TUNING.engine, ...level.engine };
  const pol = level.policies;
  if (pol) {
    const c = layout.policy ?? DEFAULT_POLICY;
    params.lifetimeMean = pol.lifetime[c.lifetime]?.value ?? params.lifetimeMean;
    params.loadInterval = pol.loading[c.loading]?.value ?? params.loadInterval;
    params.fleet = pol.fleet[c.fleet]?.value ?? params.fleet;
  }
  const engine = createEngine(level.bins, params, seed);
  setDepots(
    engine,
    [...level.fixedDepots, ...layout.depots].map((bin) => ({ bin })),
  );
  engine.checkpoints = [...level.fixedCheckpoints, ...layout.checkpoints].map((c) => ({ ...c }));
  engine.routes = level.routes ?? [];
  return {
    level,
    engine,
    city: createCity(level),
    cityParams: { ...TUNING.city },
    weatherStarted: false,
  };
}

export function stepRun(run: Run, dt: number): (EngineEvent | CityEvent)[] {
  const w = run.level.weather;
  if (w && !run.weatherStarted && run.engine.time >= w.at) {
    run.weatherStarted = true;
    for (const c of run.engine.checkpoints) c.reliability *= w.reliability;
    run.cityParams.runningWindow = w.runningWindow;
  }
  return [
    ...stepEngine(run.engine, dt),
    ...stepCity(run.city, run.level, run.engine, run.cityParams, dt),
  ];
}

export function isFinished(run: Run): boolean {
  return run.engine.time >= run.level.durationSeconds - 1e-9;
}

/** Runs a whole level without drawing anything (tests, balance checks). */
export function simulate(level: LevelConfig, layout: Layout, seed: number): Run {
  const run = startRun(level, layout, seed);
  while (!isFinished(run)) stepRun(run, TUNING.step);
  return run;
}

export function checkpoint(bin: number, facing: 1 | -1): Checkpoint {
  return { bin, facing, reliability: TUNING.checkpointReliability };
}

/** Settings the sandbox and Blueprint can change on top of a level. */
export interface Overrides {
  engine?: Partial<EngineParams>;
  /** Replaces every checkpoint's reliability. */
  reliability?: number;
  /** Trucks per second on each of the level's routes. */
  trafficRate?: number;
}

/**
 * Runs a level for `seconds` with no drawing, for maps and statistics. Same seed, same layout and
 * same overrides always give the same result, so comparisons are fair and reproducible.
 */
export function measure(
  level: LevelConfig,
  layout: Layout,
  seed: number,
  seconds: number,
  o: Overrides = {},
): Run {
  const tuned: LevelConfig = {
    ...level,
    durationSeconds: seconds,
    engine: { ...level.engine, ...o.engine },
    ...(level.routes && o.trafficRate !== undefined
      ? { routes: level.routes.map((r) => ({ ...r, rate: o.trafficRate ?? r.rate })) }
      : {}),
  };
  const l: Layout =
    o.reliability === undefined
      ? layout
      : {
          ...layout,
          checkpoints: layout.checkpoints.map((c) => ({
            ...c,
            reliability: o.reliability ?? c.reliability,
          })),
        };
  const run = startRun(tuned, l, seed);
  while (!isFinished(run)) stepRun(run, TUNING.step);
  return run;
}
