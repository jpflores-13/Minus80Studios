import type { FolderSpec } from '../content/crew';
import { createEngine, stepEngine, type Engine, type Machine } from './extrusion';

// The Folder. It runs on the same engine as before: once deployed at a position on the corridor,
// its left and right ends each reel in one position at a time, on their own, at a random pace.
// Anchors stop an end that reaches them. The fold lets go when its time is up or you release it.
// While its ends are apart, the two positions they hold are linked.

export interface Folds {
  engine: Engine;
  spec: FolderSpec;
  charges: number;
  cooldown: number;
  /** Where each active fold was deployed, by fold id. */
  origins: Map<number, number>;
}

export function createFolds(
  pathLength: number,
  anchors: number[],
  spec: FolderSpec,
  seed: number,
): Folds {
  const engine = createEngine(
    pathLength,
    {
      speed: spec.speed,
      lifetimeMean: spec.lifetime,
      loadInterval: 1e9,
      bypassPerSecond: 0,
      fleet: spec.devices,
    },
    seed,
  );
  // an anchor holds an end coming from either side
  engine.checkpoints = anchors.flatMap((bin) => [
    { bin, facing: 1 as const, reliability: 1 },
    { bin, facing: -1 as const, reliability: 1 },
  ]);
  return { engine, spec, charges: spec.charges, cooldown: 0, origins: new Map() };
}

export function active(f: Folds): Machine[] {
  return f.engine.machines;
}

export function canDeploy(f: Folds, index: number): boolean {
  return (
    index >= 0 &&
    index < f.engine.bins &&
    f.cooldown <= 0 &&
    f.charges > 0 &&
    f.engine.machines.length < f.spec.devices &&
    !f.engine.machines.some((m) => index >= m.left && index <= m.right)
  );
}

/** Deploy at a corridor position. Returns false if it can't go there right now. */
export function deploy(f: Folds, index: number): boolean {
  if (!canDeploy(f, index)) return false;
  const id = f.engine.nextId++;
  f.origins.set(id, index);
  f.engine.machines.push({
    id,
    left: index,
    right: index,
    loadedAt: f.engine.time,
    age: 0,
    lifetime: f.spec.lifetime,
    leftStalled: false,
    rightStalled: false,
  });
  f.charges--;
  return true;
}

/** Let go of every active fold (or one, by id). */
export function release(f: Folds, id?: number): void {
  const before = f.engine.machines.length;
  f.engine.machines = f.engine.machines.filter((m) => id !== undefined && m.id !== id);
  if (f.engine.machines.length < before) f.cooldown = f.spec.cooldown;
}

export function stepFolds(f: Folds, dt: number): { released: number } {
  const before = f.engine.machines.length;
  stepEngine(f.engine, dt);
  f.cooldown = Math.max(0, f.cooldown - dt);
  const released = before - f.engine.machines.length;
  if (released > 0) f.cooldown = f.spec.cooldown;
  return { released };
}

/** The linked pairs of corridor positions right now (ends at least two apart). */
export function links(f: Folds): [number, number][] {
  return f.engine.machines.filter((m) => m.right - m.left >= 2).map((m) => [m.left, m.right]);
}

/** Seconds left on the oldest active fold, or 0. */
export function timeLeft(f: Folds): number {
  return Math.max(0, ...f.engine.machines.map((m) => m.lifetime - m.age));
}
