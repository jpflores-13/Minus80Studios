import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress } from '../config/progress';
import { ARCADE, SIM } from '../config/tuning';
import { CHEMISTRY_LEGEND } from '../content/science';
import { campaignLevel, CAMPAIGN_META } from '../levels/campaign';
import {
  PREDICTION_HOURS,
  PREDICTION_MARKERS,
  PREDICTION_ROUNDS,
  rushConfig,
  scorePredictions,
  type RushMode,
} from '../levels/rush';
import type { SessionConfig } from '../levels/types';
import {
  Aboveground,
  drawDistractors,
  drawSediment,
  Heatmap,
  legendGradient,
  RootRenderer,
  VIEW_LABEL,
  type ViewMode,
} from '../render/marsh';
import { LEGEND_MAX } from '../render/colormap';
import { clockLabel, elapsedLabel } from '../systems/daynight';
import { DISTRACTOR_LABEL } from '../systems/distractors';
import { snapshotValue } from '../systems/oxygen';
import { isObservable, observability, REGION_LABEL, type Region } from '../systems/regions';
import { roiRange } from '../systems/roi';
import { Session, WORLD, type ClickResult, type SessionEvent } from '../systems/session';
import {
  actionForKey,
  moveForKey,
  pointerIntent,
  sessionSettings,
  type InputAction,
} from '../systems/settings';
import { announce } from '../ui/announce';
import { Button } from '../ui/Button';
import { TEXT_STYLES } from '../ui/text';

export type PlayData =
  { kind: 'campaign'; index: number } | { kind: 'rush'; mode: RushMode; seed: number };

const TOOLBAR_TOP = 676;

interface Floater {
  text: Phaser.GameObjects.Text;
  life: number;
}

interface Marker {
  x: number;
  y: number;
  n: number;
  age: number;
}

interface Ring {
  x: number;
  y: number;
  age: number;
  life: number;
  color: number;
  max: number;
}

export class PlayScene extends Phaser.Scene {
  private data0!: PlayData;
  private cfg!: SessionConfig;
  private session!: Session;
  private above!: Aboveground;
  private heat!: Heatmap;
  private roots!: RootRenderer;
  private overlay!: Phaser.GameObjects.Graphics;
  private distractorG!: Phaser.GameObjects.Graphics;
  private markerG!: Phaser.GameObjects.Graphics;
  private fxG!: Phaser.GameObjects.Graphics;
  private reticleG!: Phaser.GameObjects.Graphics;
  private readoutText!: Phaser.GameObjects.Text;
  private hudScore!: Phaser.GameObjects.Text;
  private hudCombo!: Phaser.GameObjects.Text;
  private hudTimer!: Phaser.GameObjects.Text;
  private hudClock!: Phaser.GameObjects.Text;
  private hudObjectives!: Phaser.GameObjects.Text;
  private hudStatus!: Phaser.GameObjects.Text;
  private banner!: Phaser.GameObjects.Text;
  private bigText!: Phaser.GameObjects.Text;
  private chemText!: Phaser.GameObjects.Text;
  private roiTexts: Phaser.GameObjects.Text[] = [];
  private buttons: Partial<Record<InputAction, Button>> = {};
  private floaters: Floater[] = [];
  private markers: Marker[] = [];
  private rings: Ring[] = [];
  private reticle = { x: 640, y: 420 };
  private held = new Set<string>();
  private view: ViewMode = 'combined';
  private chemistry = false;
  private roiArmed = false;
  private bannerUntil = 0;
  private bigUntil = 0;
  private renderTimer = 0;
  private lastSecond = -1;
  private ending = false;
  private playback: { t: number } | null = null;
  private reduced = false;
  private padPrev: Record<string, boolean> = {};
  private quietUntil = -1;
  // Time-Lapse Challenge
  private challenge: {
    phase: 'observe' | 'predict' | 'reveal' | 'result';
    round: number;
    until: number;
    markers: { x: number; y: number }[];
    known: Set<string>;
    revealStart: number;
    total: number;
    lines: { x1: number; y1: number; x2: number; y2: number; pts: number }[];
  } | null = null;

  constructor() {
    super('Play');
  }

  init(data: PlayData): void {
    this.data0 = data;
    this.floaters = [];
    this.markers = [];
    this.rings = [];
    this.roiTexts = [];
    this.buttons = {};
    this.held = new Set();
    this.view = 'combined';
    this.roiArmed = false;
    this.ending = false;
    this.playback = null;
    this.bannerUntil = 0;
    this.bigUntil = 0;
    this.lastSecond = -1;
    this.quietUntil = -1;
    this.challenge = null;
  }

  create(): void {
    const p = progress();
    this.reduced = p.reducedMotion;
    this.cfg =
      this.data0.kind === 'campaign'
        ? campaignLevel(this.data0.index)
        : rushConfig(this.data0.mode, this.data0.seed);
    this.session = new Session(this.cfg, sessionSettings(p));
    this.chemistry = this.cfg.id === 'level6';
    if (this.data0.kind === 'rush' && this.data0.mode === 'timelapse') {
      this.challenge = {
        phase: 'observe',
        round: 1,
        until: 9,
        markers: [],
        known: new Set(),
        revealStart: 0,
        total: 0,
        lines: [],
      };
    }

    this.cameras.main.setBackgroundColor(PALETTE.mud);
    if (!this.reduced) this.cameras.main.fadeIn(250);
    this.above = new Aboveground(this, { flowerSpikes: false, reducedMotion: this.reduced });
    drawSediment(this, this.cfg.seed);
    this.heat = new Heatmap(this, this.session.field);
    this.roots = new RootRenderer(this);
    this.overlay = this.add.graphics().setDepth(7);
    this.distractorG = this.add.graphics().setDepth(8);
    this.markerG = this.add.graphics().setDepth(9);
    this.fxG = this.add.graphics().setDepth(10);
    this.reticleG = this.add.graphics().setDepth(12);
    this.readoutText = this.add
      .text(0, 0, '', {
        ...TEXT_STYLES.small,
        fontStyle: 'bold',
        backgroundColor: '#14110ecc',
        padding: { x: 6, y: 3 },
      })
      .setDepth(13);

    this.buildHud();
    this.buildToolbar();
    this.bindInput();
    sound.playSong(this.cfg.music);
    sound.setQuiet(false);
    sound.setNight(this.session.night);
    announce(
      `${this.cfg.title}. ${this.session
        .objectiveStatus()
        .map((o) => o.label)
        .join('. ')}. ` +
        'Tap oxygen pools, or move the reticle with the arrow keys and press Space. Tab jumps between signals.',
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      sound.setQuiet(false);
      this.input.keyboard?.removeAllListeners();
    });
    this.renderAll(0);
    // Dev builds only: expose the session for automated playtesting.
    if (import.meta.env.DEV) (window as unknown as { __muck?: Session }).__muck = this.session;
  }

  // ------------------------------------------------------------------ HUD

  private buildHud(): void {
    const bar = this.add.graphics().setDepth(19);
    bar.fillStyle(PALETTE.ink, 0.72);
    bar.fillRect(0, 0, WORLD.width, 42);
    const meta = this.data0.kind === 'campaign' ? CAMPAIGN_META[this.data0.index] : null;
    const title = meta ? `LEVEL ${meta.index + 1} · ${meta.name.toUpperCase()}` : this.cfg.title;
    this.add.text(14, 10, title, { ...TEXT_STYLES.label, color: PALETTE.textAmber }).setDepth(20);
    this.hudClock = this.add
      .text(14, 48, '', {
        ...TEXT_STYLES.small,
        backgroundColor: '#14110eaa',
        padding: { x: 6, y: 2 },
      })
      .setDepth(20);
    this.hudScore = this.add
      .text(WORLD.width / 2, 21, '0', { ...TEXT_STYLES.hud, fontSize: '26px' })
      .setOrigin(0.5)
      .setDepth(20);
    this.hudCombo = this.add
      .text(WORLD.width / 2 + 110, 21, '', { ...TEXT_STYLES.label, color: PALETTE.textMint })
      .setOrigin(0, 0.5)
      .setDepth(20);
    this.hudTimer = this.add
      .text(WORLD.width - 14, 10, '', { ...TEXT_STYLES.hud })
      .setOrigin(1, 0)
      .setDepth(20);
    this.hudObjectives = this.add
      .text(WORLD.width - 14, 48, '', {
        ...TEXT_STYLES.small,
        align: 'right',
        backgroundColor: '#14110eaa',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(1, 0)
      .setDepth(20);
    this.hudStatus = this.add
      .text(14, 76, '', {
        ...TEXT_STYLES.hint,
        color: PALETTE.textCyan,
        backgroundColor: '#14110eaa',
        padding: { x: 6, y: 2 },
      })
      .setDepth(20);
    this.banner = this.add
      .text(WORLD.width / 2, TOOLBAR_TOP - 34, '', {
        ...TEXT_STYLES.body,
        backgroundColor: '#14110edd',
        padding: { x: 12, y: 6 },
        align: 'center',
        wordWrap: { width: 900 },
      })
      .setOrigin(0.5, 1)
      .setDepth(25)
      .setVisible(false);
    this.bigText = this.add
      .text(WORLD.width / 2, 380, '', {
        ...TEXT_STYLES.title,
        align: 'center',
        wordWrap: { width: 1000 },
        stroke: '#14110e',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(26)
      .setVisible(false);
    this.chemText = this.add
      .text(
        14,
        104,
        `◎ ${CHEMISTRY_LEGEND.oxic}\n■ ${CHEMISTRY_LEGEND.anoxic}\n${CHEMISTRY_LEGEND.note}`,
        {
          ...TEXT_STYLES.hint,
          color: PALETTE.text,
          backgroundColor: '#14110ecc',
          padding: { x: 8, y: 5 },
          wordWrap: { width: 640 },
        },
      )
      .setDepth(20)
      .setVisible(false);
  }

  private buildToolbar(): void {
    const bar = this.add.graphics().setDepth(29);
    bar.fillStyle(PALETTE.ink, 0.85);
    bar.fillRect(0, TOOLBAR_TOP, WORLD.width, WORLD.height - TOOLBAR_TOP);
    legendGradient(this, 16, TOOLBAR_TOP + 10, 170, 12, progress().colormap).setDepth(30);
    for (let v = 0; v <= LEGEND_MAX; v += 10) {
      this.add
        .text(16 + (v / LEGEND_MAX) * 170, TOOLBAR_TOP + 24, `${v}`, {
          ...TEXT_STYLES.hint,
          fontSize: '12px',
        })
        .setOrigin(0.5, 0)
        .setDepth(30);
    }
    this.add
      .text(196, TOOLBAR_TOP + 8, '% O₂ sat.\nimaging scale', {
        ...TEXT_STYLES.hint,
        fontSize: '12px',
      })
      .setDepth(30);
    const f = this.cfg.features;
    const tools: { action: InputAction; label: string; on: boolean }[] = [
      { action: 'view', label: 'VIEW (V)', on: true },
      { action: 'scan', label: 'SCAN (Q)', on: f.scan },
      { action: 'threshold', label: 'THRESH (T)', on: f.threshold },
      { action: 'timelapse', label: 'LAPSE (L)', on: f.timelapse },
      { action: 'roi', label: 'ROI (O)', on: f.roi },
      { action: 'chemistry', label: 'CHEM (C)', on: f.chemistry },
      { action: 'pause', label: 'PAUSE (P)', on: true },
    ];
    const shown = tools.filter((t) => t.on);
    const w = 118;
    const startX = WORLD.width - shown.length * (w + 8) + w / 2 - 4;
    shown.forEach((t, i) => {
      const b = new Button(this, startX + i * (w + 8), TOOLBAR_TOP + 22, w, 34, t.label, () =>
        this.act(t.action),
      );
      b.bg.setDepth(31);
      b.label.setDepth(32).setFontSize(14);
      this.buttons[t.action] = b;
    });
  }

  // ------------------------------------------------------------------ input

  private bindInput(): void {
    const kb = this.input.keyboard;
    kb?.addCapture('TAB,SPACE,UP,DOWN,LEFT,RIGHT');
    kb?.on('keydown', (e: KeyboardEvent) => {
      sound.unlock();
      const move = moveForKey(e.key);
      if (move) {
        this.held.add(e.key);
        return;
      }
      const action = actionForKey(e.key);
      if (action) this.act(action);
    });
    kb?.on('keyup', (e: KeyboardEvent) => {
      this.held.delete(e.key);
      this.held.delete(e.key.toLowerCase());
      this.held.delete(e.key.toUpperCase());
    });
    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (ptr.y < TOOLBAR_TOP && ptr.y > WORLD.soilTop - 10) {
        this.reticle.x = ptr.x;
        this.reticle.y = Math.max(WORLD.soilTop, ptr.y);
      }
    });
    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      sound.unlock();
      const intent = pointerIntent(ptr.y, TOOLBAR_TOP, this.roiArmed);
      if (intent === 'toolbar' || ptr.y < WORLD.soilTop - 10) return;
      this.reticle.x = ptr.x;
      this.reticle.y = Math.max(WORLD.soilTop, ptr.y);
      if (intent === 'roi') this.placeRoi();
      else this.capture();
    });
  }

  private act(action: InputAction): void {
    if (this.ending) return;
    switch (action) {
      case 'capture':
        if (this.roiArmed) this.placeRoi();
        else this.capture();
        break;
      case 'pause':
        this.pause();
        break;
      case 'restart':
        this.scene.restart(this.data0);
        break;
      case 'mute':
        announce(sound.toggleMute() ? 'Sound off.' : 'Sound on.');
        break;
      case 'view': {
        const order: ViewMode[] = ['combined', 'imaging', 'natural'];
        this.view = order[(order.indexOf(this.view) + 1) % order.length]!;
        sound.play('imaging');
        this.flashBanner(`View: ${VIEW_LABEL[this.view]}`, 1.6);
        announce(`View: ${VIEW_LABEL[this.view]}`);
        break;
      }
      case 'scan':
        if (this.session.scan()) {
          sound.play('scan');
          this.rings.push({
            x: this.reticle.x,
            y: this.reticle.y,
            age: 0,
            life: 0.9,
            color: PALETTE.cyan,
            max: 700,
          });
          const n = this.session.observableRegions().length;
          announce(`Optode scan: ${n} signal${n === 1 ? '' : 's'} worth documenting.`);
        } else {
          sound.play('deny');
        }
        break;
      case 'threshold': {
        if (!this.cfg.features.threshold) return void sound.play('deny');
        const i = this.session.cycleThreshold();
        sound.play('click');
        const msg = `Imaging threshold ${SIM.thresholds[i]}% saturation, ×${ARCADE.thresholdMultiplier[i]} points`;
        this.flashBanner(msg, 2);
        announce(msg);
        break;
      }
      case 'timelapse':
        this.startPlayback();
        break;
      case 'roi':
        if (!this.cfg.features.roi) return void sound.play('deny');
        this.roiArmed = !this.roiArmed;
        sound.play('click');
        this.flashBanner(
          this.roiArmed
            ? 'ROI armed: tap a spot (or press Space) to place a window.'
            : 'ROI cancelled.',
          2,
        );
        announce(this.roiArmed ? 'ROI armed. Choose a spot.' : 'ROI cancelled.');
        break;
      case 'chemistry':
        if (!this.cfg.features.chemistry) return void sound.play('deny');
        this.chemistry = !this.chemistry;
        sound.play('click');
        announce(this.chemistry ? 'Chemistry overlay on.' : 'Chemistry overlay off.');
        break;
      case 'snap':
        this.snap();
        break;
    }
  }

  private pause(): void {
    if (this.ending) return;
    this.scene.pause();
    this.scene.launch('Pause', {
      returnTo: 'Play',
      returnData: this.data0,
      canFinish: this.session.duration === Infinity,
    });
  }

  /** Called from the pause menu in untimed modes. */
  finishNow(): void {
    this.session.end('objectives');
  }

  /** Keyboard accessibility: jump the reticle to the next signal (real or artefact) by x. */
  private snap(): void {
    const s = this.session;
    const points = [
      ...s.tracker.visible().filter((r) => s.inImaging(r.x)),
      ...s.distractors.items,
    ].sort((a, b) => a.x - b.x || a.y - b.y);
    if (points.length === 0) return void announce('No signals in view.');
    const next = points.find((p) => p.x > this.reticle.x + 1) ?? points[0]!;
    this.reticle.x = next.x;
    this.reticle.y = next.y;
    const v = s.readout(next.x, next.y);
    announce(`Signal at optode reading ${v.toFixed(0)} percent saturation.`);
  }

  // ------------------------------------------------------------------ actions

  private capture(): void {
    const c = this.challenge;
    if (c && c.phase === 'predict') return this.placePrediction();
    if (this.playback || (c && c.phase !== 'observe')) return;
    const { x, y } = this.reticle;
    const result = this.session.click(x, y);
    this.feedback(result, x, y);
  }

  private feedback(r: ClickResult, x: number, y: number): void {
    const s = this.session;
    switch (r.kind) {
      case 'observed': {
        const a = r.award;
        sound.play('capture', Math.min(12, (a.streak - 1) * 2));
        if (a.streak > 1) sound.play('combo', a.streak);
        this.rings.push({
          x: r.region.x,
          y: r.region.y,
          age: 0,
          life: 0.7,
          color: PALETTE.cream,
          max: 70,
        });
        this.rings.push({
          x: r.region.x,
          y: r.region.y,
          age: -0.1,
          life: 0.7,
          color: PALETTE.amber,
          max: 46,
        });
        this.markers.push({ x: r.region.x, y: r.region.y, n: s.stats.observations, age: 0 });
        const bonus = a.bonuses.map((b) => `${b.label} +${b.points}`).join('\n');
        const reading = `${r.region.strength.toFixed(0)}% O₂`;
        this.float(
          r.region.x,
          r.region.y - 20,
          `+${a.points}${a.streak > 1 ? `  ×${a.multiplier.toFixed(2)}` : ''}\n${reading}${bonus ? `\n${bonus}` : ''}`,
          PALETTE.textAmber,
        );
        if (!this.reduced) this.cameras.main.shake(60, 0.002);
        announce(
          `Documented ${REGION_LABEL[r.region.kind]}, ${reading} saturation. Plus ${a.points}. ` +
            (a.streak > 1 ? `Streak ${a.streak}. ` : '') +
            a.bonuses.map((b) => b.label.toLowerCase()).join(', '),
        );
        break;
      }
      case 'duplicate':
        sound.play('duplicate');
        this.float(x, y - 16, '✓ Already in the record\nwait for it to change', PALETTE.textDim);
        announce('Already documented. Wait for it to grow, move, or change.');
        break;
      case 'cooldown':
        break;
      case 'distractor':
        sound.play('miss');
        this.float(
          x,
          y - 16,
          `${DISTRACTOR_LABEL[r.distractor.kind]}\nO₂ ${s.readout(x, y).toFixed(0)}%`,
          PALETTE.textCoral,
        );
        announce(`${DISTRACTOR_LABEL[r.distractor.kind]}. Combo reset.`);
        break;
      case 'empty':
        sound.play('miss');
        this.float(x, y - 16, `No oxygen signal: ${r.reading.toFixed(1)}%`, PALETTE.textCoral);
        announce(`No oxygen signal here, ${r.reading.toFixed(0)} percent. Combo reset.`);
        break;
    }
  }

  private placeRoi(): void {
    const roi = this.session.placeRoi(this.reticle.x, this.reticle.y);
    this.roiArmed = false;
    if (!roi) return void sound.play('deny');
    sound.play('click');
    announce(`ROI ${roi.id} placed. It records the oxygen reading here every hour.`);
  }

  private startPlayback(): void {
    if (!this.cfg.features.timelapse || this.challenge) return void sound.play('deny');
    if (this.session.timelapse.length < 4) {
      sound.play('deny');
      return void this.flashBanner('Not enough images recorded yet.', 1.5);
    }
    this.playback = { t: 0 };
    sound.play('timelapse');
    announce('Time-lapse: replaying the last two days of oxygen images. The clock is paused.');
  }

  private placePrediction(): void {
    const c = this.challenge!;
    c.markers.push({ ...this.reticle });
    sound.play('click');
    if (c.markers.length >= PREDICTION_MARKERS) {
      c.phase = 'reveal';
      c.known = new Set(this.session.tracker.visible().map((r) => r.key));
      c.revealStart = this.session.simHour;
      sound.play('timelapse');
      this.flashBanner(`Fast-forwarding ${PREDICTION_HOURS} hours…`, 3);
      announce('Fast forwarding a day.');
    } else {
      announce(
        `Prediction ${c.markers.length} placed. ${PREDICTION_MARKERS - c.markers.length} to go.`,
      );
    }
  }

  // ------------------------------------------------------------------ loop

  override update(_time: number, deltaMs: number): void {
    const dt = Math.min(0.05, deltaMs / 1000);
    this.moveReticle(dt);
    this.pollPad();
    if (this.playback) return this.updatePlayback(dt);

    let speed = 1;
    const c = this.challenge;
    if (c) {
      if (c.phase === 'predict') return this.renderAll(dt, true);
      if (c.phase === 'reveal') speed = PREDICTION_HOURS / (this.cfg.hoursPerSecond * 3);
      if (c.phase === 'result') speed = 0;
    }
    if (speed > 0) {
      const steps = Math.ceil(speed);
      for (let i = 0; i < steps; i++) this.handle(this.session.update((dt * speed) / steps));
    }
    if (c) this.updateChallenge(dt);
    this.renderAll(dt);
  }

  private moveReticle(dt: number): void {
    let dx = 0;
    let dy = 0;
    for (const k of this.held) {
      const m = moveForKey(k);
      if (m) {
        dx += m.dx;
        dy += m.dy;
      }
    }
    const pad = this.input.gamepad?.pad1;
    if (pad) {
      if (Math.abs(pad.leftStick.x) > 0.2) dx += pad.leftStick.x;
      if (Math.abs(pad.leftStick.y) > 0.2) dy += pad.leftStick.y;
    }
    if (dx === 0 && dy === 0) return;
    this.reticle.x = Phaser.Math.Clamp(this.reticle.x + dx * 440 * dt, 10, WORLD.width - 10);
    this.reticle.y = Phaser.Math.Clamp(
      this.reticle.y + dy * 440 * dt,
      WORLD.soilTop + 4,
      TOOLBAR_TOP - 6,
    );
  }

  private pollPad(): void {
    const pad = this.input.gamepad?.pad1;
    if (!pad) return;
    const now: Record<string, boolean> = {
      A: pad.A,
      B: pad.B,
      X: pad.X,
      Y: pad.Y,
      start: pad.buttons[9]?.pressed ?? false,
    };
    const map: Record<string, InputAction> = {
      A: 'capture',
      X: 'scan',
      Y: 'view',
      B: 'snap',
      start: 'pause',
    };
    for (const k of Object.keys(map)) if (now[k] && !this.padPrev[k]) this.act(map[k]!);
    this.padPrev = now;
  }

  private handle(events: SessionEvent[]): void {
    for (const e of events) {
      switch (e.kind) {
        case 'emerge':
          if (e.plant.kind === 'adventitious') sound.play('emerge');
          else if (e.plant.kind === 'lateral') sound.play('lateral');
          else if (e.plant.kind === 'ramet')
            this.flashBanner('A new shoot rises from the rhizome apex.', 2.5);
          break;
        case 'lost':
          if (this.cfg.maxDataGaps > 0) {
            sound.play('deny');
            this.float(e.region.x, e.region.y, 'DATA GAP\nfaded undocumented', PALETTE.textCoral);
            announce('Data gap: a pool faded before you documented it.');
          }
          break;
        case 'roi':
          sound.play('roi');
          this.float(
            e.roi.x,
            e.roi.y - 20,
            `ROI ${e.roi.id}: OXYGEN CHANGE RECORDED\n+${ARCADE.roiBonus}`,
            PALETTE.textMint,
          );
          announce(`ROI ${e.roi.id} recorded an oxygen change.`);
          break;
        case 'dusk':
          sound.setNight(true);
          if (this.cfg.nightTwist) {
            sound.setQuiet(true);
            this.big('Lights out.\nNo sunlight. No photosynthesis.', 2.4);
          } else this.flashBanner('Night falls on the marsh.', 2);
          announce('Night. The marsh goes dark.');
          break;
        case 'dawn':
          sound.setNight(false);
          this.flashBanner('Sunrise. Leaves are photosynthesizing again.', 2);
          announce('Sunrise.');
          break;
        case 'twist':
          sound.play('twist');
          this.big('It’s nighttime.\nSo why is there still oxygen down here?', 4.5);
          this.quietUntil = this.session.gameSec + 4.5;
          announce('It is nighttime. So why is there still oxygen down here?');
          break;
        case 'tip':
          this.flashBanner(e.text, 5);
          announce(e.text);
          break;
        case 'objectives':
          sound.play('win');
          this.flashBanner(
            this.session.duration === Infinity
              ? 'All objectives met! Wrapping up…'
              : 'All objectives met! Keep going for a higher score.',
            3,
          );
          announce('All objectives met.');
          break;
        case 'end':
          this.finish();
          break;
      }
    }
    if (this.quietUntil > 0 && this.session.gameSec > this.quietUntil) {
      this.quietUntil = -1;
      sound.setQuiet(false);
    }
  }

  private updatePlayback(dt: number): void {
    const pb = this.playback!;
    pb.t += dt / ARCADE.timelapsePlaySec;
    if (pb.t >= 1) {
      this.playback = null;
      announce('Back to live imaging.');
      return this.renderAll(dt);
    }
    const frame = this.session.timelapse.at(pb.t)!;
    this.heat.draw(
      progress().colormap,
      this.view === 'natural' ? 'combined' : this.view,
      this.session.imaging,
      (i) => snapshotValue(frame.field, i),
    );
    this.roots.draw(
      this.session.plant,
      frame.simHour,
      this.view === 'imaging' ? 0.3 : 0.95,
      frame.simHour,
    );
    this.above.draw(
      dt,
      this.session.light,
      this.session.plant.ramets.filter((r) => r.bornAt <= frame.simHour),
      frame.simHour,
    );
    this.hudStatus.setText(
      `◀◀ TIME-LAPSE  ${clockLabel(frame.simHour)}  (${Math.round(pb.t * 100)}%)`,
    );
    this.distractorG.clear();
    this.markerG.clear();
    this.overlay.clear();
    this.reticleG.clear();
    this.readoutText.setVisible(false);
  }

  private updateChallenge(dt: number): void {
    const c = this.challenge!;
    const s = this.session;
    if (c.phase === 'observe' && s.gameSec >= c.until) {
      c.phase = 'predict';
      c.markers = [];
      this.flashBanner(
        `Round ${c.round}/${PREDICTION_ROUNDS}: where will NEW oxygen pools appear in the next ${PREDICTION_HOURS} hours? Place ${PREDICTION_MARKERS} markers.`,
        60,
      );
      announce(
        `Round ${c.round}. Predict where new oxygen pools will appear. Place ${PREDICTION_MARKERS} markers.`,
      );
    } else if (c.phase === 'reveal' && s.simHour - c.revealStart >= PREDICTION_HOURS) {
      const appeared = s.tracker
        .visible()
        .filter((r) => !c.known.has(r.key) || r.firstSeenSim > c.revealStart);
      const result = scorePredictions(c.markers, appeared);
      c.lines = result.details.map((d) => {
        const m = c.markers[d.marker]!;
        let best = appeared[0];
        for (const a of appeared)
          if (best && Math.hypot(a.x - m.x, a.y - m.y) < Math.hypot(best.x - m.x, best.y - m.y))
            best = a;
        return { x1: m.x, y1: m.y, x2: best?.x ?? m.x, y2: best?.y ?? m.y, pts: d.points };
      });
      c.total += result.points;
      s.stats.predictions += result.hits;
      s.scorer.bonus(result.points);
      c.phase = 'result';
      sound.play(result.hits > 0 ? 'win' : 'fail');
      const msg = `${appeared.length} new pool${appeared.length === 1 ? '' : 's'} appeared. Your predictions: +${result.points} (${result.hits} hit${result.hits === 1 ? '' : 's'}).`;
      this.flashBanner(msg, 3.2);
      announce(msg);
      this.resultTimer = 3.2;
    } else if (c.phase === 'result') {
      this.resultTimer -= dt;
      if (this.resultTimer <= 0) {
        if (c.round >= PREDICTION_ROUNDS) return void s.end('time');
        c.round++;
        c.lines = [];
        c.phase = 'observe';
        c.until = s.gameSec + 6;
        this.flashBanner('Watch the roots…', 2);
      }
    }
  }

  private resultTimer = 0;

  private finish(): void {
    if (this.ending) return;
    this.ending = true;
    const s = this.session;
    this.time.delayedCall(900, () => {
      this.scene.start('Results', {
        play: this.data0,
        id: this.cfg.id,
        title: this.cfg.title,
        stats: { ...s.stats, byOrgan: { ...s.stats.byOrgan } },
        accuracy: s.accuracy(),
        objectives: s
          .objectiveStatus()
          .map((o) => ({ label: o.label, done: o.done, value: o.value, n: o.objective.n })),
        targetScore: this.cfg.targetScore,
        endReason: s.endReason,
        gameSec: s.gameSec,
      });
    });
  }

  // ------------------------------------------------------------------ rendering

  private renderAll(dt: number, frozen = false): void {
    const s = this.session;
    const p = progress();
    this.above.draw(frozen ? 0 : dt, s.light, s.plant.ramets, s.simHour);
    this.renderTimer -= dt;
    if (this.renderTimer <= 0 || frozen) {
      this.renderTimer = 1 / 20;
      this.heat.draw(p.colormap, this.view, s.imaging);
      this.roots.draw(s.plant, s.simHour, this.view === 'imaging' ? 0.28 : 1);
    }
    drawDistractors(this.distractorG, s.distractors.items, s.gameSec, this.view);
    this.drawOverlay();
    this.drawMarkers(dt);
    this.drawFx(dt);
    this.drawReticle();
    this.updateHud();
  }

  private drawOverlay(): void {
    const g = this.overlay;
    const s = this.session;
    g.clear();
    // Unimaged sediment (Level 4): a hatched mask beyond the optode window.
    if (s.imaging.right < WORLD.width) {
      g.fillStyle(PALETTE.ink, 0.55);
      g.fillRect(
        s.imaging.right,
        WORLD.soilTop,
        WORLD.width - s.imaging.right,
        TOOLBAR_TOP - WORLD.soilTop,
      );
      g.lineStyle(2, PALETTE.cyan, 0.8);
      g.lineBetween(s.imaging.right, WORLD.soilTop, s.imaging.right, TOOLBAR_TOP);
    }
    // Chemistry overlay: shape-coded microsite glyphs on a fixed lattice.
    this.chemText.setVisible(this.chemistry);
    if (this.chemistry) {
      for (let y = WORLD.soilTop + 40; y < TOOLBAR_TOP - 20; y += 44) {
        for (let x = 30 + ((y / 44) % 2) * 22; x < WORLD.width - 10; x += 44) {
          if (!s.inImaging(x)) continue;
          const v = s.field.sample(x, y);
          if (v > 2) {
            g.lineStyle(1.5, PALETTE.mint, 0.85);
            g.strokeCircle(x, y, 5);
            g.fillStyle(PALETTE.mint, 0.85);
            g.fillCircle(x, y, 1.6);
          } else {
            g.fillStyle(PALETTE.amber, 0.28);
            g.fillRect(x - 2.5, y - 2.5, 5, 5);
          }
        }
      }
    }
    // Region outlines (colour-independent signal indicator) and scan highlights.
    const outlines = progress().outlines && this.view !== 'natural';
    for (const r of s.tracker.visible()) {
      if (!s.inImaging(r.x)) continue;
      const obs = observability(r, s.simHour, s.gameSec);
      if (outlines) {
        g.lineStyle(1.5, PALETTE.cream, 0.45);
        this.dashedCircle(
          g,
          r.x,
          r.y,
          Math.max(18, r.radius * 0.8),
          s.gameSec * (this.reduced ? 0 : 0.6),
        );
      }
      if (r.docCount > 0 && !isObservable(obs)) {
        g.fillStyle(PALETTE.ink, 0.85);
        g.fillCircle(r.x, r.y, 9);
        g.lineStyle(2.5, PALETTE.mint, 1);
        g.beginPath();
        g.moveTo(r.x - 4.5, r.y);
        g.lineTo(r.x - 1, r.y + 4);
        g.lineTo(r.x + 5, r.y - 4);
        g.strokePath();
      }
      if (s.scanning && isObservable(obs)) {
        const pulse = 1 + 0.15 * Math.sin(s.gameSec * 12);
        g.lineStyle(3, PALETTE.amber, 0.95);
        g.strokeCircle(r.x, r.y, 26 * pulse);
        g.fillStyle(PALETTE.amber, 0.95);
        g.fillTriangle(r.x, r.y - 38 * pulse, r.x - 6, r.y - 48 * pulse, r.x + 6, r.y - 48 * pulse);
      }
    }
    // ROIs and their sparklines.
    this.roiTexts.forEach((t) => t.destroy());
    this.roiTexts = [];
    for (const roi of s.rois.rois) {
      g.lineStyle(2, roi.eventRecorded ? PALETTE.amber : PALETTE.cream, 1);
      g.strokeRect(roi.x - 12, roi.y - 12, 24, 24);
      const sx = roi.x + 18;
      const sy = roi.y - 28;
      g.fillStyle(PALETTE.ink, 0.8);
      g.fillRect(sx, sy, 92, 36);
      g.lineStyle(1.5, PALETTE.cyan, 1);
      const series = roi.series.slice(-46);
      g.beginPath();
      series.forEach((pt, i) => {
        const px = sx + 2 + i * 2;
        const py = sy + 34 - (Math.min(LEGEND_MAX, pt.value) / LEGEND_MAX) * 32;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      });
      g.strokePath();
      const label = `ROI ${roi.id}${roi.eventRecorded ? ' ✓' : ''}  Δ${roiRange(roi).toFixed(0)}%`;
      this.roiTexts.push(
        this.add
          .text(sx, sy + 38, label, { ...TEXT_STYLES.hint, fontSize: '12px', color: PALETTE.text })
          .setDepth(11),
      );
    }
    // Time-Lapse Challenge markers.
    const c = this.challenge;
    if (c) {
      for (const m of c.markers) {
        g.lineStyle(3, PALETTE.amber, 1);
        g.strokeCircle(m.x, m.y, 14);
        g.lineBetween(m.x - 20, m.y, m.x + 20, m.y);
        g.lineBetween(m.x, m.y - 20, m.x, m.y + 20);
      }
      for (const l of c.lines) {
        g.lineStyle(2, l.pts > 0 ? PALETTE.mint : PALETTE.coral, 0.9);
        g.lineBetween(l.x1, l.y1, l.x2, l.y2);
      }
    }
  }

  private dashedCircle(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    r: number,
    phase: number,
  ): void {
    const n = 14;
    for (let i = 0; i < n; i++) {
      const a0 = phase + (i / n) * Math.PI * 2;
      const a1 = a0 + (Math.PI * 2) / n / 2;
      g.beginPath();
      g.arc(x, y, r, a0, a1);
      g.strokePath();
    }
  }

  private drawMarkers(dt: number): void {
    const g = this.markerG;
    g.clear();
    for (const m of this.markers) m.age += dt;
    this.markers = this.markers.filter((m) => m.age < 5);
    for (const m of this.markers) {
      const a = Math.min(1, (5 - m.age) / 1.5);
      g.lineStyle(2, PALETTE.amber, a);
      g.lineBetween(m.x + 10, m.y - 10, m.x + 10, m.y - 34);
      g.fillStyle(PALETTE.amber, a);
      g.fillTriangle(m.x + 10, m.y - 34, m.x + 26, m.y - 29, m.x + 10, m.y - 24);
    }
  }

  private drawFx(dt: number): void {
    const g = this.fxG;
    g.clear();
    for (const r of this.rings) r.age += dt;
    this.rings = this.rings.filter((r) => r.age < r.life);
    for (const r of this.rings) {
      if (r.age < 0) continue;
      const t = r.age / r.life;
      const rad = this.reduced ? r.max * 0.6 : 8 + (r.max - 8) * Phaser.Math.Easing.Cubic.Out(t);
      g.lineStyle(this.reduced ? 2 : 4 * (1 - t) + 1, r.color, 1 - t);
      g.strokeCircle(r.x, r.y, rad);
    }
    for (const f of this.floaters) {
      f.life -= dt;
      if (!this.reduced) f.text.y -= dt * 26;
      f.text.setAlpha(Math.min(1, f.life / 0.5));
    }
    this.floaters = this.floaters.filter((f) => {
      if (f.life > 0) return true;
      f.text.destroy();
      return false;
    });
    // Shutter flash: brief corner brackets after a capture.
    const last = this.rings.find((r) => r.color === PALETTE.cream && r.age < 0.15);
    if (last) {
      g.lineStyle(3, PALETTE.cream, 1 - last.age / 0.15);
      const s = 40;
      for (const [sx, sy] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ] as const) {
        g.lineBetween(last.x + sx * s, last.y + sy * s, last.x + sx * (s - 14), last.y + sy * s);
        g.lineBetween(last.x + sx * s, last.y + sy * s, last.x + sx * s, last.y + sy * (s - 14));
      }
    }
  }

  private drawReticle(): void {
    const g = this.reticleG;
    const s = this.session;
    g.clear();
    const { x, y } = this.reticle;
    const c = this.challenge;
    const region: Region | null = s.tracker.hit(x, y, s.settings.hitRadius, s.field);
    const locked = region && s.inImaging(region.x);
    const col =
      this.roiArmed || c?.phase === 'predict'
        ? PALETTE.cyan
        : locked
          ? PALETTE.amber
          : PALETTE.cream;
    g.lineStyle(2, col, 0.95);
    g.strokeCircle(x, y, 24);
    g.lineBetween(x - 34, y, x - 14, y);
    g.lineBetween(x + 14, y, x + 34, y);
    g.lineBetween(x, y - 34, x, y - 14);
    g.lineBetween(x, y + 14, x, y + 34);
    g.fillStyle(col, 1);
    g.fillCircle(x, y, 2);
    if (this.roiArmed) {
      g.strokeRect(x - 12, y - 12, 24, 24);
    }
    const v = s.readout(x, y);
    let label = `O₂ ${v.toFixed(v < 10 ? 1 : 0)}% sat.`;
    if (locked && region) {
      const obs = observability(region, s.simHour, s.gameSec);
      const status =
        obs === 'documented' || obs === 'cooldown'
          ? '✓ in record'
          : obs === 'new'
            ? 'undocumented'
            : obs === 'moved'
              ? 'moved since documented'
              : obs === 'changed'
                ? 'changed since documented'
                : 'new day: re-measure';
      label += `\n${REGION_LABEL[region.kind]} · ${status}`;
    }
    this.readoutText.setVisible(true).setText(label);
    const tx =
      x + 30 + this.readoutText.width > WORLD.width ? x - 30 - this.readoutText.width : x + 30;
    this.readoutText.setPosition(tx, Math.min(TOOLBAR_TOP - 50, y + 22));
  }

  private updateHud(): void {
    const s = this.session;
    this.hudScore.setText(s.stats.score.toLocaleString('en-US'));
    this.hudCombo.setText(s.stats.streak > 1 ? `STREAK ×${s.stats.streak}` : '');
    const night = s.night;
    this.hudClock.setText(
      s.cfg.dayNight
        ? `${night ? '☾ NIGHT' : '☀ DAY'} · ${clockLabel(s.simHour)}`
        : `☀ LIGHTS ALWAYS ON · elapsed ${elapsedLabel(s.simHour - s.cfg.startHour)}`,
    );
    if (s.duration === Infinity) {
      const gaps = s.cfg.maxDataGaps;
      this.hudTimer.setText(
        gaps > 0 ? `DATA GAPS ${s.stats.lostEvents}/${gaps}` : `${Math.floor(s.gameSec)}s`,
      );
    } else {
      const rem = Math.ceil(s.remaining);
      this.hudTimer.setText(`${rem}s`).setColor(rem <= 10 ? PALETTE.textCoral : PALETTE.text);
      if (rem <= 5 && rem !== this.lastSecond && rem > 0) sound.play('tick');
      this.lastSecond = rem;
    }
    const obj = s.objectiveStatus();
    const c = this.challenge;
    const lines = c
      ? [`ROUND ${c.round}/${PREDICTION_ROUNDS}`, `Prediction points: ${c.total}`]
      : obj.map(
          (o) =>
            `${o.done ? '✓' : '○'} ${o.label} (${Math.min(o.value, o.objective.n)}/${o.objective.n})`,
        );
    if (lines.length === 0) lines.push(`Observations: ${s.stats.observations}`);
    this.hudObjectives.setText(lines.join('\n'));
    const scanState = this.cfg.features.scan
      ? s.gameSec >= s.scanReadyAt
        ? 'SCAN READY'
        : `scan ${Math.ceil(s.scanReadyAt - s.gameSec)}s`
      : '';
    const thr = this.cfg.features.threshold ? `threshold ${s.threshold}%` : '';
    this.hudStatus.setText(
      [VIEW_LABEL[this.view].toLowerCase(), thr, scanState].filter(Boolean).join(' · '),
    );
    this.buttons.scan?.setEnabled(s.gameSec >= s.scanReadyAt);
    this.buttons.roi?.setFocus(this.roiArmed);
    this.buttons.chemistry?.setFocus(this.chemistry);
    // Banner and big text timers.
    const now = this.time.now / 1000;
    this.banner.setVisible(now < this.bannerUntil);
    this.bigText.setVisible(now < this.bigUntil);
    if (!this.reduced && this.bigText.visible) this.bigText.setScale(1 + 0.01 * Math.sin(now * 3));
    // Music follows root activity.
    const growing = s.plant.segments.filter((g) => g.growing && g.organ !== 'lateral').length;
    sound.setIntensity(0.2 + growing / 8 + Math.min(0.3, s.stats.streak / 20));
  }

  private float(x: number, y: number, text: string, color: string): void {
    const t = this.add
      .text(x, y, text, {
        ...TEXT_STYLES.label,
        fontSize: '16px',
        color,
        align: 'center',
        stroke: '#14110e',
        strokeThickness: 4,
      })
      .setOrigin(0.5, 1)
      .setDepth(15);
    this.floaters.push({ text: t, life: 1.4 });
  }

  private flashBanner(text: string, sec: number): void {
    this.banner.setText(text);
    this.bannerUntil = this.time.now / 1000 + sec;
  }

  private big(text: string, sec: number): void {
    this.bigText.setText(text);
    this.bigUntil = this.time.now / 1000 + sec;
  }
}
