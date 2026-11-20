import { describe, expect, it } from 'vitest';
import { compatible, ENEMIES, WEAPONS, WEAPON_ORDER, type EnemyKind } from '../src/content/arsenal';
import { UPGRADES } from '../src/content/upgrades';
import { CAMPAIGN, dailySeed, endlessWave } from '../src/content/waves';
import { createRng } from '../src/utils/rng';
import { Pool } from '../src/systems/pool';
import {
  HOST_PORTS,
  chooseUpgrade,
  createWorld,
  FIELD,
  finalScore,
  inhibit,
  NO_INPUT,
  onBeam,
  spawn,
  stepWorld,
  type World,
  type WorldEvent,
} from '../src/systems/world';

const DT = 1 / 60;
const run = (w: World, seconds: number, input = NO_INPUT) => {
  const ev: WorldEvent[] = [];
  for (let t = 0; t < seconds && w.phase === 'playing'; t += DT)
    ev.push(...stepWorld(w, input, DT));
  return ev;
};
/** A world with no scheduled spawns, for isolated tests. */
const quiet = (seed = 1) => {
  const w = createWorld('campaign', 'normal', seed);
  w.wave = { ...w.wave, groups: [], duration: 999 };
  return w;
};
const place = (w: World, kind: EnemyKind, x: number, y: number) => {
  spawn(w, kind, 1, 'line');
  const e = w.enemies.live().at(-1)!;
  e.x = x;
  e.y = y;
  e.launch = 0; // already landed
  return e;
};

describe('compatibility table', () => {
  it('every enemy can be inhibited by at least one weapon', () => {
    for (const kind of Object.keys(ENEMIES) as EnemyKind[])
      expect(
        WEAPON_ORDER.some((w) => compatible(w, kind)),
        kind,
      ).toBe(true);
  });

  it('no weapon works on everything', () => {
    for (const w of WEAPON_ORDER)
      expect(WEAPONS[w].compatible.length).toBeLessThan(Object.keys(ENEMIES).length);
  });
});

describe('enemies', () => {
  it('Cutters move toward the hero', () => {
    const w = quiet();
    const e = place(w, 'cutter', 360, 300);
    const d0 = Math.hypot(e.x - w.hero.x, e.y - w.hero.y);
    w.equipped = [];
    run(w, 1);
    expect(Math.hypot(e.x - w.hero.x, e.y - w.hero.y)).toBeLessThan(d0);
  });

  it('touching an active enemy damages genome integrity', () => {
    const w = quiet();
    w.equipped = [];
    place(w, 'cutter', w.hero.x, w.hero.y);
    const ev = run(w, 0.5);
    expect(w.hero.integrity).toBeLessThan(100);
    expect(ev.some((e) => e.type === 'hurt')).toBe(true);
  });

  it('an inhibited enemy does no damage', () => {
    const w = quiet();
    w.equipped = [];
    const e = place(w, 'cutter', w.hero.x, w.hero.y);
    inhibit(w, e, 'blockade', []);
    run(w, 0.5);
    expect(w.hero.integrity).toBe(100);
  });

  it('Shredders telegraph before their beam', () => {
    const w = quiet();
    w.equipped = [];
    const e = place(w, 'shredder', w.hero.x, w.hero.y - 200);
    const ev = run(w, 6);
    expect(ev.some((x) => x.type === 'telegraph')).toBe(true);
    void e;
  });

  it('a beam covers a narrow strip along its aim', () => {
    const w = quiet();
    const e = place(w, 'shredder', 100, 100);
    e.attack = { kind: 'beam', t: 1, dx: 1, dy: 0 };
    expect(onBeam(e, 300, 110)).toBe(true);
    expect(onBeam(e, 300, 200)).toBe(false);
    expect(onBeam(e, 50, 100)).toBe(false);
  });
});

describe('the host launches its defences', () => {
  it('new machines are thrown out of a port in the host wall, then land in formation', () => {
    const w = quiet();
    w.equipped = [];
    spawn(w, 'cutter', 3, 'line');
    for (const e of w.enemies.live()) {
      expect(HOST_PORTS).toContain(e.x);
      expect(e.y).toBeLessThan(FIELD.top);
      expect(e.launch).toBeGreaterThan(0);
    }
    run(w, 1);
    for (const e of w.enemies.live()) {
      expect(e.launch).toBeLessThanOrEqual(0);
      expect(e.y).toBeGreaterThan(FIELD.top);
    }
  });

  it('shutting a machine down charges reinforcements (no pickups to chase)', () => {
    const w = quiet();
    w.stats.wavesCleared = 5;
    const e = place(w, 'cutter', 300, 500);
    inhibit(w, e, 'blockade', []);
    expect(w.charge).toBeGreaterThan(0);
  });
});

describe('weapons and inhibition', () => {
  it('auto-fire targets compatible enemies and inhibits them', () => {
    const w = quiet();
    place(w, 'cutter', w.hero.x, w.hero.y - 300);
    const ev = run(w, 3);
    expect(ev.some((e) => e.type === 'inhibited')).toBe(true);
    expect(w.stats.byWeapon.blockade).toBeGreaterThan(0);
  });

  it('incompatible shots are resisted and change nothing', () => {
    const w = quiet();
    w.autoAim = false; // fire straight up whatever is there
    const e = place(w, 'twinblade', w.hero.x, w.hero.y - 200);
    e.frozenFor = 99;
    run(w, 2);
    expect(e.state).toBe('active');
    expect(w.stats.resisted).toBeGreaterThan(0);
  });

  it('a boss needs many compatible hits', () => {
    const w = quiet();
    const boss = place(w, 'megacutter', w.hero.x, w.hero.y - 300);
    boss.frozenFor = 999;
    run(w, 1);
    expect(boss.state).toBe('active');
    expect(boss.hits).toBeGreaterThan(0);
  });

  it('DOUBLE TROUBLE links two nearby compatible enemies', () => {
    const w = quiet();
    const a = place(w, 'cutter', 300, 500);
    const b = place(w, 'cutter', 360, 520);
    const ev: WorldEvent[] = [];
    inhibit(w, a, 'doubleTrouble', ev);
    expect(a.state).toBe('inhibited');
    expect(b.inhibit).toBe('linked');
    expect(a.partner).toBe(b);
    expect(ev.filter((e) => e.type === 'inhibited')).toHaveLength(2);
  });

  it('inhibited enemies eventually leave the field', () => {
    const w = quiet();
    w.equipped = [];
    const e = place(w, 'cutter', 360, 500);
    inhibit(w, e, 'blockade', []);
    run(w, 10);
    expect(e.alive).toBe(false);
  });

  it('ACR Cloud freezes everything nearby, but only for a while', () => {
    const w = quiet();
    w.stats.wavesCleared = 5;
    w.equipped = [];
    const e = place(w, 'twinblade', w.hero.x + 60, w.hero.y - 60);
    stepWorld(w, { ...NO_INPUT, cloud: true }, DT);
    expect(e.frozenFor).toBeGreaterThan(0);
    expect(e.state).toBe('active');
    expect(w.cloudCooldown).toBeGreaterThan(0);
  });

  it('reinforcements need a full charge and send allies', () => {
    const w = quiet();
    w.stats.wavesCleared = 5;
    stepWorld(w, { ...NO_INPUT, reinforce: true }, DT);
    expect(w.allies).toHaveLength(0);
    w.charge = 100;
    stepWorld(w, { ...NO_INPUT, reinforce: true }, DT);
    expect(w.allies.length).toBeGreaterThan(0);
    expect(w.charge).toBe(0);
  });
});

describe('waves, upgrades and the end', () => {
  it('a wave ends after its time, then offers three upgrades', () => {
    const w = createWorld('campaign', 'normal', 3);
    w.hero.integrity = 1e9;
    const ev = run(w, CAMPAIGN[0]!.duration + 1);
    expect(ev.some((e) => e.type === 'waveClear')).toBe(true);
    expect(w.phase).toBe('upgrade');
    expect(w.offers).toHaveLength(3);
  });

  it('choosing an upgrade applies it and starts the next wave', () => {
    const w = createWorld('campaign', 'normal', 3);
    w.phase = 'upgrade';
    w.offers = [UPGRADES.find((u) => u.id === 'rapidFire')!];
    chooseUpgrade(w, 0);
    expect(w.mods.fireRate).toBeCloseTo(1.2);
    expect(w.phase).toBe('playing');
    expect(w.waveIndex).toBe(1);
  });

  it('upgrades stack', () => {
    const w = createWorld('campaign', 'normal', 3);
    for (let i = 0; i < 2; i++) {
      w.phase = 'upgrade';
      w.offers = [UPGRADES.find((u) => u.id === 'doubleShot')!];
      chooseUpgrade(w, 0);
    }
    expect(w.mods.extraShots).toBe(2);
  });

  it('new weapons unlock as the campaign goes on', () => {
    const w = createWorld('campaign', 'normal', 3);
    w.hero.integrity = 1e9;
    for (let i = 0; i < 2; i++) {
      run(w, 200);
      if (w.phase === 'upgrade') chooseUpgrade(w, 0);
    }
    expect(w.equipped).toContain('lockdown');
  });

  it('genome integrity at zero loses the run', () => {
    const w = quiet();
    w.equipped = [];
    w.hero.integrity = 1;
    place(w, 'shredder', w.hero.x, w.hero.y);
    const ev = run(w, 2);
    expect(w.phase).toBe('lost');
    expect(ev.some((e) => e.type === 'lost')).toBe(true);
  });

  it('clearing the final wave wins the campaign', () => {
    const w = createWorld('campaign', 'normal', 3);
    w.waveIndex = CAMPAIGN.length - 1;
    w.wave = { ...CAMPAIGN.at(-1)!, groups: [], duration: 0.1 };
    w.enemies.clear();
    run(w, 1);
    expect(w.phase).toBe('won');
    expect(finalScore(w).total).toBeGreaterThan(0);
  });

  it('campaign waves are ordered and last 30-75 seconds', () => {
    CAMPAIGN.forEach((wave, i) => {
      expect(wave.number).toBe(i + 1);
      expect(wave.duration).toBeGreaterThanOrEqual(30);
      expect(wave.duration).toBeLessThanOrEqual(75);
    });
    const total = CAMPAIGN.reduce((s, w) => s + w.duration, 0);
    expect(total / 60).toBeGreaterThan(6);
    expect(total / 60).toBeLessThan(10);
  });

  it('endless waves get harder', () => {
    const rng = createRng(1);
    const count = (n: number) => endlessWave(n, rng).groups.reduce((s, g) => s + g.count, 0);
    expect(count(10)).toBeGreaterThan(count(1));
  });

  it('the daily seed is the same all day and differs between days', () => {
    expect(dailySeed(new Date(2026, 10, 20, 8))).toBe(dailySeed(new Date(2026, 10, 20, 22)));
    expect(dailySeed(new Date(2026, 10, 20))).not.toBe(dailySeed(new Date(2026, 10, 21)));
  });

  it('the same seed plays out the same way', () => {
    const a = createWorld('daily', 'normal', 42);
    const b = createWorld('daily', 'normal', 42);
    run(a, 20);
    run(b, 20);
    expect(a.score).toBe(b.score);
    expect(a.hero.integrity).toBe(b.hero.integrity);
  });
});

describe('object pooling', () => {
  it('reuses freed objects instead of making new ones', () => {
    const pool = new Pool(() => ({ alive: false, n: 0 }), 10);
    for (let i = 0; i < 100; i++) {
      const x = pool.spawn()!;
      pool.free(x);
    }
    expect(pool.size).toBe(1);
  });

  it('stops at its limit', () => {
    const pool = new Pool(() => ({ alive: false }), 3);
    for (let i = 0; i < 5; i++) pool.spawn();
    expect(pool.live()).toHaveLength(3);
    expect(pool.spawn()).toBeNull();
  });

  it('a busy wave keeps pools within their limits', () => {
    const w = createWorld('campaign', 'normal', 9);
    w.hero.integrity = 1e9;
    run(w, 40);
    expect(w.shots.size).toBeLessThanOrEqual(300);
    expect(w.enemies.size).toBeLessThanOrEqual(160);
    expect(FIELD.w).toBe(720);
  });
});
