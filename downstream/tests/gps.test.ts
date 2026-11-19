import { describe, expect, it } from 'vitest';
import { getLevel } from '../src/levels';
import { scout } from '../src/systems/gps';
import { tally } from '../src/systems/score';
import { createSim } from '../src/systems/sim';

describe('GPS research bottles', () => {
  it('trace a path from the source to the ocean', () => {
    const track = scout(getLevel('level-1'), 'store', 1);
    expect(track.points.length).toBeGreaterThan(10);
    expect(track.outcome).toBe('ocean');
  });

  it('follow the network: a bottle from the north fork reaches the main river', () => {
    const track = scout(getLevel('level-2'), 'apartments', 3);
    expect(track.segmentsVisited).toEqual(['north', 'main']);
  });

  it('can get stuck at snags, which shows up as stops', () => {
    const tracks = [1, 2, 3, 4, 5, 6, 7, 8].map((seed) =>
      scout(getLevel('level-4'), 'houses', seed),
    );
    expect(tracks.some((t) => t.stops.length > 0)).toBe(true);
  });

  it('give different paths for different bottles (incomplete information)', () => {
    const a = scout(getLevel('level-1'), 'store', 1);
    const b = scout(getLevel('level-1'), 'store', 2);
    expect(a.points.map((p) => p.pos)).not.toEqual(b.points.map((p) => p.pos));
  });

  it('are never counted as litter', () => {
    const level = getLevel('level-1');
    scout(level, 'store', 1);
    expect(tally(createSim(level, {}).items).potential).toBe(0);
  });
});
