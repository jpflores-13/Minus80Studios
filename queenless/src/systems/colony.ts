import { createRng, type Rng } from '../utils/rng';
import { clamp, dist, type Vec2 } from '../utils/math';

// A lightweight agent-based colony. Workers choose their own task each decision tick from a
// weighted local utility, not a rigid character class or a player-assigned role. Buzz Pulse
// (the player's one tool) temporarily raises how strongly a worker attends to local need; it
// never assigns a task directly. See docs/SCIENCE.md for what this is and isn't modelling.

export const TUNING = {
  /** How often each worker re-evaluates its task, seconds (staggered per worker). */
  decisionInterval: 1.4,
  /** Move speed, px/s. */
  moveSpeed: 90,
  /** Energy drained per second while active; regained while resting. */
  energyDrainRate: 1.6,
  energyRestRate: 10,
  lowEnergyThreshold: 20,
  /** Buzz Pulse: radius, duration of the boost, cooldown, and how strongly it raises attention. */
  pulseRadius: 120,
  pulseBoostSeconds: 6,
  pulseCooldown: 4,
  pulseStrength: 1.8,
  /** Cost per pixel of travel, subtracted from a task's utility (favours nearby work). */
  distanceCost: 0.0022,
  /** Extra behavioural randomness once the queen is gone: previously constrained variation
   *  becomes visible. 0 while queenright. */
  postQueenLossVariance: 0.35,
  /** How fast reproductive activation rises for a worker with non-zero latent potential,
   *  once the queen is gone. Purely a gameplay number, not a measured rate. */
  reproductiveActivationRate: 0.02,
  reproductiveCompetitionThreshold: 0.55,
  /** How close two workers need to be to log an interaction (and to compete, if both are
   *  reproductively activated). */
  interactionRadius: 34,
  interactionCooldown: 2.5,
  /** Site dynamics. */
  nectarRegrow: 0.05,
  forageYield: 0.5,
  broodDecay: 0.6,
  broodCareRate: 10,
  debrisGrowth: 0.08,
  maintenanceRate: 0.3,
} as const;

export type Tendency = 'forage' | 'broodCare' | 'nestMaintenance';
export type BehaviorState =
  | 'wandering'
  | 'resting'
  | 'foraging'
  | 'transporting'
  | 'broodCare'
  | 'investigating'
  | 'interacting'
  | 'reproductiveCompetition';

export interface WorkerTraits {
  forageTendency: number;
  broodCareTendency: number;
  nestMaintenanceTendency: number;
  /** A point in the nest this worker drifts back toward when nothing more urgent calls. */
  spatialPreference: Vec2;
  /** How strongly Buzz Pulse affects this worker's attention, 0-1. */
  responsiveness: number;
  /** Baseline rate of initiating interactions with nearby nestmates. */
  socialActivity: number;
  /**
   * Hidden until the queen is gone: how readily this worker's social activity and
   * reproductive activation rise once she is. A real, if small, number for every worker;
   * the brief's "previously overlooked" characters just happen to have a high one.
   */
  latentPotential: number;
}

export interface Worker {
  id: number;
  name: string;
  traits: WorkerTraits;
  pos: Vec2;
  state: BehaviorState;
  targetSite: string | null;
  carrying: boolean;
  /** Which kind of task this worker most recently completed, for the "reorganized" event. */
  lastTask: Tendency | null;
  energy: number;
  reproductiveActivation: number;
  /** Degree-style centrality: distinct nestmates interacted with recently, decayed over time. */
  influence: number;
  decisionTimer: number;
  pulseBoostUntil: number;
  interactionCooldowns: Map<number, number>;
  /** Present and controllable in the scene, but still an ordinary worker in the simulation. */
  isPlayer: boolean;
  removed: boolean;
}

export interface Site {
  id: string;
  kind: 'flower' | 'broodCell' | 'debris' | 'rest' | 'storage';
  pos: Vec2;
  /** flower: nectar available (0-1). broodCell: care need (0-1). debris: mess (0-1). */
  level: number;
}

export interface Disturbance {
  /** Seconds into the level this fires. */
  at: number;
  kind: 'removeForagers' | 'resourceShortage' | 'queenLost';
  count?: number;
}

export interface ColonyConfig {
  workers: { name: string; traits: WorkerTraits; isPlayer?: boolean }[];
  sites: Omit<Site, 'level'>[];
  disturbances: Disturbance[];
  durationSeconds: number;
  startsQueenless: boolean;
}

export interface ColonyState {
  config: ColonyConfig;
  time: number;
  queenPresent: boolean;
  foodReserves: number;
  broodHealth: number;
  nestCleanliness: number;
  workers: Worker[];
  sites: Site[];
  /** "idA:idB" (lower id first) -> interactions logged this run. For the decentralisation view. */
  interactions: Map<string, number>;
  rng: Rng;
  firedDisturbances: Set<number>;
  done: boolean;
  healthSampleSum: number;
  healthSampleCount: number;
}

export type ColonyEvent =
  | { type: 'forageStart'; workerId: number }
  | { type: 'delivered'; workerId: number }
  | { type: 'broodCared'; workerId: number }
  | { type: 'debrisCleared'; workerId: number }
  | { type: 'reorganized'; workerId: number; into: Tendency }
  | { type: 'interaction'; a: number; b: number }
  | { type: 'reproductiveCompetition'; a: number; b: number }
  | { type: 'disturbance'; kind: Disturbance['kind'] }
  | { type: 'queenLost' }
  | { type: 'done' };

export function createColony(config: ColonyConfig, seed = 1): ColonyState {
  const rng = createRng(seed);
  const workers: Worker[] = config.workers.map((w, i) => ({
    id: i,
    name: w.name,
    traits: w.traits,
    pos: { ...w.traits.spatialPreference },
    state: 'wandering',
    targetSite: null,
    carrying: false,
    lastTask: null,
    energy: 80 + rng.next() * 20,
    reproductiveActivation: 0,
    influence: 0,
    decisionTimer: rng.next() * TUNING.decisionInterval,
    pulseBoostUntil: 0,
    interactionCooldowns: new Map(),
    isPlayer: w.isPlayer ?? false,
    removed: false,
  }));
  const sites: Site[] = config.sites.map((s) => ({
    ...s,
    level: s.kind === 'flower' ? 0.6 + rng.next() * 0.4 : s.kind === 'debris' ? 0.2 : 0.3,
  }));
  return {
    config,
    time: 0,
    queenPresent: !config.startsQueenless,
    foodReserves: 50,
    broodHealth: 80,
    nestCleanliness: 80,
    workers,
    sites,
    interactions: new Map(),
    rng,
    firedDisturbances: new Set(),
    done: false,
    healthSampleSum: 0,
    healthSampleCount: 0,
  };
}

/** Buzz Pulse: raise attention for every worker (not the player) within range, briefly. */
export function buzzPulse(s: ColonyState, origin: Vec2): number {
  let affected = 0;
  for (const w of s.workers) {
    if (w.isPlayer || w.removed) continue;
    if (dist(w.pos, origin) <= TUNING.pulseRadius) {
      w.pulseBoostUntil = s.time + TUNING.pulseBoostSeconds;
      affected++;
    }
  }
  return affected;
}

export function stepColony(
  s: ColonyState,
  playerInput: { dx: number; dy: number },
  dt: number,
): ColonyEvent[] {
  if (s.done) return [];
  const ev: ColonyEvent[] = [];
  s.time += dt;

  s.config.disturbances.forEach((d, i) => {
    if (s.time >= d.at && !s.firedDisturbances.has(i)) {
      s.firedDisturbances.add(i);
      applyDisturbance(s, d, ev);
    }
  });

  movePlayer(s, playerInput, dt);
  for (const w of s.workers) if (!w.isPlayer && !w.removed) stepWorker(s, w, dt, ev);

  decaySites(s, dt);
  s.broodHealth = clamp(s.broodHealth, 0, 100);
  s.nestCleanliness = clamp(s.nestCleanliness, 0, 100);
  s.healthSampleSum += colonyHealth(s) * dt;
  s.healthSampleCount += dt;

  if (s.time >= s.config.durationSeconds) {
    s.done = true;
    ev.push({ type: 'done' });
  }
  return ev;
}

function applyDisturbance(s: ColonyState, d: Disturbance, ev: ColonyEvent[]): void {
  ev.push({ type: 'disturbance', kind: d.kind });
  if (d.kind === 'removeForagers') {
    const foragers = s.workers
      .filter((w) => !w.isPlayer && !w.removed)
      .sort((a, b) => b.traits.forageTendency - a.traits.forageTendency)
      .slice(0, d.count ?? 1);
    for (const w of foragers) w.removed = true;
  } else if (d.kind === 'resourceShortage') {
    for (const site of s.sites) if (site.kind === 'flower') site.level *= 0.3;
    s.foodReserves *= 0.5;
  } else if (d.kind === 'queenLost') {
    s.queenPresent = false;
    ev.push({ type: 'queenLost' });
  }
}

function movePlayer(s: ColonyState, input: { dx: number; dy: number }, dt: number): void {
  const player = s.workers.find((w) => w.isPlayer);
  if (!player) return;
  const len = Math.hypot(input.dx, input.dy);
  if (len < 0.05) return;
  player.pos.x += (input.dx / len) * TUNING.moveSpeed * dt;
  player.pos.y += (input.dy / len) * TUNING.moveSpeed * dt;
}

/** The utility of each candidate task for a worker right now: tendency × local need ×
 *  pulse attention − distance cost, plus post-queen-loss noise. Highest wins. */
function evaluateTasks(
  s: ColonyState,
  w: Worker,
): { task: Tendency; site: Site; utility: number } | null {
  const boosted = w.pulseBoostUntil > s.time;
  const attention = boosted ? 1 + w.traits.responsiveness * TUNING.pulseStrength : 1;
  const variance = s.queenPresent ? 0 : TUNING.postQueenLossVariance;
  const noise = () => (s.rng.next() - 0.5) * variance;

  const candidates: { task: Tendency; site: Site; utility: number }[] = [];
  for (const site of s.sites) {
    const task: Tendency | null =
      site.kind === 'flower'
        ? 'forage'
        : site.kind === 'broodCell'
          ? 'broodCare'
          : site.kind === 'debris'
            ? 'nestMaintenance'
            : null;
    if (!task) continue;
    const tendency =
      task === 'forage'
        ? w.traits.forageTendency
        : task === 'broodCare'
          ? w.traits.broodCareTendency
          : w.traits.nestMaintenanceTendency;
    if (tendency <= 0.02 || site.level <= 0.08) continue;
    const d = dist(w.pos, site.pos);
    const utility = tendency * site.level * attention - d * TUNING.distanceCost + noise();
    candidates.push({ task, site, utility });
  }
  candidates.sort((a, b) => b.utility - a.utility);
  return candidates[0] ?? null;
}

function stepWorker(s: ColonyState, w: Worker, dt: number, ev: ColonyEvent[]): void {
  w.decisionTimer -= dt;
  w.energy = clamp(
    w.energy - (w.state === 'resting' ? -TUNING.energyRestRate : TUNING.energyDrainRate) * dt,
    0,
    100,
  );

  // A worker already carrying out a task (foraging, transporting, caring for brood, clearing
  // debris) sees it through: moveAndAct ends that state on its own once the trip or the job is
  // actually done. The decision timer only ever picks a NEW task for a worker with nothing on,
  // so nobody abandons a nectar run home just because 1.5 seconds went by.
  if (w.energy < TUNING.lowEnergyThreshold && w.state !== 'resting') {
    w.state = 'resting';
    w.targetSite = null;
  } else if (w.state === 'resting' && w.energy >= 60) {
    w.state = 'wandering';
    w.targetSite = null;
    w.decisionTimer = 0;
  } else if (w.state === 'wandering' && (w.decisionTimer <= 0 || !w.targetSite)) {
    w.decisionTimer = TUNING.decisionInterval * (0.8 + s.rng.next() * 0.4);
    const choice = evaluateTasks(s, w);
    if (choice) {
      w.targetSite = choice.site.id;
      w.state =
        choice.task === 'forage'
          ? 'foraging'
          : choice.task === 'broodCare'
            ? 'broodCare'
            : 'investigating';
      if (w.lastTask && w.lastTask !== choice.task)
        ev.push({ type: 'reorganized', workerId: w.id, into: choice.task });
    }
  }

  moveAndAct(s, w, dt, ev);
  handleReproduction(s, w, dt, ev);
  logInteractions(s, w, dt, ev);
}

function moveAndAct(s: ColonyState, w: Worker, dt: number, ev: ColonyEvent[]): void {
  const storage = s.sites.find((x) => x.kind === 'storage');
  let target: Vec2 | null = null;
  if (w.state === 'resting') target = w.traits.spatialPreference;
  else if (w.state === 'transporting') target = storage?.pos ?? null;
  else if (w.targetSite) target = s.sites.find((x) => x.id === w.targetSite)?.pos ?? null;
  else if (w.state === 'wandering') target = w.traits.spatialPreference;

  if (!target) return;
  const d = dist(w.pos, target);
  if (d > 4) {
    const step = Math.min(d, TUNING.moveSpeed * dt);
    w.pos.x += ((target.x - w.pos.x) / d) * step;
    w.pos.y += ((target.y - w.pos.y) / d) * step;
    return;
  }

  // arrived
  if (w.state === 'foraging' && w.targetSite) {
    const site = s.sites.find((x) => x.id === w.targetSite);
    if (site && site.level > 0.05) {
      site.level = clamp(site.level - TUNING.forageYield * dt, 0, 1);
      w.carrying = true;
      if (!s.interactions.has(`forage:${w.id}`)) {
        ev.push({ type: 'forageStart', workerId: w.id });
        s.interactions.set(`forage:${w.id}`, 1);
      }
      if (site.level <= 0.05) {
        w.state = 'transporting';
        w.targetSite = null;
      }
    } else {
      w.state = 'transporting';
      w.targetSite = null;
    }
  } else if (w.state === 'transporting') {
    s.foodReserves = clamp(s.foodReserves + 4, 0, 200);
    w.carrying = false;
    w.lastTask = 'forage';
    ev.push({ type: 'delivered', workerId: w.id });
    w.state = 'wandering';
  } else if (w.state === 'broodCare' && w.targetSite) {
    const site = s.sites.find((x) => x.id === w.targetSite);
    if (site) {
      site.level = clamp(site.level - TUNING.broodCareRate * dt * 0.1, 0, 1);
      s.broodHealth = clamp(s.broodHealth + TUNING.broodCareRate * dt, 0, 100);
      if (site.level <= 0.05) {
        w.lastTask = 'broodCare';
        ev.push({ type: 'broodCared', workerId: w.id });
        w.state = 'wandering';
        w.targetSite = null;
      }
    }
  } else if (w.state === 'investigating' && w.targetSite) {
    const site = s.sites.find((x) => x.id === w.targetSite);
    if (site) {
      site.level = clamp(site.level - TUNING.maintenanceRate * dt, 0, 1);
      s.nestCleanliness = clamp(s.nestCleanliness + TUNING.maintenanceRate * dt * 10, 0, 100);
      if (site.level <= 0.05) {
        w.lastTask = 'nestMaintenance';
        ev.push({ type: 'debrisCleared', workerId: w.id });
        w.state = 'wandering';
        w.targetSite = null;
      }
    }
  } else if (w.state === 'wandering' || w.state === 'resting') {
    s.interactions.delete(`forage:${w.id}`);
  }
}

/** Latent reproductive potential rises, and is spent in low-stakes "competition" meetings,
 *  only once the queen is gone. Movement alone is not reproduction; this is an abstraction. */
function handleReproduction(s: ColonyState, w: Worker, dt: number, ev: ColonyEvent[]): void {
  if (s.queenPresent) return;
  if (w.traits.latentPotential <= 0.02) return;
  w.reproductiveActivation = clamp(
    w.reproductiveActivation + TUNING.reproductiveActivationRate * w.traits.latentPotential * dt,
    0,
    1,
  );
  if (w.reproductiveActivation < TUNING.reproductiveCompetitionThreshold) return;
  for (const other of s.workers) {
    if (other.id === w.id || other.removed || other.isPlayer) continue;
    if (other.reproductiveActivation < TUNING.reproductiveCompetitionThreshold) continue;
    if (dist(w.pos, other.pos) > TUNING.interactionRadius) continue;
    const key = [w.id, other.id].sort((a, b) => a - b).join(':');
    if ((w.interactionCooldowns.get(other.id) ?? 0) > s.time) continue;
    w.interactionCooldowns.set(other.id, s.time + TUNING.interactionCooldown * 2);
    other.interactionCooldowns.set(w.id, s.time + TUNING.interactionCooldown * 2);
    // the more activated worker "wins" this meeting; the other backs off a little
    const [winner, loser] =
      w.reproductiveActivation >= other.reproductiveActivation ? [w, other] : [other, w];
    loser.reproductiveActivation = clamp(loser.reproductiveActivation - 0.15, 0, 1);
    winner.influence = clamp(winner.influence + 0.08, 0, 1);
    s.interactions.set(key, (s.interactions.get(key) ?? 0) + 1);
    ev.push({ type: 'reproductiveCompetition', a: w.id, b: other.id });
    return;
  }
}

function logInteractions(s: ColonyState, w: Worker, _dt: number, ev: ColonyEvent[]): void {
  for (const other of s.workers) {
    if (other.id <= w.id || other.removed) continue;
    if (dist(w.pos, other.pos) > TUNING.interactionRadius) continue;
    if ((w.interactionCooldowns.get(other.id) ?? 0) > s.time) continue;
    // a worker's own baseline sociability, with any latent boost revealed post-queen-loss
    const sociability =
      w.traits.socialActivity + (s.queenPresent ? 0 : w.traits.latentPotential * 0.6);
    if (s.rng.next() > sociability * 0.5) continue;
    w.interactionCooldowns.set(other.id, s.time + TUNING.interactionCooldown);
    other.interactionCooldowns.set(w.id, s.time + TUNING.interactionCooldown);
    const key = [w.id, other.id].sort((a, b) => a - b).join(':');
    s.interactions.set(key, (s.interactions.get(key) ?? 0) + 1);
    w.influence = clamp(w.influence + 0.04, 0, 1);
    other.influence = clamp(other.influence + 0.04, 0, 1);
    ev.push({ type: 'interaction', a: w.id, b: other.id });
  }
}

function decaySites(s: ColonyState, dt: number): void {
  for (const site of s.sites) {
    if (site.kind === 'flower') site.level = clamp(site.level + TUNING.nectarRegrow * dt, 0, 1);
    else if (site.kind === 'debris')
      site.level = clamp(site.level + TUNING.debrisGrowth * dt, 0, 1);
    else if (site.kind === 'broodCell')
      site.level = clamp(site.level + TUNING.broodDecay * dt * 0.1, 0, 1);
  }
}

/** Degree-style centrality per worker (distinct partners, weighted), for the network reveal. */
export function centralities(s: ColonyState): Map<number, number> {
  const degree = new Map<number, number>();
  for (const key of s.interactions.keys()) {
    const [a, b] = key.split(':').map(Number);
    if (a === undefined || b === undefined || Number.isNaN(a)) continue; // skip "forage:id" keys
    degree.set(a, (degree.get(a) ?? 0) + 1);
    degree.set(b, (degree.get(b) ?? 0) + 1);
  }
  return degree;
}

/** A simple 0-100 health score: the three colony resources, averaged. Used for stars, not a
 *  claim about real colony fitness. */
export function colonyHealth(s: ColonyState): number {
  return (s.foodReserves / 2 + s.broodHealth + s.nestCleanliness) / 3;
}

/** colonyHealth, averaged over the whole run rather than read at one instant. What stars use. */
export function averageHealth(s: ColonyState): number {
  return s.healthSampleCount > 0 ? s.healthSampleSum / s.healthSampleCount : colonyHealth(s);
}

/** How spread out influence/centrality is across the colony: higher = more decentralised. */
export function networkDecentralization(s: ColonyState): number {
  const values = s.workers.filter((w) => !w.removed && !w.isPlayer).map((w) => w.influence);
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  // coefficient of variation, clamped to a readable 0-1 band
  return clamp(Math.sqrt(variance) / mean / 2, 0, 1);
}
