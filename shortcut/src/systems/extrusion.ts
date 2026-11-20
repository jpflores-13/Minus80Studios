import { createRng, type Rng } from '../utils/rng';

// Shortcut-building machines on a one-dimensional road of numbered addresses ("bins").
//
// A machine loads at a depot with both ends on the same address, then each end moves
// outward on its own, one address at a time, at a random pace. An end stops when it hits
// the edge of the road or another machine's end, and may stop at a checkpoint: a checkpoint
// facing right (→) stops ends that are moving LEFT, a checkpoint facing left (←) stops ends
// moving RIGHT. A stopped end sometimes slips past. Machines last a random time, then leave.
//
// No Phaser here: everything is plain data so it can be tested and reused by any renderer.

export type Facing = 1 | -1; // 1 = →, -1 = ←

export interface Checkpoint {
  bin: number;
  facing: Facing;
  /** Chance (0-1) that an arriving end stops here. */
  reliability: number;
}

export interface Depot {
  bin: number;
}

export interface Machine {
  id: number;
  left: number;
  right: number;
  loadedAt: number;
  age: number;
  lifetime: number;
  leftStalled: boolean;
  rightStalled: boolean;
}

export interface EngineParams {
  /** Addresses per second each free end moves, on average. */
  speed: number;
  /** Average machine lifetime (s); actual lifetimes are random (exponential). */
  lifetimeMean: number;
  /** Average wait (s) between loads at a depot when the fleet has room. */
  loadInterval: number;
  /** Chance per second that a stopped end slips past its checkpoint. */
  bypassPerSecond: number;
  /** Most machines on the road at once. */
  fleet: number;
}

export interface Engine {
  bins: number;
  params: EngineParams;
  rng: Rng;
  time: number;
  machines: Machine[];
  depots: Depot[];
  checkpoints: Checkpoint[];
  loadTimers: number[];
  nextId: number;
  /** Time-weighted count of how long each pair of addresses was joined by a shortcut. */
  contacts: Float64Array;
  /** Total machines that have come and gone (for stats). */
  released: number;
}

export type EngineEvent =
  | { type: 'loaded'; machineId: number; bin: number }
  | { type: 'released'; machineId: number; left: number; right: number }
  | { type: 'stalled'; machineId: number; side: 'left' | 'right'; bin: number };

export function createEngine(bins: number, params: EngineParams, seed: number): Engine {
  return {
    bins,
    params,
    rng: createRng(seed),
    time: 0,
    machines: [],
    depots: [],
    checkpoints: [],
    loadTimers: [],
    nextId: 1,
    contacts: new Float64Array(bins * bins),
    released: 0,
  };
}

export function setDepots(e: Engine, depots: Depot[]): void {
  e.depots = depots;
  e.loadTimers = depots.map(() => 0);
}

export function stepEngine(e: Engine, dt: number): EngineEvent[] {
  const events: EngineEvent[] = [];
  e.time += dt;
  const p = e.params;

  // Release: machines whose lifetime is over leave the road.
  for (const m of e.machines) m.age += dt;
  for (const m of e.machines.filter((x) => x.age >= x.lifetime)) {
    events.push({ type: 'released', machineId: m.id, left: m.left, right: m.right });
    e.released++;
  }
  e.machines = e.machines.filter((m) => m.age < m.lifetime);

  // Loading at depots, while the fleet has room.
  e.depots.forEach((d, i) => {
    e.loadTimers[i] = (e.loadTimers[i] ?? 0) - dt;
    if ((e.loadTimers[i] ?? 0) > 0 || e.machines.length >= p.fleet) return;
    if (isEnd(e, d.bin)) return; // something is already sitting there
    const m: Machine = {
      id: e.nextId++,
      left: d.bin,
      right: d.bin,
      loadedAt: e.time,
      age: 0,
      lifetime: exponential(e.rng, p.lifetimeMean),
      leftStalled: false,
      rightStalled: false,
    };
    e.machines.push(m);
    e.loadTimers[i] = exponential(e.rng, p.loadInterval);
    events.push({ type: 'loaded', machineId: m.id, bin: d.bin });
  });

  // Extrusion: each end moves on its own.
  for (const m of e.machines) {
    events.push(...moveEnd(e, m, 'left', dt));
    events.push(...moveEnd(e, m, 'right', dt));
  }

  // Connectivity: every machine joins its two end addresses for this slice of time.
  for (const m of e.machines) {
    if (m.left === m.right) continue;
    e.contacts[m.left * e.bins + m.right] = (e.contacts[m.left * e.bins + m.right] ?? 0) + dt;
    e.contacts[m.right * e.bins + m.left] = (e.contacts[m.right * e.bins + m.left] ?? 0) + dt;
  }
  return events;
}

function moveEnd(e: Engine, m: Machine, side: 'left' | 'right', dt: number): EngineEvent[] {
  const p = e.params;
  const stalledKey = side === 'left' ? 'leftStalled' : 'rightStalled';

  if (m[stalledKey]) {
    if (e.rng.next() < p.bypassPerSecond * dt) m[stalledKey] = false;
    else return [];
  }
  // Random pace: on average `speed` steps per second (needs speed * dt <= 1).
  if (e.rng.next() >= p.speed * dt) return [];

  const dir = side === 'left' ? -1 : 1;
  const next = m[side] + dir;
  if (next < 0 || next >= e.bins) return []; // edge of the map
  if (isEnd(e, next, m.id)) return []; // another machine is in the way
  m[side] = next;

  // A checkpoint facing against the direction of travel may stop this end here.
  const cp = e.checkpoints.find((c) => c.bin === next && c.facing === -dir);
  if (cp && e.rng.next() < cp.reliability) {
    m[stalledKey] = true;
    return [{ type: 'stalled', machineId: m.id, side, bin: next }];
  }
  return [];
}

function isEnd(e: Engine, bin: number, exceptId?: number): boolean {
  return e.machines.some((m) => m.id !== exceptId && (m.left === bin || m.right === bin));
}

function exponential(rng: Rng, mean: number): number {
  return -Math.log(1 - rng.next()) * mean;
}

/** Time-averaged connection between two addresses, normalised by elapsed time. */
export function connectivity(e: Engine, a: number, b: number): number {
  return e.time > 0 ? (e.contacts[a * e.bins + b] ?? 0) / e.time : 0;
}
