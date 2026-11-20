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
  /** Machine-seconds of shortcuts joining two different districts. */
  crossDistrictTime: number;
  /** Machine-seconds of all shortcuts (anything longer than a single address). */
  shortcutTime: number;
  /** Seconds where some shortcut joined a supplier to a consumer it can't serve. */
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
  const suppliers = level.buildings.filter((b) => b.role === 'supplier');
  const consumers = level.buildings.filter((b) => b.role === 'consumer');

  let wrong = false;
  for (const m of engine.machines) {
    if (m.left === m.right) continue;
    const dl = districtOf(level, m.left);
    const dr = districtOf(level, m.right);
    city.shortcutTime += dt;
    if (dl && dr && dl !== dr) city.crossDistrictTime += dt;
    for (const s of suppliers) {
      for (const c of consumers) {
        if (!links(m, s, c, params.reach)) continue;
        if (s.resource !== c.resource) {
          wrong = true;
          continue;
        }
        if (!s.active || !c.active) continue;
        if (engine.rng.next() < params.deliverPerSecond * dt) {
          city.deliveries++;
          city.sinceDelivery[c.id] = 0;
          events.push({ type: 'delivered', from: s.id, to: c.id, machineId: m.id });
        }
      }
    }
  }
  if (wrong) city.wrongLinkTime += dt;

  for (const c of consumers) {
    city.sinceDelivery[c.id] = (city.sinceDelivery[c.id] ?? Infinity) + dt;
    if ((city.sinceDelivery[c.id] ?? Infinity) <= params.runningWindow) {
      city.runningTime[c.id] = (city.runningTime[c.id] ?? 0) + dt;
    }
  }
  return events;
}

/** Fraction of elapsed time a consumer has been running. */
export function uptime(city: CityState, consumerId: string): number {
  return city.time > 0 ? (city.runningTime[consumerId] ?? 0) / city.time : 0;
}

export function isRunning(city: CityState, consumerId: string, params: CityParams): boolean {
  return (city.sinceDelivery[consumerId] ?? Infinity) <= params.runningWindow;
}
