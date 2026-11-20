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

/** A delivery route: trucks enter at `from` and drive to `to`, one address at a time. */
export interface Route {
  from: number;
  to: number;
  /** Trucks per second entering the route. */
  rate: number;
}

export interface Vehicle {
  id: number;
  pos: number;
  dir: 1 | -1;
  route: number;
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
  /** Addresses per second a truck drives (traffic levels only). */
  truckSpeed?: number;
  /** Chance a truck pushes a machine end it drives into, one address along. */
  trafficPush?: number;
  /** Chance an end can't step into an address where a truck is coming the other way. */
  trafficBlock?: number;
}

export interface Engine {
  bins: number;
  params: EngineParams;
  rng: Rng;
  time: number;
  machines: Machine[];
  depots: Depot[];
  checkpoints: Checkpoint[];
  routes: Route[];
  vehicles: Vehicle[];
  loadTimers: number[];
  nextId: number;
  /**
   * Time-weighted contact propensity for each pair of addresses (see sampleContacts).
   * Sampled every SAMPLE_EVERY seconds of simulated time.
   */
  contacts: Float64Array;
  /** Simulated time since the last contact sample. */
  sinceSample: number;
  /** Total machines that have come and gone (for stats). */
  released: number;
  /** Machine-seconds spent at each realized shortcut length (right - left). */
  lengthTime: Float64Array;
  /**
   * Machine-seconds at each potential span: how long the shortcut would be by now with nothing
   * in its way (twice the average pace times its age, capped at the road length).
   */
  potentialTime: Float64Array;
}

export type EngineEvent =
  | { type: 'loaded'; machineId: number; bin: number }
  | { type: 'released'; machineId: number; left: number; right: number }
  | { type: 'stalled'; machineId: number; side: 'left' | 'right'; bin: number }
  | { type: 'pushed'; machineId: number; side: 'left' | 'right'; bin: number };

export function createEngine(bins: number, params: EngineParams, seed: number): Engine {
  return {
    bins,
    params,
    rng: createRng(seed),
    time: 0,
    machines: [],
    depots: [],
    checkpoints: [],
    routes: [],
    vehicles: [],
    loadTimers: [],
    nextId: 1,
    contacts: new Float64Array(bins * bins),
    sinceSample: 0,
    released: 0,
    lengthTime: new Float64Array(bins),
    potentialTime: new Float64Array(bins),
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

  events.push(...stepTraffic(e, dt));

  e.sinceSample += dt;
  if (e.sinceSample >= SAMPLE_EVERY - 1e-9) {
    sampleContacts(e, e.sinceSample);
    e.sinceSample = 0;
  }

  // Shortcut lengths, realized and potential.
  for (const m of e.machines) {
    const len = m.right - m.left;
    e.lengthTime[len] = (e.lengthTime[len] ?? 0) + dt;
    const potential = Math.min(e.bins - 1, Math.round(2 * p.speed * m.age));
    e.potentialTime[potential] = (e.potentialTime[potential] ?? 0) + dt;
  }
  return events;
}

/** How often (simulated seconds) the contact map is sampled. Sampling uses no randomness. */
export const SAMPLE_EVERY = 0.5;

/**
 * A deliberately simple contact model. Two addresses are "close" according to their effective
 * distance: the fewest steps between them along the road, where every shortcut counts as a
 * single step between its two ends. Contact propensity falls off as 1 / distance (a common
 * polymer-style scaling, chosen for its shape, not fitted to data). Shortcuts therefore make
 * bright dots at their ends, squares where many nest inside the same boundaries, and stripes
 * where one end is held while the other moves.
 */
function sampleContacts(e: Engine, weight: number): void {
  const n = e.bins;
  const partners: number[][] = Array.from({ length: n }, () => []);
  for (const m of e.machines) {
    if (m.right - m.left < 2) continue;
    partners[m.left]?.push(m.right);
    partners[m.right]?.push(m.left);
  }
  const dist = new Int32Array(n);
  const queue = new Int32Array(n);
  for (let src = 0; src < n; src++) {
    dist.fill(-1);
    dist[src] = 0;
    let head = 0;
    let tail = 0;
    queue[tail++] = src;
    while (head < tail) {
      const a = queue[head++] ?? 0;
      const d = (dist[a] ?? 0) + 1;
      const visit = (b: number) => {
        if (b >= 0 && b < n && dist[b] === -1) {
          dist[b] = d;
          queue[tail++] = b;
        }
      };
      visit(a - 1);
      visit(a + 1);
      for (const b of partners[a] ?? []) visit(b);
    }
    for (let b = 0; b < n; b++) {
      if (b === src) continue;
      const i = src * n + b;
      e.contacts[i] = (e.contacts[i] ?? 0) + weight / Math.max(1, dist[b] ?? n);
    }
  }
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
  // A truck coming the other way may hold the end up.
  const oncoming = e.vehicles.some((v) => v.pos === next && v.dir === -dir);
  if (oncoming && e.rng.next() < (p.trafficBlock ?? 0)) return [];
  return moveTo(e, m, side, dir) ? checkpointAt(e, m, side, dir) : [];
}

/** Moves one end one address, unless the road ends, another machine is there, or it would cross its own other end. */
function moveTo(e: Engine, m: Machine, side: 'left' | 'right', dir: 1 | -1): boolean {
  const next = m[side] + dir;
  if (next < 0 || next >= e.bins) return false; // edge of the map
  if (isEnd(e, next, m.id)) return false; // another machine is in the way
  if (side === 'left' ? next > m.right : next < m.left) return false;
  m[side] = next;
  return true;
}

/** A checkpoint facing against the direction of travel may stop this end where it now stands. */
function checkpointAt(e: Engine, m: Machine, side: 'left' | 'right', dir: 1 | -1): EngineEvent[] {
  const bin = m[side];
  const cp = e.checkpoints.find((c) => c.bin === bin && c.facing === -dir);
  if (cp && e.rng.next() < cp.reliability) {
    m[side === 'left' ? 'leftStalled' : 'rightStalled'] = true;
    return [{ type: 'stalled', machineId: m.id, side, bin }];
  }
  return [];
}

// Trucks drive their routes. A truck that drives into a machine end may push it along one
// address; an end held at a checkpoint usually stays put (as reliably as the checkpoint holds).
function stepTraffic(e: Engine, dt: number): EngineEvent[] {
  const p = e.params;
  const events: EngineEvent[] = [];
  e.routes.forEach((r, i) => {
    if (e.rng.next() < r.rate * dt)
      e.vehicles.push({ id: e.nextId++, pos: r.from, dir: r.to >= r.from ? 1 : -1, route: i });
  });
  for (const v of e.vehicles) {
    if (e.rng.next() >= (p.truckSpeed ?? 3) * dt) continue;
    v.pos += v.dir;
    for (const m of e.machines) {
      for (const side of ['left', 'right'] as const) {
        if (m[side] !== v.pos || e.rng.next() >= (p.trafficPush ?? 0)) continue;
        const stalledKey = side === 'left' ? 'leftStalled' : 'rightStalled';
        if (m[stalledKey]) {
          const holder = e.checkpoints.find((c) => c.bin === m[side]);
          if (holder && e.rng.next() < holder.reliability) continue;
        }
        if (!moveTo(e, m, side, v.dir)) continue;
        m[stalledKey] = false;
        events.push({ type: 'pushed', machineId: m.id, side, bin: m[side] });
        events.push(...checkpointAt(e, m, side, v.dir));
      }
    }
  }
  e.vehicles = e.vehicles.filter((v) => {
    const r = e.routes[v.route];
    return r !== undefined && (v.dir === 1 ? v.pos <= r.to : v.pos >= r.to);
  });
  return events;
}

function isEnd(e: Engine, bin: number, exceptId?: number): boolean {
  return e.machines.some((m) => m.id !== exceptId && (m.left === bin || m.right === bin));
}

function exponential(rng: Rng, mean: number): number {
  return -Math.log(1 - rng.next()) * mean;
}

/** Time-averaged contact propensity between two addresses (0-1), from sampleContacts. */
export function connectivity(e: Engine, a: number, b: number): number {
  return e.time > 0 ? (e.contacts[a * e.bins + b] ?? 0) / e.time : 0;
}
