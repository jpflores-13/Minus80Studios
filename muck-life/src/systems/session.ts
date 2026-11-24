import { ARCADE, SIM } from '../config/tuning';
import type { DirectorContext, Objective, SessionConfig } from '../levels/types';
import { createRng, type Rng } from '../utils/rng';
import { daylight, isNight } from './daynight';
import { DistractorField, type Distractor } from './distractors';
import { DEFAULT_FIELD, OxygenField } from './oxygen';
import { DEFAULT_GROWTH, RootSystem, type PlantEvent } from './plant';
import { isObservable, observability, RegionTracker, type Region } from './regions';
import { RoiRecorder, type Roi } from './roi';
import { accuracy, Scorer, type Award } from './scoring';
import { TimeLapse } from './timelapse';

// One playable session (a campaign level or an O2 RUSH run): the whole game, minus rendering.
// The Phaser scene only draws this state and forwards input to it.

export const WORLD = {
  width: 1280,
  height: 720,
  soilTop: 180,
} as const;

export const GROWTH_BOUNDS = { left: 20, right: 1260, top: 196, bottom: 640 };

export interface SessionSettings {
  /** Multiplies the level duration (relaxed timers). Infinity = untimed. */
  timerScale: number;
  hitRadius: number;
  /** Gentle difficulty: more forgiving endless mode. */
  gentle: boolean;
  /** Multiplies imaging-artefact spawn rate (gentle 0.5, standard 1, spicy 1.6). */
  distractorScale: number;
}

export const DEFAULT_SETTINGS: SessionSettings = {
  timerScale: 1,
  hitRadius: ARCADE.hitRadiusPx,
  gentle: false,
  distractorScale: 1,
};

export type SessionEvent =
  | { kind: 'emerge'; plant: PlantEvent }
  | { kind: 'lost'; region: Region }
  | { kind: 'roi'; roi: Roi }
  | { kind: 'dusk' }
  | { kind: 'dawn' }
  | { kind: 'twist' }
  | { kind: 'tip'; text: string }
  | { kind: 'objectives' }
  | { kind: 'end'; reason: 'time' | 'gaps' | 'objectives' };

export type ClickResult =
  | { kind: 'observed'; region: Region; award: Award; why: string }
  | { kind: 'duplicate'; region: Region }
  | { kind: 'cooldown'; region: Region }
  | { kind: 'distractor'; distractor: Distractor }
  | { kind: 'empty'; reading: number };

export interface ObjectiveStatus {
  objective: Objective;
  label: string;
  value: number;
  done: boolean;
}

export function objectiveLabel(o: Objective): string {
  switch (o.kind) {
    case 'observations':
      return `Document ${o.n} oxygenation events`;
    case 'tracked':
      return `Track ${o.n} advancing root tips (re-document after they move)`;
    case 'lateral':
      return `Document ${o.n} lateral-root plumes`;
    case 'apex':
      return `Document ${o.n} rhizome-apex pools`;
    case 'fresh':
      return `Catch ${o.n} fresh emergences`;
    case 'night':
      return `Document ${o.n} signals at night`;
    case 'roi':
      return `Record ${o.n} oxygen changes with an ROI window`;
    case 'streak':
      return `Reach a ${o.n}× observation streak`;
    case 'score':
      return `Score ${o.n.toLocaleString('en-US')} points`;
  }
}

export class Session {
  readonly plant: RootSystem;
  readonly field: OxygenField;
  readonly tracker = new RegionTracker();
  readonly scorer: Scorer;
  readonly distractors: DistractorField;
  readonly timelapse = new TimeLapse(ARCADE.timelapseSnapshotHours, ARCADE.timelapseWindowHours);
  readonly rois = new RoiRecorder();
  readonly rng: Rng;
  readonly duration: number;
  gameSec = 0;
  simHour: number;
  thresholdIndex = 1;
  finished = false;
  endReason: 'time' | 'gaps' | 'objectives' | null = null;
  scanUntil = -Infinity;
  scanReadyAt = 0;
  /** Imaged area (x range). Outside it the optode shows nothing. */
  imaging: { left: number; right: number } = { left: 0, right: WORLD.width };
  private imagingRight = 0;
  private simCarry = 0;
  private detectTimer = 0;
  private wasNight: boolean;
  private twistAt = -1;
  private tipIndex = 0;
  private objectivesDoneAt = -1;
  private pending: SessionEvent[] = [];
  private readonly director: ((ctx: DirectorContext) => void) | undefined;

  constructor(
    readonly cfg: SessionConfig,
    readonly settings: SessionSettings = DEFAULT_SETTINGS,
  ) {
    this.rng = createRng(cfg.seed);
    this.director = cfg.makeDirector?.();
    this.plant = new RootSystem(cfg.seed + 1, {
      ...DEFAULT_GROWTH,
      bounds: GROWTH_BOUNDS,
      ...cfg.growth,
    });
    this.field = new OxygenField(0, WORLD.soilTop, WORLD.width, WORLD.height - WORLD.soilTop, {
      ...DEFAULT_FIELD,
      dielEnabled: cfg.dayNight,
      ...cfg.field,
    });
    this.scorer = new Scorer(() => this.thresholdIndex);
    this.distractors = new DistractorField(
      createRng(cfg.seed + 2),
      { left: 20, right: WORLD.width - 20, top: WORLD.soilTop + 20, bottom: 660 },
      0,
      () => this.tracker.visible(),
    );
    this.duration =
      cfg.duration === Infinity || settings.timerScale === Infinity
        ? Infinity
        : cfg.duration * settings.timerScale;

    const t0 = cfg.startHour - cfg.warmupHours;
    cfg.setup(this.plant, this.rng, t0);
    // Warmup: develop the plant (and its oxygen pools) before the player arrives.
    for (let t = t0; t < cfg.startHour; t += SIM.stepHours) {
      this.plant.step(SIM.stepHours, t);
      this.field.step(this.plant, t, SIM.stepHours);
    }
    this.plant.drainEvents();
    this.simHour = cfg.startHour;
    this.wasNight = cfg.dayNight && isNight(this.simHour);
    this.updateImaging();
    this.tracker.update(this.plant, this.field, this.simHour, 0, this.threshold);
    this.tracker.drainLost();
  }

  get threshold(): number {
    return SIM.thresholds[this.thresholdIndex] ?? 12;
  }

  get remaining(): number {
    return Math.max(0, this.duration - this.gameSec);
  }

  get night(): boolean {
    return this.cfg.dayNight && isNight(this.simHour);
  }

  get light(): number {
    return this.cfg.dayNight ? daylight(this.simHour) : 1;
  }

  get stats() {
    return this.scorer.stats;
  }

  /** Advances the game by dt seconds. Returns events for feedback. */
  update(dt: number): SessionEvent[] {
    if (this.finished) return this.flush();
    this.gameSec += dt;
    this.simCarry += dt * this.cfg.hoursPerSecond;
    while (this.simCarry >= SIM.stepHours) {
      this.simCarry -= SIM.stepHours;
      this.plant.step(SIM.stepHours, this.simHour);
      this.field.step(this.plant, this.simHour, SIM.stepHours);
      this.simHour += SIM.stepHours;
    }
    for (const e of this.plant.drainEvents()) this.pending.push({ kind: 'emerge', plant: e });

    this.director?.({
      plant: this.plant,
      rng: this.rng,
      gameSec: this.gameSec,
      simHour: this.simHour,
      dt,
      setDistractorRate: (r) => (this.distractors.rate = r * this.settings.distractorScale),
    });
    if (!this.director) {
      const rate = this.gameSec >= this.cfg.distractorStartSec ? this.cfg.distractorRate : 0;
      this.distractors.rate = rate * this.settings.distractorScale;
    }
    this.distractors.update(dt);
    this.updateImaging();

    this.detectTimer -= dt;
    if (this.detectTimer <= 0) {
      this.detectTimer = ARCADE.detectEverySec;
      this.tracker.update(this.plant, this.field, this.simHour, this.gameSec, this.threshold);
      for (const r of this.tracker.drainLost()) {
        if (!this.inImaging(r.x)) continue;
        this.stats.lostEvents++;
        this.pending.push({ kind: 'lost', region: r });
      }
    }
    this.scorer.tick(this.gameSec);
    this.timelapse.maybeRecord(this.simHour, () => this.field.snapshot());
    for (const roi of this.rois.update(this.simHour, (x, y) => this.field.sample(x, y))) {
      this.stats.roiEvents++;
      this.scorer.bonus(ARCADE.roiBonus);
      this.pending.push({ kind: 'roi', roi });
    }

    this.dayNightEvents();
    const tip = this.cfg.tips[this.tipIndex];
    if (tip && this.gameSec >= tip.at) {
      this.tipIndex++;
      this.pending.push({ kind: 'tip', text: tip.text });
    }
    this.checkEnd();
    return this.flush();
  }

  private dayNightEvents(): void {
    if (!this.cfg.dayNight) return;
    const n = isNight(this.simHour);
    if (n !== this.wasNight) {
      this.wasNight = n;
      this.pending.push({ kind: n ? 'dusk' : 'dawn' });
      if (n && this.cfg.nightTwist && this.twistAt < 0) this.twistAt = this.gameSec + 2.5;
    }
    if (this.twistAt > 0 && this.gameSec >= this.twistAt) {
      this.twistAt = 0;
      this.pending.push({ kind: 'twist' });
    }
  }

  private checkEnd(): void {
    const allDone = this.objectiveStatus().every((o) => o.done);
    if (allDone && this.objectivesDoneAt < 0) {
      this.objectivesDoneAt = this.gameSec;
      this.pending.push({ kind: 'objectives' });
    }
    if (this.cfg.maxDataGaps > 0) {
      const limit = this.settings.gentle
        ? Math.round(this.cfg.maxDataGaps * (ARCADE.endlessDataGapsGentle / ARCADE.endlessDataGaps))
        : this.cfg.maxDataGaps;
      if (this.stats.lostEvents >= limit) return this.end('gaps');
    }
    if (this.duration !== Infinity && this.gameSec >= this.duration) return this.end('time');
    // Untimed campaign levels wrap up a few seconds after every objective is met.
    if (
      this.duration === Infinity &&
      this.cfg.objectives.length > 0 &&
      this.objectivesDoneAt >= 0 &&
      this.gameSec - this.objectivesDoneAt > 6
    )
      this.end('objectives');
  }

  end(reason: 'time' | 'gaps' | 'objectives'): void {
    if (this.finished) return;
    this.finished = true;
    this.endReason = reason;
    this.pending.push({ kind: 'end', reason });
  }

  private flush(): SessionEvent[] {
    const e = this.pending;
    this.pending = [];
    return e;
  }

  private updateImaging(): void {
    if (!this.cfg.imagingExpands) return;
    // The window only ever widens, to keep the newest growth (plus a margin) in view.
    let right = 360;
    for (const s of this.plant.segments) {
      const tip = s.points[s.points.length - 1];
      if (tip) right = Math.max(right, tip.x + 160);
    }
    this.imaging.right = Math.min(WORLD.width, Math.max(this.imagingRight, right));
    this.imagingRight = this.imaging.right;
  }

  inImaging(x: number): boolean {
    return x >= this.imaging.left && x <= this.imaging.right;
  }

  /** The optode reading under a point (% saturation); 0 outside the imaged area. */
  readout(x: number, y: number): number {
    if (y < WORLD.soilTop || !this.inImaging(x)) return 0;
    return this.field.sample(x, y);
  }

  /** The player tries to document whatever is under (x, y). */
  click(x: number, y: number): ClickResult {
    const r = this.inImaging(x)
      ? this.tracker.hit(x, y, this.settings.hitRadius, this.field)
      : null;
    if (r) {
      const why = observability(r, this.simHour, this.gameSec);
      if (why === 'cooldown') return { kind: 'cooldown', region: r };
      if (!isObservable(why)) {
        this.scorer.duplicate();
        return { kind: 'duplicate', region: r };
      }
      const award = this.scorer.observe(r, why, {
        simHour: this.simHour,
        gameSec: this.gameSec,
        night: this.night,
        nightBonus: this.cfg.nightBonus,
      });
      this.tracker.document(r, this.simHour, this.gameSec);
      return { kind: 'observed', region: r, award, why };
    }
    const d = this.distractors.hit(x, y, this.settings.hitRadius * 0.8);
    this.scorer.miss();
    if (d) return { kind: 'distractor', distractor: d };
    return { kind: 'empty', reading: this.readout(x, y) };
  }

  /** Every visible region that would count as a new observation right now. */
  observableRegions(): Region[] {
    return this.tracker
      .visible()
      .filter(
        (r) => this.inImaging(r.x) && isObservable(observability(r, this.simHour, this.gameSec)),
      );
  }

  scan(): boolean {
    if (!this.cfg.features.scan || this.gameSec < this.scanReadyAt) return false;
    this.scanUntil = this.gameSec + ARCADE.scanDurationSec;
    this.scanReadyAt = this.gameSec + ARCADE.scanCooldownSec;
    return true;
  }

  get scanning(): boolean {
    return this.gameSec < this.scanUntil;
  }

  cycleThreshold(): number {
    if (!this.cfg.features.threshold) return this.thresholdIndex;
    this.thresholdIndex = (this.thresholdIndex + 1) % SIM.thresholds.length;
    this.tracker.update(this.plant, this.field, this.simHour, this.gameSec, this.threshold);
    this.tracker.drainLost();
    return this.thresholdIndex;
  }

  placeRoi(x: number, y: number): Roi | null {
    if (!this.cfg.features.roi || y < WORLD.soilTop || !this.inImaging(x)) return null;
    return this.rois.place(x, y, this.simHour);
  }

  objectiveStatus(): ObjectiveStatus[] {
    const s = this.stats;
    return this.cfg.objectives.map((o) => {
      const value =
        o.kind === 'observations'
          ? s.observations
          : o.kind === 'tracked'
            ? s.tracked
            : o.kind === 'lateral'
              ? s.byOrgan.lateral
              : o.kind === 'apex'
                ? s.byOrgan.rhizome
                : o.kind === 'fresh'
                  ? s.fresh
                  : o.kind === 'night'
                    ? s.night
                    : o.kind === 'roi'
                      ? s.roiEvents
                      : o.kind === 'streak'
                        ? s.bestStreak
                        : s.score;
      return { objective: o, label: objectiveLabel(o), value, done: value >= o.n };
    });
  }

  objectivesMet(): boolean {
    return this.objectiveStatus().every((o) => o.done);
  }

  accuracy(): number {
    return accuracy(this.stats);
  }
}
