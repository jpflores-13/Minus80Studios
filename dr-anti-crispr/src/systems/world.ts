import {
  CLOUD,
  compatible,
  ENEMIES,
  REINFORCEMENTS,
  WEAPONS,
  type EnemyKind,
  type InhibitState,
  type WeaponId,
} from '../content/arsenal';
import { BASE_MODS, UPGRADES, type Mods, type Upgrade, type UpgradeId } from '../content/upgrades';
import { CAMPAIGN, endlessWave, type Formation, type WaveDef } from '../content/waves';
import { createRng, type Rng } from '../utils/rng';
import { Pool } from './pool';

// The whole battle as plain data plus stepWorld(). The scene only reads it and draws.

export const FIELD = { w: 720, h: 1280, top: 150, wall: 28 };

/** Openings in the host's wall (top of the screen) that launch its defences at you. */
export const HOST_PORTS = [110, 235, 360, 485, 610];
const LAUNCH_TIME = 0.55;

export type Mode = 'campaign' | 'endless' | 'daily';
export type Difficulty = 'gentle' | 'normal' | 'fierce';

export const DIFFICULTY: Record<Difficulty, { damage: number; speed: number; name: string }> = {
  gentle: { damage: 0.5, speed: 0.85, name: 'Gentle' },
  normal: { damage: 1, speed: 1, name: 'Normal' },
  fierce: { damage: 1.4, speed: 1.15, name: 'Fierce' },
};

export interface Input {
  /** Direction from keys or stick, -1..1 each. */
  dx: number;
  dy: number;
  /** Touch-and-drag target, if dragging. */
  target: { x: number; y: number } | null;
  reinforce: boolean;
  cloud: boolean;
}

export const NO_INPUT: Input = { dx: 0, dy: 0, target: null, reinforce: false, cloud: false };

export interface Enemy {
  alive: boolean;
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hits: number;
  state: 'active' | 'inhibited' | 'leaving';
  inhibit: InhibitState | null;
  timer: number;
  partner: Enemy | null;
  phase: number;
  /** Bosses and Shredders: an attack being telegraphed or under way. */
  attack: { kind: 'aim' | 'lunge' | 'beam'; t: number; dx: number; dy: number } | null;
  attackTimer: number;
  grazed: boolean;
  frozenFor: number;
  isBoss: boolean;
  /** Seconds left of being flung out of the host: it flies on its own velocity until then. */
  launch: number;
}

export interface Shot {
  alive: boolean;
  weapon: WeaponId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  pierce: number;
  ally: boolean;
}

export interface Obstacle {
  alive: boolean;
  x: number;
  y: number;
  r: number;
  vy: number;
}

export interface Stats {
  inhibited: number;
  byWeapon: Record<WeaponId, number>;
  compatibleHits: number;
  resisted: number;
  dodges: number;
  specialUses: number;
  specialInhibits: number;
  damageTaken: number;
  wavesCleared: number;
  bossesStopped: number;
}

export interface World {
  mode: Mode;
  difficulty: Difficulty;
  seed: number;
  rng: Rng;
  wave: WaveDef;
  waveIndex: number;
  waveTime: number;
  fired: Set<string>;
  time: number;
  hero: {
    x: number;
    y: number;
    integrity: number;
    max: number;
    shield: number;
    hurtFlash: number;
    timers: Partial<Record<WeaponId, number>>;
    slowed: boolean;
  };
  enemies: Pool<Enemy>;
  shots: Pool<Shot>;
  obstacles: Pool<Obstacle>;
  obstacleTimer: number;
  crowd: { x: number; y: number; r: number } | null;
  equipped: WeaponId[];
  mods: Mods;
  taken: Partial<Record<UpgradeId, number>>;
  charge: number;
  allies: { x: number; y: number; angle: number }[];
  allyTime: number;
  allyTimer: number;
  cloudCooldown: number;
  cloud: { x: number; y: number; t: number } | null;
  phase: 'playing' | 'upgrade' | 'won' | 'lost';
  offers: Upgrade[];
  stats: Stats;
  score: number;
  /** Aim at the nearest machine (true) or always straight up (false). */
  autoAim: boolean;
}

export type WorldEvent =
  | { type: 'shot'; weapon: WeaponId }
  | {
      type: 'inhibited';
      kind: EnemyKind;
      effect: InhibitState;
      x: number;
      y: number;
      boss: boolean;
    }
  | { type: 'resisted'; x: number; y: number }
  | { type: 'hurt'; amount: number }
  | { type: 'shielded' }
  | { type: 'launched'; x: number; y: number }
  | { type: 'telegraph'; kind: EnemyKind }
  | { type: 'reinforce' }
  | { type: 'cloud' }
  | { type: 'waveStart'; wave: WaveDef }
  | { type: 'waveClear'; wave: number }
  | { type: 'upgrade' }
  | { type: 'won' }
  | { type: 'lost' }
  | { type: 'dodge' };

function newEnemy(): Enemy {
  return {
    alive: false,
    kind: 'cutter',
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    hits: 0,
    state: 'active',
    inhibit: null,
    timer: 0,
    partner: null,
    phase: 0,
    attack: null,
    attackTimer: 0,
    grazed: false,
    frozenFor: 0,
    isBoss: false,
    launch: 0,
  };
}

export function createWorld(
  mode: Mode,
  difficulty: Difficulty,
  seed: number,
  autoAim = true,
): World {
  const rng = createRng(seed);
  const w: World = {
    mode,
    difficulty,
    seed,
    rng,
    wave: CAMPAIGN[0] as WaveDef,
    waveIndex: 0,
    waveTime: 0,
    fired: new Set(),
    time: 0,
    hero: {
      x: FIELD.w / 2,
      y: FIELD.h - 220,
      integrity: 100,
      max: 100,
      shield: 0,
      hurtFlash: 0,
      timers: {},
      slowed: false,
    },
    enemies: new Pool(newEnemy, 160),
    shots: new Pool(
      () => ({
        alive: false,
        weapon: 'blockade' as WeaponId,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        pierce: 0,
        ally: false,
      }),
      300,
    ),
    obstacles: new Pool(() => ({ alive: false, x: 0, y: 0, r: 0, vy: 0 }), 20),
    obstacleTimer: 2,
    crowd: null,
    equipped: ['blockade'],
    mods: { ...BASE_MODS },
    taken: {},
    charge: 0,
    allies: [],
    allyTime: 0,
    allyTimer: 0,
    cloudCooldown: 0,
    cloud: null,
    phase: 'playing',
    offers: [],
    stats: {
      inhibited: 0,
      byWeapon: { blockade: 0, lockdown: 0, doubleTrouble: 0, pulse: 0 },
      compatibleHits: 0,
      resisted: 0,
      dodges: 0,
      specialUses: 0,
      specialInhibits: 0,
      damageTaken: 0,
      wavesCleared: 0,
      bossesStopped: 0,
    },
    score: 0,
    autoAim,
  };
  startWave(w, 0);
  return w;
}

/** Wave index after which a feature unlocks, in campaign terms. Endless/Daily unlock as you go. */
function cleared(w: World): number {
  return w.stats.wavesCleared;
}

export function cloudReady(w: World): boolean {
  return cleared(w) >= CLOUD.unlockAfter && w.cloudCooldown <= 0;
}

export function reinforcementsUnlocked(w: World): boolean {
  return cleared(w) >= REINFORCEMENTS.unlockAfter;
}

function waveDef(w: World, index: number): WaveDef | undefined {
  if (w.mode === 'campaign') return CAMPAIGN[index];
  return endlessWave(index + 1, w.rng);
}

function startWave(w: World, index: number): void {
  const def = waveDef(w, index);
  if (!def) return;
  w.wave = def;
  w.waveIndex = index;
  w.waveTime = 0;
  w.fired = new Set();
  w.crowd = def.crowding
    ? { x: 120 + w.rng.next() * 480, y: 500 + w.rng.next() * 300, r: 150 }
    : null;
  if (def.boss) spawn(w, def.boss, 1, 'line');
}

export function stepWorld(w: World, input: Input, dt: number): WorldEvent[] {
  if (w.phase !== 'playing') return [];
  const ev: WorldEvent[] = [];
  const diff = DIFFICULTY[w.difficulty];
  w.time += dt;
  w.waveTime += dt;
  if (w.waveTime < dt * 1.5 && w.waveIndex >= 0) ev.push({ type: 'waveStart', wave: w.wave });

  moveHero(w, input, dt);
  spawnScheduled(w);
  stepObstacles(w, dt);
  fire(w, ev, dt);
  stepShots(w, ev, dt);
  stepEnemies(w, ev, dt, diff);
  stepSpecials(w, input, ev, dt);

  w.hero.hurtFlash = Math.max(0, w.hero.hurtFlash - dt);
  w.cloudCooldown = Math.max(0, w.cloudCooldown - dt);

  if (w.hero.integrity <= 0) {
    w.hero.integrity = 0;
    w.phase = 'lost';
    ev.push({ type: 'lost' });
    return ev;
  }
  const bossActive = w.enemies.live().some((e) => e.isBoss && e.state === 'active');
  if (w.waveTime >= w.wave.duration && !bossActive) endWave(w, ev);
  return ev;
}

function endWave(w: World, ev: WorldEvent[]): void {
  w.stats.wavesCleared++;
  w.score += 200 * (w.waveIndex + 1);
  ev.push({ type: 'waveClear', wave: w.wave.number });
  // everyone still out there retreats
  for (const e of w.enemies.live()) if (e.state === 'active') leave(e);
  if (w.wave.unlocks && !w.equipped.includes(w.wave.unlocks)) w.equipped.push(w.wave.unlocks);
  if (w.mode !== 'campaign' && cleared(w) % 2 === 0) unlockNext(w);
  if (w.mode === 'campaign' && w.waveIndex >= CAMPAIGN.length - 1) {
    w.phase = 'won';
    w.score += Math.round(w.hero.integrity * 10);
    ev.push({ type: 'won' });
    return;
  }
  if (w.wave.upgradeAfter) {
    w.offers = offerUpgrades(w, 3);
    w.phase = 'upgrade';
    ev.push({ type: 'upgrade' });
  } else startWave(w, w.waveIndex + 1);
}

function unlockNext(w: World): void {
  const next = (['lockdown', 'doubleTrouble', 'pulse'] as WeaponId[]).find(
    (id) => !w.equipped.includes(id),
  );
  if (next) w.equipped.push(next);
}

export function offerUpgrades(w: World, n: number): Upgrade[] {
  const open = UPGRADES.filter((u) => (w.taken[u.id] ?? 0) < u.max);
  const picks: Upgrade[] = [];
  while (picks.length < n && open.length) {
    const i = Math.floor(w.rng.next() * open.length);
    picks.push(...open.splice(i, 1));
  }
  return picks;
}

export function chooseUpgrade(w: World, index: number): void {
  if (w.phase !== 'upgrade') return;
  const u = w.offers[index];
  if (u) {
    u.apply(w.mods);
    w.taken[u.id] = (w.taken[u.id] ?? 0) + 1;
    if (u.id === 'genomeShield') w.hero.shield = w.mods.shield;
  }
  w.offers = [];
  w.phase = 'playing';
  startWave(w, w.waveIndex + 1);
}

// ---------- the hero ----------

function moveHero(w: World, input: Input, dt: number): void {
  const h = w.hero;
  const crowd = w.crowd;
  h.slowed = !!crowd && Math.hypot(h.x - crowd.x, h.y - crowd.y) < crowd.r;
  const speed = 380 * w.mods.speed * (h.slowed ? 0.6 : 1);
  if (input.target) {
    const dx = input.target.x - h.x;
    const dy = input.target.y - h.y;
    const d = Math.hypot(dx, dy);
    const step = Math.min(d, speed * dt);
    if (d > 0.5) {
      h.x += (dx / d) * step;
      h.y += (dy / d) * step;
    }
  } else {
    const len = Math.hypot(input.dx, input.dy);
    if (len > 0) {
      h.x += (input.dx / Math.max(1, len)) * speed * dt;
      h.y += (input.dy / Math.max(1, len)) * speed * dt;
    }
  }
  h.x = clamp(h.x, FIELD.wall + 24, FIELD.w - FIELD.wall - 24);
  h.y = clamp(h.y, FIELD.top + 40, FIELD.h - 60);
  // obstacles push you aside
  for (const o of w.obstacles.live()) {
    const d = Math.hypot(h.x - o.x, h.y - o.y);
    const min = o.r + 22;
    if (d < min && d > 0) {
      h.x = o.x + ((h.x - o.x) / d) * min;
      h.y = o.y + ((h.y - o.y) / d) * min;
    }
  }
}

function fire(w: World, ev: WorldEvent[], dt: number): void {
  const h = w.hero;
  for (const id of w.equipped) {
    const def = WEAPONS[id];
    const t = (h.timers[id] ?? 0) - dt;
    if (t > 0) {
      h.timers[id] = t;
      continue;
    }
    const target = nearest(w, h.x, h.y, def.range, (e) => compatible(id, e.kind));
    let angle = -Math.PI / 2;
    if (w.autoAim) {
      if (!target) {
        h.timers[id] = 0.1;
        continue;
      }
      angle = Math.atan2(target.y - h.y, target.x - h.x);
    }
    h.timers[id] = 1 / (def.rate * w.mods.fireRate);
    const n = 1 + w.mods.extraShots;
    for (let i = 0; i < n; i++) {
      const a = angle + (i - (n - 1) / 2) * 0.16;
      shoot(w, id, h.x, h.y - 20, a, false);
    }
    ev.push({ type: 'shot', weapon: id });
  }
}

function shoot(w: World, id: WeaponId, x: number, y: number, angle: number, ally: boolean): void {
  const def = WEAPONS[id];
  const s = w.shots.spawn();
  if (!s) return;
  s.weapon = id;
  s.x = x;
  s.y = y;
  s.vx = Math.cos(angle) * def.projectileSpeed;
  s.vy = Math.sin(angle) * def.projectileSpeed;
  s.life = def.range / def.projectileSpeed;
  s.pierce = w.mods.pierce;
  s.ally = ally;
}

function nearest(
  w: World,
  x: number,
  y: number,
  range: number,
  ok: (e: Enemy) => boolean,
): Enemy | null {
  let best: Enemy | null = null;
  let bestD = range;
  for (const e of w.enemies.live()) {
    if (e.state !== 'active' || !ok(e)) continue;
    const d = Math.hypot(e.x - x, e.y - y);
    if (d < bestD) {
      bestD = d;
      best = e;
    }
  }
  return best;
}

function stepShots(w: World, ev: WorldEvent[], dt: number): void {
  for (const s of w.shots.live()) {
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.life -= dt;
    if (s.life <= 0 || s.y < FIELD.top - 60 || s.x < 0 || s.x > FIELD.w) {
      w.shots.free(s);
      continue;
    }
    if (w.obstacles.live().some((o) => Math.hypot(o.x - s.x, o.y - s.y) < o.r)) {
      w.shots.free(s);
      continue;
    }
    for (const e of w.enemies.live()) {
      if (e.state !== 'active') continue;
      const r = ENEMIES[e.kind].radius;
      if (Math.hypot(e.x - s.x, e.y - s.y) > r + 6) continue;
      if (!compatible(s.weapon, e.kind)) {
        w.stats.resisted++;
        ev.push({ type: 'resisted', x: s.x, y: s.y });
        w.shots.free(s);
        break;
      }
      const def = WEAPONS[s.weapon];
      if (w.rng.next() < Math.min(1, def.chance + w.mods.chance)) {
        e.hits++;
        w.stats.compatibleHits++;
        if (e.hits >= ENEMIES[e.kind].resistance) inhibit(w, e, s.weapon, ev, s.ally);
      }
      if (s.pierce > 0) s.pierce--;
      else {
        w.shots.free(s);
        break;
      }
    }
  }
}

export function inhibit(
  w: World,
  e: Enemy,
  weapon: WeaponId,
  ev: WorldEvent[],
  bySpecial = false,
): void {
  const def = WEAPONS[weapon];
  e.state = 'inhibited';
  e.inhibit = def.effect;
  e.timer = e.isBoss ? 3 : def.duration * w.mods.duration;
  e.attack = null;
  if (weapon === 'doubleTrouble') {
    // tie it to the nearest other compatible machine, if one is close
    const other = nearest(w, e.x, e.y, 180, (o) => o !== e && compatible('doubleTrouble', o.kind));
    if (other) {
      other.state = 'inhibited';
      other.inhibit = 'linked';
      other.timer = e.timer;
      other.partner = e;
      e.partner = other;
      award(w, other, weapon, ev, bySpecial);
    }
  }
  award(w, e, weapon, ev, bySpecial);
}

function award(w: World, e: Enemy, weapon: WeaponId, ev: WorldEvent[], bySpecial: boolean): void {
  w.stats.inhibited++;
  w.stats.byWeapon[weapon]++;
  if (bySpecial) w.stats.specialInhibits++;
  if (e.isBoss) w.stats.bossesStopped++;
  w.score += ENEMIES[e.kind].points + (bySpecial ? 20 : 0);
  // every shutdown charges Reinforcements directly (bosses a lot)
  if (reinforcementsUnlocked(w))
    w.charge = Math.min(
      REINFORCEMENTS.charge,
      w.charge + (e.isBoss ? 60 : REINFORCEMENTS.perInhibit),
    );
  ev.push({
    type: 'inhibited',
    kind: e.kind,
    effect: e.inhibit ?? 'blocked',
    x: e.x,
    y: e.y,
    boss: e.isBoss,
  });
}

function leave(e: Enemy): void {
  e.state = 'leaving';
  e.timer = 2;
  e.attack = null;
}

// ---------- enemies ----------

function spawnScheduled(w: World): void {
  for (const [i, g] of w.wave.groups.entries()) {
    const times: number[] = [g.at];
    if (g.every)
      for (let t = g.at + g.every; t <= (g.until ?? w.wave.duration); t += g.every) times.push(t);
    for (const t of times) {
      const key = `${i}@${t.toFixed(2)}`;
      if (w.waveTime >= t && !w.fired.has(key)) {
        w.fired.add(key);
        spawn(w, g.kind, g.count, g.formation);
      }
    }
  }
}

export function spawn(w: World, kind: EnemyKind, count: number, formation: Formation): void {
  const top = FIELD.top - 40;
  const mid = FIELD.w / 2;
  for (let i = 0; i < count; i++) {
    const e = w.enemies.spawn();
    if (!e) return;
    Object.assign(e, newEnemy(), {
      alive: true,
      kind,
      isBoss: kind === 'megacutter' || kind === 'prime',
    });
    const f = count > 1 ? i / (count - 1) : 0.5;
    switch (formation) {
      case 'line':
        e.x = 90 + f * (FIELD.w - 180);
        e.y = top;
        break;
      case 'arc':
        e.x = mid + Math.cos(Math.PI * (1 - f)) * 260;
        e.y = top - Math.sin(Math.PI * f) * 80;
        break;
      case 'v':
        e.x = mid + (f - 0.5) * 420;
        e.y = top - Math.abs(f - 0.5) * 160;
        break;
      case 'sides':
        e.x = i % 2 ? FIELD.w + 30 : -30;
        e.y = FIELD.top + 200 + w.rng.next() * 500;
        break;
      case 'cluster': {
        const cx = 120 + w.rng.next() * 480;
        e.x = cx + (w.rng.next() - 0.5) * 90;
        e.y = top - w.rng.next() * 60;
        break;
      }
      default:
        e.x = 60 + w.rng.next() * (FIELD.w - 120);
        e.y = top - w.rng.next() * 100;
    }
    if (e.isBoss) {
      e.x = mid;
      e.y = FIELD.top + 40;
      e.attackTimer = 3;
    } else if (formation !== 'sides') {
      // the host throws it out of the nearest port toward its place in the formation
      const tx = Math.min(FIELD.w - 60, Math.max(60, e.x));
      const ty = FIELD.top + 90 + (top - e.y);
      const port = HOST_PORTS.reduce((a, b) => (Math.abs(b - tx) < Math.abs(a - tx) ? b : a));
      e.x = port;
      e.y = FIELD.top - 6;
      e.vx = (tx - port) / LAUNCH_TIME;
      e.vy = (ty - e.y) / LAUNCH_TIME;
      e.launch = LAUNCH_TIME + i * 0.04;
    }
    e.phase = w.rng.next() * Math.PI * 2;
    e.attackTimer ||= 2 + w.rng.next() * 2;
  }
}

function stepEnemies(
  w: World,
  ev: WorldEvent[],
  dt: number,
  diff: { damage: number; speed: number },
): void {
  const h = w.hero;
  const boost = w.enemies.live().some((e) => e.kind === 'commander' && e.state === 'active')
    ? 1.2
    : 1;
  const slowed = w.allyTime > 0 ? 0.6 : 1;
  for (const e of w.enemies.live()) {
    const def = ENEMIES[e.kind];
    e.phase += dt;
    if (e.state === 'leaving') {
      e.timer -= dt;
      e.y -= 160 * dt;
      if (e.timer <= 0 || e.y < FIELD.top - 120) w.enemies.free(e);
      continue;
    }
    if (e.state === 'inhibited') {
      e.timer -= dt;
      const drift = e.inhibit === 'frozen' ? 0 : e.inhibit === 'locked' ? 25 : 10;
      e.x += Math.sin(e.phase) * drift * dt;
      e.y += drift * 0.5 * dt;
      if (e.inhibit === 'linked' && e.partner) {
        e.x += (e.partner.x - e.x) * Math.min(1, dt * 2) * 0.5;
        e.y += (e.partner.y - e.y) * Math.min(1, dt * 2) * 0.5;
      }
      if (e.timer <= 0) leave(e);
      continue;
    }
    if (e.frozenFor > 0) {
      e.frozenFor -= dt;
      continue;
    }
    if (e.launch > 0) {
      e.launch -= dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      continue;
    }
    const sp = def.speed * diff.speed * boost * slowed;
    const dx = h.x - e.x;
    const dy = h.y - e.y;
    const d = Math.max(1, Math.hypot(dx, dy));
    switch (def.behaviour) {
      case 'chase':
      case 'swarm':
        e.x +=
          (dx / d) * sp * dt + (def.behaviour === 'swarm' ? Math.sin(e.phase * 4) * 40 * dt : 0);
        e.y += (dy / d) * sp * dt;
        break;
      case 'stalk': {
        // circle in, then cut across from a new angle
        const orbit = Math.max(90, 260 - e.phase * 30);
        const a = Math.atan2(e.y - h.y, e.x - h.x) + dt * 1.6;
        e.x += (h.x + Math.cos(a) * orbit - e.x) * Math.min(1, dt * 2.2);
        e.y += (h.y + Math.sin(a) * orbit - e.y) * Math.min(1, dt * 2.2);
        break;
      }
      case 'zigzag':
        e.x += (dx / d) * sp * dt + Math.cos(e.phase * 3) * 160 * dt;
        e.y += (dy / d) * sp * dt;
        break;
      case 'command':
        e.y += (FIELD.top + 160 - e.y) * Math.min(1, dt);
        e.x += Math.sin(e.phase * 0.7) * 80 * dt;
        e.attackTimer -= dt;
        if (e.attackTimer <= 0) {
          e.attackTimer = 6;
          spawn(w, w.rng.next() < 0.5 ? 'swarm' : 'cutter', 3, 'cluster');
        }
        break;
      case 'slow-beam':
      case 'boss-lunge':
      case 'boss-sweep':
        stepAttacker(w, e, ev, dt, sp, dx, dy, d);
        break;
    }
    // touching the hero cuts at the genome
    const r = def.radius + 20;
    const close = Math.hypot(h.x - e.x, h.y - e.y);
    const beamHit = e.attack?.kind === 'beam' && onBeam(e, h.x, h.y);
    if (close < r || beamHit) hurt(w, def.damage * diff.damage * dt, ev);
    else if (close < r + 26 && !e.grazed && e.y < h.y + 40) {
      e.grazed = true;
      w.stats.dodges++;
      w.score += 5;
      ev.push({ type: 'dodge' });
    }
    if (e.y > FIELD.h + 80 || e.x < -120 || e.x > FIELD.w + 120) w.enemies.free(e);
  }
}

/** Shredders and bosses: aim (telegraphed), then lunge or beam. */
function stepAttacker(
  w: World,
  e: Enemy,
  ev: WorldEvent[],
  dt: number,
  sp: number,
  dx: number,
  dy: number,
  d: number,
): void {
  const def = ENEMIES[e.kind];
  const boss = e.isBoss;
  if (!e.attack) {
    // drift toward a comfortable distance
    const want = boss ? 0 : 160;
    if (boss) {
      e.x += (FIELD.w / 2 + Math.sin(e.phase * 0.5) * 220 - e.x) * Math.min(1, dt);
      e.y += (FIELD.top + 120 - e.y) * Math.min(1, dt);
    } else if (d > want) {
      e.x += (dx / d) * sp * dt;
      e.y += (dy / d) * sp * dt;
    }
    e.attackTimer -= dt;
    if (e.attackTimer <= 0) {
      e.attack = { kind: 'aim', t: boss ? 1.1 : 1, dx: dx / d, dy: dy / d };
      ev.push({ type: 'telegraph', kind: e.kind });
    }
    return;
  }
  const a = e.attack;
  a.t -= dt;
  if (a.kind === 'aim' && a.t <= 0) {
    const lunge = def.behaviour === 'boss-lunge';
    e.attack = { kind: lunge ? 'lunge' : 'beam', t: lunge ? 0.8 : 1.3, dx: a.dx, dy: a.dy };
  } else if (a.kind === 'lunge') {
    e.x += a.dx * 620 * dt;
    e.y += a.dy * 620 * dt;
    if (a.t <= 0) endAttack(e, boss);
  } else if (a.kind === 'beam') {
    if (def.behaviour === 'boss-sweep') {
      const ang = Math.atan2(a.dy, a.dx) + dt * 0.8;
      a.dx = Math.cos(ang);
      a.dy = Math.sin(ang);
    }
    if (a.t <= 0) endAttack(e, boss);
  }
  e.x = clamp(e.x, 40, FIELD.w - 40);
  e.y = clamp(e.y, FIELD.top - 40, FIELD.h - 40);
  if (boss && e.kind === 'prime' && w.rng.next() < dt * 0.4) spawn(w, 'swarm', 3, 'cluster');
}

function endAttack(e: Enemy, boss: boolean): void {
  e.attack = null;
  e.attackTimer = boss ? 3.2 : 3.5;
}

/** Within the beam: a long, narrow strip from the attacker along its aim. */
export function onBeam(e: Enemy, x: number, y: number): boolean {
  if (!e.attack) return false;
  const px = x - e.x;
  const py = y - e.y;
  const along = px * e.attack.dx + py * e.attack.dy;
  const across = Math.abs(px * e.attack.dy - py * e.attack.dx);
  return along > 0 && along < 900 && across < 26;
}

function hurt(w: World, amount: number, ev: WorldEvent[]): void {
  const h = w.hero;
  if (h.shield > 0) {
    // a shield charge soaks up one contact (a short burst of damage)
    h.shield = Math.max(0, h.shield - amount / 6);
    ev.push({ type: 'shielded' });
    return;
  }
  h.integrity -= amount;
  w.stats.damageTaken += amount;
  h.hurtFlash = 0.15;
  ev.push({ type: 'hurt', amount });
}

// ---------- obstacles and specials ----------

function stepObstacles(w: World, dt: number): void {
  if (w.wave.obstacleRate > 0) {
    w.obstacleTimer -= dt;
    if (w.obstacleTimer <= 0) {
      w.obstacleTimer = 1 / w.wave.obstacleRate;
      const o = w.obstacles.spawn();
      if (o) {
        o.r = 34 + w.rng.next() * 26;
        o.x = 80 + w.rng.next() * (FIELD.w - 160);
        o.y = FIELD.top - o.r;
        o.vy = 60 + w.rng.next() * 50;
      }
    }
  }
  for (const o of w.obstacles.live()) {
    o.y += o.vy * dt;
    if (o.y > FIELD.h + o.r) w.obstacles.free(o);
  }
}

function stepSpecials(w: World, input: Input, ev: WorldEvent[], dt: number): void {
  const h = w.hero;
  if (
    input.reinforce &&
    reinforcementsUnlocked(w) &&
    w.charge >= REINFORCEMENTS.charge &&
    w.allyTime <= 0
  ) {
    w.charge = 0;
    w.allyTime = REINFORCEMENTS.duration + w.mods.allyTime;
    const n = REINFORCEMENTS.allies + w.mods.allies;
    w.allies = Array.from({ length: n }, (_, i) => ({
      x: h.x,
      y: h.y,
      angle: (i / n) * Math.PI * 2,
    }));
    w.stats.specialUses++;
    ev.push({ type: 'reinforce' });
  }
  if (w.allyTime > 0) {
    w.allyTime -= dt;
    w.allyTimer -= dt;
    w.allies.forEach((a, i) => {
      a.angle += dt * 1.2;
      const tx = h.x + Math.cos(a.angle) * 120;
      const ty = h.y - 60 + Math.sin(a.angle) * 70;
      a.x += (tx - a.x) * Math.min(1, dt * 4);
      a.y += (ty - a.y) * Math.min(1, dt * 4);
      if (w.allyTimer <= 0) {
        const id = w.equipped[i % w.equipped.length] ?? 'blockade';
        const t = nearest(w, a.x, a.y, 700, (e) => compatible(id, e.kind));
        if (t) shoot(w, id, a.x, a.y, Math.atan2(t.y - a.y, t.x - a.x), true);
      }
    });
    if (w.allyTimer <= 0) w.allyTimer = 1 / REINFORCEMENTS.shotRate;
    if (w.allyTime <= 0) w.allies = [];
  }
  if (input.cloud && cloudReady(w)) {
    w.cloud = { x: h.x, y: h.y, t: 0.6 };
    w.cloudCooldown = CLOUD.cooldown * w.mods.cloudCooldown;
    w.stats.specialUses++;
    for (const e of w.enemies.live())
      if (e.state === 'active' && Math.hypot(e.x - h.x, e.y - h.y) < CLOUD.radius) {
        e.frozenFor = e.isBoss ? CLOUD.duration / 2 : CLOUD.duration;
        e.attack = null;
      }
    ev.push({ type: 'cloud' });
  }
  if (w.cloud) {
    w.cloud.t -= dt;
    if (w.cloud.t <= 0) w.cloud = null;
  }
}

function clamp(x: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, x));
}

/** Final score with a breakdown, for the results screen. */
export function finalScore(w: World) {
  const accuracy =
    w.stats.compatibleHits + w.stats.resisted > 0
      ? w.stats.compatibleHits / (w.stats.compatibleHits + w.stats.resisted)
      : 0;
  const survival = Math.round(w.time * 5);
  const integrity = Math.round(w.hero.integrity * 10);
  const matching = Math.round(accuracy * 500);
  const specials = w.stats.specialInhibits * 20;
  return {
    inhibitions: w.score,
    survival,
    integrity,
    matching,
    specials,
    // the integrity bonus is already in w.score when the campaign is won
    total: w.score + survival + matching,
    accuracy,
  };
}

export function seedFromTime(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

export { createRng };
