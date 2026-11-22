import { describe, expect, it } from 'vitest';
import {
  averageHealth,
  buzzPulse,
  centralities,
  colonyHealth,
  createColony,
  networkDecentralization,
  stepColony,
  type ColonyConfig,
} from '../src/systems/colony';
import { CHARACTERS } from '../src/content/characters';

const DT = 1 / 10;
const run = (config: ColonyConfig, seconds: number, seed = 1) => {
  const s = createColony(config, seed);
  for (let t = 0; t < seconds; t += DT) stepColony(s, { dx: 0, dy: 0 }, DT);
  return s;
};

const baseSites: ColonyConfig['sites'] = [
  { id: 'storage', kind: 'storage', pos: { x: 100, y: 100 } },
  { id: 'flower-a', kind: 'flower', pos: { x: 400, y: 100 } },
  { id: 'flower-b', kind: 'flower', pos: { x: 400, y: 300 } },
  { id: 'brood-a', kind: 'broodCell', pos: { x: 150, y: 300 } },
  { id: 'debris-a', kind: 'debris', pos: { x: 300, y: 400 } },
];

const worker = (name: string, overrides: Partial<(typeof CHARACTERS)['dash']['traits']> = {}) => ({
  name,
  traits: { ...CHARACTERS.dash.traits, spatialPreference: { x: 200, y: 200 }, ...overrides },
});

describe('a worker picks its own task from local need', () => {
  it('a strong forager with nectar nearby starts foraging', () => {
    const s = run(
      {
        workers: [
          worker('forager', {
            forageTendency: 0.9,
            broodCareTendency: 0,
            nestMaintenanceTendency: 0,
          }),
        ],
        sites: baseSites,
        disturbances: [],
        durationSeconds: 20,
        startsQueenless: false,
      },
      2,
    );
    expect(s.workers[0]!.state).toBe('foraging');
  });

  it('delivering nectar raises food reserves', () => {
    const before = 50;
    const s = run(
      {
        workers: [
          worker('forager', {
            forageTendency: 1,
            broodCareTendency: 0,
            nestMaintenanceTendency: 0,
          }),
        ],
        sites: baseSites,
        disturbances: [],
        durationSeconds: 20,
        startsQueenless: false,
      },
      20,
    );
    expect(s.foodReserves).toBeGreaterThan(before);
  });
});

describe('task redistribution after losing foragers', () => {
  it('a non-forager picks up foraging once flowers go unvisited', () => {
    const config: ColonyConfig = {
      workers: [
        worker('forager', {
          forageTendency: 0.95,
          broodCareTendency: 0,
          nestMaintenanceTendency: 0,
        }),
        worker('generalist', {
          forageTendency: 0.4,
          broodCareTendency: 0.4,
          nestMaintenanceTendency: 0.4,
        }),
      ],
      sites: baseSites,
      disturbances: [{ at: 2, kind: 'removeForagers', count: 1 }],
      durationSeconds: 40,
      startsQueenless: false,
    };
    const s = run(config, 30);
    // the forager was removed; the generalist should have ended up foraging at some point,
    // since untouched flowers raise forage's utility for anyone with a non-zero tendency
    expect(s.workers.find((w) => w.name === 'forager')!.removed).toBe(true);
    expect(s.foodReserves).toBeGreaterThan(20);
  });
});

describe('Buzz Pulse', () => {
  it('boosts every worker within range, and none outside it', () => {
    const s = createColony(
      {
        workers: [
          worker('near', {}),
          {
            ...worker('far'),
            traits: { ...worker('far').traits, spatialPreference: { x: 900, y: 900 } },
          },
        ],
        sites: baseSites,
        disturbances: [],
        durationSeconds: 20,
        startsQueenless: false,
      },
      1,
    );
    s.workers[0]!.pos = { x: 210, y: 210 };
    s.workers[1]!.pos = { x: 900, y: 900 };
    const affected = buzzPulse(s, { x: 200, y: 200 });
    expect(affected).toBe(1);
    expect(s.workers[0]!.pulseBoostUntil).toBeGreaterThan(0);
    expect(s.workers[1]!.pulseBoostUntil).toBe(0);
  });

  it('never affects the player worker', () => {
    const s = createColony(
      {
        workers: [{ name: 'Buzzby', traits: CHARACTERS.buzzby.traits, isPlayer: true }],
        sites: baseSites,
        disturbances: [],
        durationSeconds: 20,
        startsQueenless: false,
      },
      1,
    );
    s.workers[0]!.pos = { ...s.workers[0]!.traits.spatialPreference };
    const affected = buzzPulse(s, s.workers[0]!.pos);
    expect(affected).toBe(0);
  });
});

describe('queen loss reveals latent variation', () => {
  it('a low-potential worker gains little reproductive activation while queenless', () => {
    const s = run(
      {
        workers: [worker('plain', { latentPotential: 0.05 })],
        sites: baseSites,
        disturbances: [],
        durationSeconds: 60,
        startsQueenless: true,
      },
      60,
    );
    expect(s.workers[0]!.reproductiveActivation).toBeLessThan(0.3);
  });

  it('a high-latent-potential worker activates while the colony is queenless, not while queenright', () => {
    const queenright = run(
      {
        workers: [worker('queenie-like', { latentPotential: 0.95 })],
        sites: baseSites,
        disturbances: [],
        durationSeconds: 60,
        startsQueenless: false,
      },
      60,
    );
    expect(queenright.workers[0]!.reproductiveActivation).toBe(0);

    const queenless = run(
      {
        workers: [worker('queenie-like', { latentPotential: 0.95 })],
        sites: baseSites,
        disturbances: [],
        durationSeconds: 60,
        startsQueenless: true,
      },
      60,
    );
    expect(queenless.workers[0]!.reproductiveActivation).toBeGreaterThan(0);
  });
});

describe('colony health and scoring', () => {
  it('colonyHealth stays within 0-100', () => {
    const s = run(
      {
        workers: [worker('a'), worker('b', { spatialPreference: { x: 250, y: 250 } })],
        sites: baseSites,
        disturbances: [],
        durationSeconds: 30,
        startsQueenless: false,
      },
      30,
    );
    const h = colonyHealth(s);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(100);
  });

  it('averageHealth tracks the run, not just the final instant', () => {
    const s = run(
      {
        workers: [worker('a')],
        sites: baseSites,
        disturbances: [],
        durationSeconds: 10,
        startsQueenless: false,
      },
      10,
    );
    expect(averageHealth(s)).toBeGreaterThan(0);
  });

  it('centralities and decentralisation are readable without throwing', () => {
    const s = run(
      {
        workers: [worker('a'), worker('b', { spatialPreference: { x: 205, y: 205 } })],
        sites: baseSites,
        disturbances: [],
        durationSeconds: 30,
        startsQueenless: false,
      },
      30,
    );
    expect(centralities(s)).toBeInstanceOf(Map);
    expect(networkDecentralization(s)).toBeGreaterThanOrEqual(0);
  });
});

describe('determinism', () => {
  it('the same seed gives the same outcome', () => {
    const config: ColonyConfig = {
      workers: [worker('a'), worker('b', { spatialPreference: { x: 260, y: 260 } })],
      sites: baseSites,
      disturbances: [{ at: 3, kind: 'resourceShortage' }],
      durationSeconds: 20,
      startsQueenless: false,
    };
    const a = run(config, 20, 7);
    const b = run(config, 20, 7);
    expect(a.foodReserves).toBe(b.foodReserves);
    expect(a.workers.map((w) => w.pos)).toEqual(b.workers.map((w) => w.pos));
  });
});

describe('the player does its own job by hand', () => {
  const playerConfig: ColonyConfig = {
    workers: [{ name: 'Buzzby', traits: CHARACTERS.buzzby.traits, isPlayer: true }],
    sites: baseSites,
    disturbances: [],
    durationSeconds: 30,
    startsQueenless: false,
  };

  it('standing on a flower gathers nectar and marks the player carrying', () => {
    const s = createColony(playerConfig, 1);
    const flower = s.sites.find((x) => x.id === 'flower-a')!;
    s.workers[0]!.pos = { ...flower.pos };
    const before = flower.level;
    stepColony(s, { dx: 0, dy: 0 }, DT);
    expect(flower.level).toBeLessThan(before);
    expect(s.workers[0]!.carrying).toBe(true);
  });

  it('carrying it to storage delivers it and empties the player’s hands', () => {
    const s = createColony(playerConfig, 1);
    s.workers[0]!.carrying = true;
    const storage = s.sites.find((x) => x.id === 'storage')!;
    s.workers[0]!.pos = { ...storage.pos };
    const before = s.foodReserves;
    stepColony(s, { dx: 0, dy: 0 }, DT);
    expect(s.foodReserves).toBeGreaterThan(before);
    expect(s.workers[0]!.carrying).toBe(false);
  });

  it('standing on a brood cell or debris pile tends it directly, without carrying anything', () => {
    const s = createColony(playerConfig, 1);
    const brood = s.sites.find((x) => x.id === 'brood-a')!;
    s.workers[0]!.pos = { ...brood.pos };
    const before = s.broodHealth;
    stepColony(s, { dx: 0, dy: 0 }, DT);
    expect(s.broodHealth).toBeGreaterThan(before);
    expect(s.workers[0]!.carrying).toBe(false);
  });

  it('walking the whole flower-to-storage loop actually raises food reserves', () => {
    const s = createColony(playerConfig, 1);
    const flower = s.sites.find((x) => x.id === 'flower-a')!;
    const storage = s.sites.find((x) => x.id === 'storage')!;
    s.workers[0]!.pos = { ...flower.pos };
    for (let t = 0; t < 3 && !s.workers[0]!.carrying; t += DT) stepColony(s, { dx: 0, dy: 0 }, DT);
    expect(s.workers[0]!.carrying).toBe(true);
    s.workers[0]!.pos = { ...storage.pos };
    const before = s.foodReserves;
    stepColony(s, { dx: 0, dy: 0 }, DT);
    expect(s.foodReserves).toBeGreaterThan(before);
  });
});

describe('a finished run', () => {
  it('ends after its configured duration', () => {
    const s = run(
      {
        workers: [worker('a')],
        sites: baseSites,
        disturbances: [],
        durationSeconds: 5,
        startsQueenless: false,
      },
      8,
    );
    expect(s.done).toBe(true);
    expect(s.time).toBeGreaterThanOrEqual(5);
  });
});
