import { HEROES, HERO_ORDER, interaction, type Hero, type HeroId } from '../content/characters';
import { DIFFICULTIES, GAME, PHYSICS, SCORE, type Difficulty } from '../config/tuning';
import type { StageConfig } from '../levels/types';
import { createBoss, stageOf, stepBoss, timeLeft, type Boss } from './boss';
import {
  createBody,
  overlap,
  stepBody,
  touches,
  type Body,
  type MoveInput,
  type Platform,
} from './physics';
import { parseMap, TILE, tileAt, type Tile, type TileMap } from './tilemap';

// One stage, as plain data plus stepGame(). Scenes read this and draw it; tests drive it directly.

export interface GameInput extends MoveInput {
  /** The hero's power: pressed this frame. */
  action: boolean;
}

export const NO_INPUT: GameInput = {
  left: false,
  right: false,
  up: false,
  down: false,
  jump: false,
  jumpPressed: false,
  action: false,
};

export type PickupKind = 'bit' | 'key' | 'sprint' | 'shield' | 'doubleJump' | 'slowMotion';

export interface Pickup {
  kind: PickupKind;
  x: number;
  y: number;
  taken: boolean;
}

export interface Roller {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alive: boolean;
}

export interface Shock {
  x: number;
  y: number;
  dir: 1 | -1;
  life: number;
}

export interface MovingPlatform extends Platform {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  period: number;
}

export interface GameState {
  stage: StageConfig;
  map: TileMap;
  difficulty: Difficulty;
  hero: Hero;
  unlocked: HeroId[];
  player: Body;
  spawnX: number;
  spawnY: number;
  hp: number;
  maxHp: number;
  invulnerable: number;
  time: number;
  /** Time as the world sees it (runs at half speed in slow motion). */
  worldTime: number;
  slowMotion: number;
  sprint: number;
  shield: number;
  doubleJump: boolean;
  hasKey: boolean;
  burstCooldown: number;
  /** Seconds left of the burst ring animation. */
  burst: number;
  platforms: MovingPlatform[];
  spawners: { x: number; y: number; dir: 1 | -1; timer: number }[];
  rollers: Roller[];
  shocks: Shock[];
  pickups: Pickup[];
  checkpoints: { x: number; y: number; reached: boolean }[];
  pods: { x: number; y: number }[];
  bosses: Boss[];
  gateOpen: boolean;
  status: 'playing' | 'won' | 'lost';
  lostReason: 'cut' | 'desired-blocked' | null;
  // for scoring
  bits: number;
  hits: number;
  deaths: number;
  rescues: number;
  secondsSaved: number;
  wastedBursts: number;
  unnecessary: number;
}

export type GameEvent =
  | { type: 'jump' | 'land' | 'bounce' | 'hurt' | 'respawn' | 'shieldPop' | 'checkpoint' | 'burst' }
  | { type: 'pickup'; kind: PickupKind }
  | { type: 'swap'; hero: HeroId }
  | { type: 'stopped'; boss: number; role: string }
  | { type: 'frozen'; boss: number }
  | { type: 'denied'; boss: number; reason: 'incompatible' | 'too-late' }
  | { type: 'bossStage'; boss: number; stage: string }
  | { type: 'warn'; boss: number }
  | { type: 'cut'; boss: number; role: string }
  | { type: 'won' }
  | { type: 'lost'; reason: 'cut' | 'desired-blocked' };

export function createGame(
  stage: StageConfig,
  heroId: HeroId,
  difficulty: Difficulty,
  unlocked: HeroId[] = HERO_ORDER,
): GameState {
  const map = parseMap(stage.map);
  const d = DIFFICULTIES[difficulty];
  const start = map.spawns.find((s) => s.kind === 'start') ?? { tx: 1, ty: map.height - 2 };
  const px = start.tx * TILE + 3;
  const py = start.ty * TILE + 2;
  const at = (s: { tx: number; ty: number }) => ({
    x: s.tx * TILE + TILE / 2,
    y: s.ty * TILE + TILE / 2,
  });
  const pickups: Pickup[] = [];
  for (const s of map.spawns) {
    if (['bit', 'key', 'sprint', 'shield', 'doubleJump', 'slowMotion'].includes(s.kind))
      pickups.push({ kind: s.kind as PickupKind, ...at(s), taken: false });
  }
  let checkpoints = map.spawns
    .filter((s) => s.kind === 'checkpoint')
    .map((s) => ({ ...at(s), reached: false }));
  if (d.checkpoints === 'every-other') checkpoints = checkpoints.filter((_, i) => i % 2 === 1);
  const bossSpawns = map.spawns.filter((s) => s.kind === 'boss').sort((a, b) => a.tx - b.tx);
  const bosses = stage.bosses.map((cfg, i) => {
    const s = bossSpawns[i] ?? { tx: map.width - 4, ty: map.height - 2 };
    return createBoss(i, cfg, s.tx * TILE + TILE / 2, (s.ty + 1) * TILE, d.timeScale);
  });
  return {
    stage,
    map,
    difficulty,
    hero: HEROES[heroId],
    unlocked,
    player: createBody(px, py),
    spawnX: px,
    spawnY: py,
    hp: d.maxHp,
    maxHp: d.maxHp,
    invulnerable: 0,
    time: 0,
    worldTime: 0,
    slowMotion: 0,
    sprint: 0,
    shield: 0,
    doubleJump: false,
    hasKey: false,
    burstCooldown: 0,
    burst: 0,
    platforms: stage.platforms.map((p) => ({
      x: p.tx * TILE,
      y: p.ty * TILE,
      w: p.w * TILE,
      h: 8,
      dx: 0,
      dy: 0,
      fromX: p.tx * TILE,
      fromY: p.ty * TILE,
      toX: p.toTx * TILE,
      toY: p.toTy * TILE,
      period: p.period,
    })),
    spawners: map.spawns
      .filter((s) => s.kind === 'rollerLeft' || s.kind === 'rollerRight')
      .map((s, i) => ({
        ...at(s),
        dir: s.kind === 'rollerLeft' ? -1 : 1,
        timer: 1 + i * 0.7,
      })),
    rollers: [],
    shocks: [],
    pickups,
    checkpoints,
    pods: map.spawns.filter((s) => s.kind === 'swap').map(at),
    bosses,
    gateOpen: true,
    status: 'playing',
    lostReason: null,
    bits: 0,
    hits: 0,
    deaths: 0,
    rescues: 0,
    secondsSaved: 0,
    wastedBursts: 0,
    unnecessary: 0,
  };
}

export function isSolidNow(s: GameState): (t: Tile) => boolean {
  return (t) =>
    t === 'solid' ||
    t === 'spikes' ||
    t === 'bouncer' ||
    (t === 'gate' && !s.gateOpen) ||
    (t === 'door' && !s.hasKey);
}

export function stepGame(s: GameState, input: GameInput, dt: number): GameEvent[] {
  if (s.status !== 'playing') return [];
  const events: GameEvent[] = [];
  const d = DIFFICULTIES[s.difficulty];
  const world = dt * (s.slowMotion > 0 ? 0.5 : 1);
  s.time += dt;
  s.worldTime += world;
  s.slowMotion = Math.max(0, s.slowMotion - dt);
  s.sprint = Math.max(0, s.sprint - dt);
  s.invulnerable = Math.max(0, s.invulnerable - dt);
  s.burstCooldown = Math.max(0, s.burstCooldown - dt);
  s.burst = Math.max(0, s.burst - dt);

  // gates (nuclear pores) open for a little over half of each cycle
  const period = s.stage.gatePeriod || 3;
  s.gateOpen = (s.worldTime % period) / period < 0.55;

  // moving platforms
  for (const p of s.platforms) {
    const phase = (s.worldTime % p.period) / p.period;
    const t = phase < 0.5 ? phase * 2 : 2 - phase * 2;
    const nx = p.fromX + (p.toX - p.fromX) * smooth(t);
    const ny = p.fromY + (p.toY - p.fromY) * smooth(t);
    p.dx = nx - p.x;
    p.dy = ny - p.y;
    p.x = nx;
    p.y = ny;
  }

  // the hero
  const b = s.player;
  const inGoo = touches(b, s.map, 'goo');
  const speedFactor =
    s.hero.speed * (s.sprint > 0 ? GAME.sprintFactor : 1) * (inGoo ? GAME.gooFactor : 1);
  const physics = { ...PHYSICS, jumpSpeed: PHYSICS.jumpSpeed * s.hero.jump * (inGoo ? 0.85 : 1) };
  for (const e of stepBody(b, input, s.map, physics, dt, {
    speedFactor,
    airJumps: s.doubleJump ? 1 : 0,
    isSolid: isSolidNow(s),
    platforms: s.platforms,
  })) {
    if (e === 'jumped' || e === 'airJumped') events.push({ type: 'jump' });
    else if (e === 'landed') events.push({ type: 'land' });
    else if (e === 'bounced') events.push({ type: 'bounce' });
  }

  // a pore that shuts on you pushes you back out the way you came
  if (!s.gateOpen && touches(b, s.map, 'gate')) {
    const tx = Math.floor((b.x + b.w / 2) / TILE);
    let left = tx;
    while (tileAt(s.map, left - 1, Math.floor((b.y + b.h - 1) / TILE)) === 'gate') left--;
    b.x = left * TILE - b.w - 0.5;
    b.vx = 0;
  }

  // hazards
  const feet = { x: b.x + 1, y: b.y + 1, w: b.w - 2, h: b.h + 1 };
  if (touchesTile(feet, s.map, 'spikes')) hurt(s, events);
  if (b.y > s.map.height * TILE) {
    hurt(s, events);
    respawn(s, events);
  }
  stepRollers(s, world * d.hazardSpeed, events);
  for (const sh of s.shocks) {
    sh.x += sh.dir * GAME.shockSpeed * world * d.hazardSpeed;
    sh.life -= world;
    if (b.onGround && Math.abs(b.y + b.h - sh.y) < 6 && Math.abs(b.x + b.w / 2 - sh.x) < 9)
      hurt(s, events);
  }
  s.shocks = s.shocks.filter((sh) => sh.life > 0);

  // pickups, checkpoints, swap pods
  for (const p of s.pickups) {
    if (p.taken || !overlap(b, { x: p.x - 6, y: p.y - 6, w: 12, h: 12 })) continue;
    p.taken = true;
    events.push({ type: 'pickup', kind: p.kind });
    if (p.kind === 'bit') s.bits++;
    else if (p.kind === 'key') s.hasKey = true;
    else if (p.kind === 'sprint') s.sprint = GAME.sprintSeconds;
    else if (p.kind === 'shield') s.shield = GAME.shieldHits;
    else if (p.kind === 'doubleJump') s.doubleJump = true;
    else if (p.kind === 'slowMotion') s.slowMotion = GAME.slowMotionSeconds;
  }
  for (const c of s.checkpoints) {
    if (!c.reached && overlap(b, { x: c.x - 8, y: c.y - 16, w: 16, h: 32 })) {
      c.reached = true;
      s.spawnX = c.x - b.w / 2;
      s.spawnY = c.y - 2;
      events.push({ type: 'checkpoint' });
    }
  }
  const atPod = s.pods.some((p) => overlap(b, { x: p.x - 10, y: p.y - 16, w: 20, h: 32 }));

  // the hero's power
  if (input.action) {
    if (atPod) swapHero(s, events);
    else useBurst(s, events);
  }

  // bosses
  for (const boss of s.bosses) {
    for (const e of stepBoss(boss, world, s.time)) {
      if (e.type === 'stage') events.push({ type: 'bossStage', boss: e.boss, stage: e.stage });
      else if (e.type === 'warn') events.push({ type: 'warn', boss: e.boss });
      else if (e.type === 'shock') {
        s.shocks.push({ x: boss.x, y: boss.y, dir: -1, life: GAME.shockLife });
        s.shocks.push({ x: boss.x, y: boss.y, dir: 1, life: GAME.shockLife });
      } else if (e.type === 'cut') {
        events.push({ type: 'cut', boss: e.boss, role: boss.config.role });
        if (boss.config.role === 'off-target') lose(s, 'cut', events);
      }
    }
  }

  // won when every wrong target is protected and every wanted edit is done
  const offDone = s.bosses.every((x) => x.config.role !== 'off-target' || x.state === 'stopped');
  const desiredDone = s.bosses.every((x) => x.config.role !== 'desired' || x.state === 'cut');
  if (s.status === 'playing' && offDone && desiredDone) {
    s.status = 'won';
    events.push({ type: 'won' });
  }
  return events;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

function touchesTile(
  box: { x: number; y: number; w: number; h: number },
  map: TileMap,
  kind: Tile,
): boolean {
  const x0 = Math.floor(box.x / TILE);
  const x1 = Math.floor((box.x + box.w - 0.01) / TILE);
  const y0 = Math.floor(box.y / TILE);
  const y1 = Math.floor((box.y + box.h - 0.01) / TILE);
  for (let ty = y0; ty <= y1; ty++)
    for (let tx = x0; tx <= x1; tx++) if (tileAt(map, tx, ty) === kind) return true;
  return false;
}

function stepRollers(s: GameState, dt: number, events: GameEvent[]): void {
  const size = GAME.rollerSize;
  for (const sp of s.spawners) {
    sp.timer -= dt;
    if (sp.timer <= 0) {
      sp.timer = s.stage.rollerEvery;
      s.rollers.push({
        x: sp.x - size / 2,
        y: sp.y - size / 2,
        vx: sp.dir * GAME.rollerSpeed,
        vy: 0,
        alive: true,
      });
    }
  }
  const solid = isSolidNow(s);
  for (const r of s.rollers) {
    r.vy = Math.min(PHYSICS.maxFall, r.vy + PHYSICS.gravity * dt);
    r.y += r.vy * dt;
    const below = tileAt(
      s.map,
      Math.floor((r.x + size / 2) / TILE),
      Math.floor((r.y + size) / TILE),
    );
    if (solid(below) || below === 'ledge') {
      r.y = Math.floor((r.y + size) / TILE) * TILE - size;
      r.vy = 0;
    }
    r.x += r.vx * dt;
    const ahead = tileAt(
      s.map,
      Math.floor((r.vx > 0 ? r.x + size : r.x) / TILE),
      Math.floor((r.y + size / 2) / TILE),
    );
    if (solid(ahead) || r.y > s.map.height * TILE) r.alive = false; // breaks against walls
    if (r.alive && overlap(s.player, { x: r.x + 1, y: r.y + 1, w: size - 2, h: size - 2 }))
      hurt(s, events);
  }
  s.rollers = s.rollers.filter((r) => r.alive);
}

export function hurt(s: GameState, events: GameEvent[]): void {
  if (s.invulnerable > 0 || s.status !== 'playing') return;
  if (s.shield > 0) {
    s.shield--;
    s.invulnerable = GAME.invulnerable;
    events.push({ type: 'shieldPop' });
    return;
  }
  s.hp--;
  s.hits++;
  s.invulnerable = GAME.invulnerable;
  s.player.vy = -GAME.knockback.vy;
  s.player.vx = -s.player.facing * GAME.knockback.vx;
  s.player.onLadder = false;
  events.push({ type: 'hurt' });
  if (s.hp <= 0) respawn(s, events);
}

function respawn(s: GameState, events: GameEvent[]): void {
  s.deaths++;
  s.hp = s.maxHp;
  s.player.x = s.spawnX;
  s.player.y = s.spawnY;
  s.player.vx = 0;
  s.player.vy = 0;
  s.player.onLadder = false;
  s.invulnerable = 1.5;
  s.rollers = [];
  events.push({ type: 'respawn' });
}

function swapHero(s: GameState, events: GameEvent[]): void {
  const i = s.unlocked.indexOf(s.hero.id);
  const next = s.unlocked[(i + 1) % s.unlocked.length] ?? 'ace';
  s.hero = HEROES[next];
  events.push({ type: 'swap', hero: next });
}

function useBurst(s: GameState, events: GameEvent[]): void {
  if (s.burstCooldown > 0) return;
  s.burstCooldown = GAME.burstCooldown;
  s.burst = 0.4;
  events.push({ type: 'burst' });
  const cx = s.player.x + s.player.w / 2;
  const cy = s.player.y + s.player.h / 2;
  let hitAny = false;
  for (const boss of s.bosses) {
    if (boss.state !== 'active') continue;
    if (Math.abs(boss.x - cx) > GAME.burstRangeX || Math.abs(boss.y - 16 - cy) > GAME.burstRangeY)
      continue;
    hitAny = true;
    const r = interaction(s.hero, boss.config.kind, stageOf(boss));
    if (!r.ok) {
      events.push({ type: 'denied', boss: boss.id, reason: r.reason });
      continue;
    }
    if (r.effect === 'freeze') {
      boss.frozenFor = Math.max(boss.frozenFor, s.hero.freezeSeconds ?? 6);
      events.push({ type: 'frozen', boss: boss.id });
      continue;
    }
    boss.state = 'stopped';
    events.push({ type: 'stopped', boss: boss.id, role: boss.config.role });
    if (boss.config.role === 'off-target') {
      s.rescues++;
      s.secondsSaved += timeLeft(boss);
    } else {
      s.unnecessary++;
      if (boss.config.role === 'desired') lose(s, 'desired-blocked', events);
    }
  }
  if (!hitAny) s.wastedBursts++;
}

function lose(s: GameState, reason: 'cut' | 'desired-blocked', events: GameEvent[]): void {
  if (s.status !== 'playing') return;
  s.status = 'lost';
  s.lostReason = reason;
  events.push({ type: 'lost', reason });
}

export interface ScoreBreakdown {
  rescue: number;
  time: number;
  accuracy: number;
  bits: number;
  noDamage: number;
  route: number;
  penalties: number;
  total: number;
  stars: number;
}

export function scoreGame(s: GameState): ScoreBreakdown {
  if (s.status !== 'won')
    return {
      rescue: 0,
      time: 0,
      accuracy: 0,
      bits: 0,
      noDamage: 0,
      route: 0,
      penalties: 0,
      total: 0,
      stars: 0,
    };
  const rescue = s.rescues * SCORE.rescue;
  const time = Math.round(s.secondsSaved * SCORE.perSecondLeft);
  const accuracy = Math.max(0, s.rescues * SCORE.accurate - s.wastedBursts * SCORE.wastedBurst);
  const bits = s.bits * SCORE.bit;
  const noDamage = s.hits === 0 ? SCORE.noDamage : 0;
  const route = Math.max(0, Math.round((s.stage.parTime - s.time) * SCORE.underPar));
  const penalties = s.unnecessary * SCORE.unnecessary;
  const total = Math.max(0, rescue + time + accuracy + bits + noDamage + route - penalties);
  const [one, two, three] = s.stage.stars;
  const stars = total >= three ? 3 : total >= two ? 2 : total >= one ? 1 : 1;
  return { rescue, time, accuracy, bits, noDamage, route, penalties, total, stars };
}
