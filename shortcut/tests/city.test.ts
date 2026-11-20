import { describe, expect, it } from 'vitest';
import { TUNING } from '../src/config/tuning';
import { createCity, links, stepCity, uptime } from '../src/systems/city';
import { createEngine, type Machine } from '../src/systems/extrusion';
import type { Building, LevelConfig } from '../src/levels/types';
import { level3 } from '../src/levels/level3';

const machine = (left: number, right: number): Machine => ({
  id: 1,
  left,
  right,
  loadedAt: 0,
  age: 0,
  lifetime: 1e9,
  leftStalled: false,
  rightStalled: false,
});

const b = (
  id: string,
  bin: number,
  role: Building['role'],
  resource: Building['resource'],
): Building => ({
  id,
  name: id,
  kind: 'bakery',
  role,
  resource,
  bin,
  active: true,
});

const level = (buildings: Building[]): LevelConfig => ({ ...level3, buildings, districts: [] });

describe('links', () => {
  it('needs one end near each building', () => {
    const s = b('s', 5, 'supplier', 'bread');
    const c = b('c', 20, 'consumer', 'bread');
    expect(links(machine(5, 20), s, c, 1)).toBe(true);
    expect(links(machine(4, 21), s, c, 1)).toBe(true);
    expect(links(machine(5, 22), s, c, 1)).toBe(false);
    expect(links(machine(10, 20), s, c, 1)).toBe(false);
  });
});

describe('deliveries', () => {
  const run = (buildings: Building[], m: Machine, seconds = 30) => {
    const lv = level(buildings);
    const e = createEngine(40, TUNING.engine, 1);
    e.machines = [m];
    const city = createCity(lv);
    for (let t = 0; t < seconds; t += 0.05) stepCity(city, lv, e, TUNING.city, 0.05);
    return city;
  };

  it('a held shortcut delivers often but not every moment', () => {
    const city = run(
      [b('s', 5, 'supplier', 'bread'), b('c', 20, 'consumer', 'bread')],
      machine(5, 20),
    );
    expect(city.deliveries).toBeGreaterThan(15);
    expect(city.deliveries).toBeLessThan(30 / 0.05);
    expect(uptime(city, 'c')).toBeGreaterThan(0.8);
  });

  it('no delivery when the supplier makes the wrong thing', () => {
    const city = run(
      [b('s', 5, 'supplier', 'power'), b('c', 20, 'consumer', 'bread')],
      machine(5, 20),
    );
    expect(city.deliveries).toBe(0);
    expect(city.wrongLinkTime).toBeGreaterThan(0);
    expect(uptime(city, 'c')).toBe(0);
  });

  it('no delivery without a shortcut between them', () => {
    const city = run(
      [b('s', 5, 'supplier', 'bread'), b('c', 20, 'consumer', 'bread')],
      machine(8, 12),
    );
    expect(city.deliveries).toBe(0);
  });

  it('counts shortcuts that cross districts as mix-ups', () => {
    const lv = level3;
    const e = createEngine(lv.bins, TUNING.engine, 1);
    e.machines = [machine(10, 25)];
    const city = createCity(lv);
    for (let t = 0; t < 10; t += 0.05) stepCity(city, lv, e, TUNING.city, 0.05);
    expect(city.crossDistrictTime / city.shortcutTime).toBeCloseTo(1);
  });
});
