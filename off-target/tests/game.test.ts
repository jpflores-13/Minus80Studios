import { describe, expect, it } from 'vitest';
import { BOSS_STAGES, HEROES, interaction } from '../src/content/characters';
import { STAGES } from '../src/levels';
import type { StageConfig } from '../src/levels/types';
import { createBoss, stageOf, stepBoss, timeLeft } from '../src/systems/boss';
import { createGame, NO_INPUT, scoreGame, stepGame, type GameState } from '../src/systems/game';
import { TILE } from '../src/systems/tilemap';

const DT = 1 / 60;
const tick = (s: GameState, seconds: number, input = NO_INPUT) => {
  const events = [];
  for (let t = 0; t < seconds; t += DT) events.push(...stepGame(s, input, DT));
  return events;
};
const press = (s: GameState) => stepGame(s, { ...NO_INPUT, action: true }, DT);
/** Put the hero right next to a boss. */
const goTo = (s: GameState, boss: number) => {
  const b = s.bosses[boss]!;
  s.player.x = b.x - 24;
  s.player.y = b.y - s.player.h;
  s.player.vx = 0;
  s.player.vy = 0;
};

describe('boss countdown', () => {
  const boss = () =>
    createBoss(0, { kind: 'chop', role: 'off-target', durations: [4, 3, 2] }, 100, 100, 1);

  it('goes through its stages in order and then cuts', () => {
    const b = boss();
    const seen: string[] = [];
    for (let t = 0; t < 10; t += 0.05)
      for (const e of stepBoss(b, 0.05, t)) seen.push(e.type === 'stage' ? e.stage : e.type);
    expect(seen).toEqual(['recognition', 'engagement', 'cleavage', 'cut']);
    expect(b.state).toBe('cut');
  });

  it('difficulty scales the countdown', () => {
    expect(
      timeLeft(
        createBoss(0, { kind: 'chop', role: 'off-target', durations: [4, 3, 2] }, 0, 0, 1.5),
      ),
    ).toBeCloseTo(13.5);
  });

  it('a frozen boss holds still', () => {
    const b = boss();
    b.frozenFor = 2;
    stepBoss(b, 1.5, 0);
    expect(b.elapsed).toBe(0);
  });

  it('telegraphs a shockwave before it comes', () => {
    const b = createBoss(
      0,
      { kind: 'chop', role: 'off-target', durations: [30, 3, 2], shockEvery: 1 },
      0,
      0,
      1,
    );
    const types: string[] = [];
    for (let t = 0; t < 3; t += 0.05) for (const e of stepBoss(b, 0.05, t)) types.push(e.type);
    expect(types.indexOf('warn')).toBeGreaterThanOrEqual(0);
    expect(types.indexOf('shock')).toBeGreaterThan(types.indexOf('warn'));
  });
});

describe('compatibility', () => {
  it('BLOCK must act before CHOP grips the DNA', () => {
    expect(interaction(HEROES.block, 'chop', 'recognition').ok).toBe(true);
    expect(interaction(HEROES.block, 'chop', 'engagement')).toEqual({
      ok: false,
      reason: 'too-late',
    });
  });

  it('LOCK works only on SNIP; ACE only on CHOP', () => {
    expect(interaction(HEROES.lock, 'snip', 'engagement').ok).toBe(true);
    expect(interaction(HEROES.lock, 'chop', 'searching')).toEqual({
      ok: false,
      reason: 'incompatible',
    });
    expect(interaction(HEROES.ace, 'snip', 'searching')).toEqual({
      ok: false,
      reason: 'incompatible',
    });
  });

  it('FREEZE only freezes, never stops for good', () => {
    for (const st of BOSS_STAGES.slice(0, 3))
      expect(interaction(HEROES.freeze, 'chop', st)).toEqual({ ok: true, effect: 'freeze' });
  });

  it('nobody stops a boss once it is cutting', () => {
    for (const h of Object.values(HEROES))
      expect(interaction(h, 'chop', 'cleavage').ok).toBe(false);
  });
});

describe('winning and losing', () => {
  const stage = (n: number) => STAGES[n - 1] as StageConfig;

  it('stopping the off-target boss in time wins, and scores', () => {
    const s = createGame(stage(1), 'ace', 'arcade');
    tick(s, 3);
    goTo(s, 0);
    press(s);
    tick(s, 0.1);
    expect(s.status).toBe('won');
    const sc = scoreGame(s);
    expect(sc.rescue).toBeGreaterThan(0);
    expect(sc.time).toBeGreaterThan(0);
    expect(sc.stars).toBeGreaterThanOrEqual(1);
  });

  it('a burst out of range does nothing', () => {
    const s = createGame(stage(1), 'ace', 'arcade');
    tick(s, 1);
    press(s);
    expect(s.bosses[0]!.state).toBe('active');
    expect(s.wastedBursts).toBe(1);
  });

  it('if the countdown runs out, the target is cut and the stage is lost', () => {
    const s = createGame(stage(1), 'ace', 'arcade');
    const events = tick(s, 60);
    expect(s.status).toBe('lost');
    expect(s.lostReason).toBe('cut');
    expect(events.some((e) => e.type === 'cut')).toBe(true);
  });

  it('Casual gives more time than Precision', () => {
    const casual = createGame(stage(1), 'ace', 'casual');
    const precision = createGame(stage(1), 'ace', 'precision');
    expect(timeLeft(casual.bosses[0]!)).toBeGreaterThan(timeLeft(precision.bosses[0]!));
  });

  it('stopping a CHOP at its intended target costs points', () => {
    const s = createGame(stage(4), 'ace', 'arcade');
    goTo(s, 0);
    press(s);
    expect(s.bosses[0]!.state).toBe('stopped');
    expect(s.unnecessary).toBe(1);
    expect(s.status).toBe('playing');
  });

  it('Stage 6: bursting before the wanted edit is done blocks it and loses', () => {
    const s = createGame(stage(6), 'ace', 'arcade');
    goTo(s, 1);
    press(s);
    expect(s.status).toBe('lost');
    expect(s.lostReason).toBe('desired-blocked');
  });

  it('Stage 6: waiting for the wanted edit, then stopping the other, wins', () => {
    const s = createGame(stage(6), 'ace', 'arcade');
    while (s.bosses[0]!.state !== 'cut') tick(s, 0.5);
    expect(stageOf(s.bosses[1]!)).not.toBe('cleavage');
    goTo(s, 1);
    press(s);
    tick(s, 0.1);
    expect(s.status).toBe('won');
  });

  it('the wrong hero is turned away', () => {
    const s = createGame(stage(5), 'ace', 'arcade');
    goTo(s, 1);
    const ev = press(s);
    expect(ev).toContainEqual({ type: 'denied', boss: 1, reason: 'incompatible' });
  });
});

describe('damage, shields and pickups', () => {
  it('spikes hurt; at zero health you go back to the last checkpoint', () => {
    const s = createGame(STAGES[0]!, 'ace', 'arcade');
    const spike = s.map.tiles.findIndex((t) => t === 'spikes');
    const tx = spike % s.map.width;
    const startHp = s.hp;
    for (let i = 0; i < startHp; i++) {
      s.invulnerable = 0;
      s.player.x = tx * TILE + 2;
      s.player.y = (s.map.height - 1) * TILE - s.player.h;
      s.player.vy = 0;
      tick(s, DT);
    }
    expect(s.deaths).toBe(1);
    expect(s.hp).toBe(s.maxHp);
    expect(s.player.x).toBeCloseTo(s.spawnX);
  });

  it('a shield takes one hit for you', () => {
    const s = createGame(STAGES[0]!, 'ace', 'arcade');
    s.shield = 1;
    const ev: { type: string }[] = [];
    // hurt directly via a roller-free path: drop onto spikes
    const spike = s.map.tiles.findIndex((t) => t === 'spikes');
    s.player.x = (spike % s.map.width) * TILE + 2;
    s.player.y = (s.map.height - 1) * TILE - s.player.h;
    ev.push(...tick(s, DT));
    expect(ev.some((e) => e.type === 'shieldPop')).toBe(true);
    expect(s.hp).toBe(s.maxHp);
  });

  it('collecting things counts and power-ups switch on', () => {
    const s = createGame(STAGES[1]!, 'ace', 'arcade');
    const sprint = s.pickups.find((p) => p.kind === 'sprint')!;
    s.player.x = sprint.x - 5;
    s.player.y = sprint.y - 7;
    tick(s, DT);
    expect(sprint.taken).toBe(true);
    expect(s.sprint).toBeGreaterThan(0);
  });
});
