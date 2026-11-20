import type { Building, LevelConfig } from '../levels/types';
import type { Engine, Machine } from './extrusion';

// The city on top of the engine. A consumer is "linked" to a supplier when a machine's two
// ends sit near both of them. A link only makes delivery LIKELY: each second a linked,
// compatible, active pair has a chance to deliver. Consumers count as running if they got a
// delivery recently. Performance is tracked as rolling averages, never a single moment.

export interface CityState {
  deliveries: number;
  /** Per consumer: time since its last delivery (s). */
  sinceDelivery: Record<string, number>;
  /** Per consumer: seconds spent running. */
  runningTime: Record<string, number>;
  /** Per consumer: seconds it was open (needing deliveries). */
  activeTime: Record<string, number>;
  /** Machine-seconds of shortcuts joining two different districts. */
  crossDistrictTime: number;
  /** Machine-seconds of all shortcuts (anything longer than a single address). */
  shortcutTime: number;
  /** Machine-seconds of shortcuts joining two open buildings that can't use each other. */
  wrongLinkTime: number;
  time: number;
}

export interface CityParams {
  /** How close (in addresses) a machine end must be to a building to link it. */
  reach: number;
  /** Chance per second that a linked, compatible pair makes a delivery. */
  deliverPerSecond: number;
  /** A consumer counts as running for this long after a delivery (s). */
  runningWindow: number;
}

export type CityEvent = { type: 'delivered'; from: string; to: string; machineId: number };

export function createCity(level: LevelConfig): CityState {
  const consumers = level.buildings.filter((b) => b.role === 'consumer');
  return {
    deliveries: 0,
    sinceDelivery: Object.fromEntries(consumers.map((c) => [c.id, Infinity])),
    runningTime: Object.fromEntries(consumers.map((c) => [c.id, 0])),
    activeTime: Object.fromEntries(consumers.map((c) => [c.id, 0])),
    crossDistrictTime: 0,
    shortcutTime: 0,
    wrongLinkTime: 0,
    time: 0,
  };
}

export function links(m: Machine, a: Building, b: Building, reach: number): boolean {
  const [lo, hi] = a.bin < b.bin ? [a, b] : [b, a];
  return Math.abs(m.left - lo.bin) <= reach && Math.abs(m.right - hi.bin) <= reach;
}

export function isOpen(b: Building, time: number): boolean {
  return b.active && time >= (b.activeFrom ?? 0);
}

/** A supplier and a consumer of the same thing. Anything else joined by a shortcut is a wrong connection. */
export function compatible(a: Building, b: Building): boolean {
  return a.role !== b.role && a.resource === b.resource;
}

export function districtOf(level: LevelConfig, bin: number): string | null {
  return level.districts.find((d) => bin >= d.from && bin <= d.to)?.id ?? null;
}

export function stepCity(
  city: CityState,
  level: LevelConfig,
  engine: Engine,
  params: CityParams,
  dt: number,
): CityEvent[] {
  const events: CityEvent[] = [];
  city.time += dt;
  const open = level.buildings.filter((b) => isOpen(b, city.time));
  const consumers = level.buildings.filter((b) => b.role === 'consumer');

  for (const m of engine.machines) {
    if (m.left === m.right) continue;
    const dl = districtOf(level, m.left);
    const dr = districtOf(level, m.right);
    city.shortcutTime += dt;
    if (dl && dr && dl !== dr) city.crossDistrictTime += dt;
    let wrong = false;
    for (let i = 0; i < open.length; i++) {
      for (let j = i + 1; j < open.length; j++) {
        const a = open[i]!;
        const b = open[j]!;
        if (a.bin === b.bin || !links(m, a, b, params.reach)) continue;
        if (!compatible(a, b)) {
          wrong = true;
          continue;
        }
        const [s, c] = a.role === 'supplier' ? [a, b] : [b, a];
        if (engine.rng.next() < params.deliverPerSecond * dt) {
          city.deliveries++;
          city.sinceDelivery[c.id] = 0;
          events.push({ type: 'delivered', from: s.id, to: c.id, machineId: m.id });
        }
      }
    }
    if (wrong) city.wrongLinkTime += dt;
  }

  for (const c of consumers) {
    city.sinceDelivery[c.id] = (city.sinceDelivery[c.id] ?? Infinity) + dt;
    if (!isOpen(c, city.time)) continue;
    city.activeTime[c.id] = (city.activeTime[c.id] ?? 0) + dt;
    if ((city.sinceDelivery[c.id] ?? Infinity) <= params.runningWindow) {
      city.runningTime[c.id] = (city.runningTime[c.id] ?? 0) + dt;
    }
  }
  return events;
}

/** Fraction of the time a consumer was open that it was running. */
export function uptime(city: CityState, consumerId: string): number {
  const open = city.activeTime[consumerId] ?? 0;
  return open > 0 ? (city.runningTime[consumerId] ?? 0) / open : 0;
}

export function isRunning(city: CityState, consumerId: string, params: CityParams): boolean {
  return (city.sinceDelivery[consumerId] ?? Infinity) <= params.runningWindow;
}
