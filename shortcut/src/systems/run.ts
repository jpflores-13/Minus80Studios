import { TUNING } from '../config/tuning';
import type { LevelConfig } from '../levels/types';
import { createCity, stepCity, type CityEvent, type CityState } from './city';
import {
  createEngine,
  setDepots,
  stepEngine,
  type Checkpoint,
  type Engine,
  type EngineEvent,
} from './extrusion';

// One play of a level: the player's layout plus the engine and the city, stepped together.

export interface Layout {
  depots: number[];
  checkpoints: Checkpoint[];
}

export interface Run {
  level: LevelConfig;
  engine: Engine;
  city: CityState;
}

export function startRun(level: LevelConfig, layout: Layout, seed: number): Run {
  const engine = createEngine(level.bins, { ...TUNING.engine, ...level.engine }, seed);
  setDepots(
    engine,
    [...level.fixedDepots, ...layout.depots].map((bin) => ({ bin })),
  );
  engine.checkpoints = [...level.fixedCheckpoints, ...layout.checkpoints];
  return { level, engine, city: createCity(level) };
}

export function stepRun(run: Run, dt: number): (EngineEvent | CityEvent)[] {
  return [
    ...stepEngine(run.engine, dt),
    ...stepCity(run.city, run.level, run.engine, TUNING.city, dt),
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
