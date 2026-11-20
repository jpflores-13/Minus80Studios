import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress, view } from '../config/progress';
import { TUNING } from '../config/tuning';
import { buildingName, SCIENCE_TIPS, term, type View } from '../content/terms';
import { getLevel } from '../levels';
import type { LevelConfig, PolicyOption } from '../levels/types';
import { RoadView, type Parcel } from '../render/RoadView';
import { isOpen, isRunning, links } from '../systems/city';
import type { Checkpoint } from '../systems/extrusion';
import {
  checkpoint,
  DEFAULT_POLICY,
  isFinished,
  policyCost,
  startRun,
  stepRun,
  type Layout,
  type PolicyChoice,
  type Run,
} from '../systems/run';
import { formatValue, scoreRun } from '../systems/score';
import { announce } from '../ui/announce';
import { Button } from '../ui/Button';
import { SCI } from '../ui/scienceArt';
import { TEXT_STYLES } from '../ui/text';

type Phase = 'brief' | 'plan' | 'run';
type Tool = 'depot' | 'checkpoint';
type Dial = 'lifetime' | 'loading' | 'fleet';

export interface LevelSceneData {
  levelId: string;
  layout?: Layout;
  skipBrief?: boolean;
  /** Dev only: start running straight away and skip ahead this many seconds. */
  warm?: number;
}

const X0 = 70;
const X1 = 1210;
const ROAD_Y = 470;
const BAR_Y = 668;

// One level: read the briefing, plan the layout, then watch a minute of the city.
export class LevelScene extends Phaser.Scene {
  private level!: LevelConfig;
  private v: View = 'city';
  private road!: RoadView;
  private layout: Layout = { depots: [], checkpoints: [] };
  private history: Layout[] = [];
  private phase: Phase = 'brief';
  private tool: Tool = 'depot';
  private cursor = 0;
  private run: Run | null = null;
  private acc = 0;
  private fast = false;
  private paused = false;
  private parcels: Parcel[] = [];
  private flashes = new Map<string, number>();
  private wasRunning = new Map<string, boolean>();
  private weather!: Phaser.GameObjects.Rectangle;
  private weatherBanner!: Phaser.GameObjects.Text;

  private statusText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private toolButtons: Partial<Record<Tool, Button>> = {};
  private dialButtons: Partial<Record<Dial, Button>> = {};
  private budgetText: Phaser.GameObjects.Text | null = null;
  private planButtons: Button[] = [];
  private runButtons: Button[] = [];
  private runButton!: Button;
  private fastButton!: Button;
  private pauseButton!: Button;
  private brief: Phaser.GameObjects.GameObject[] = [];
  private briefPage = 0;
  private picker: Button[] = [];

  constructor() {
    super('Level');
  }

  create(data: LevelSceneData): void {
    this.level = getLevel(data.levelId);
    this.v = view();
    const start = data.layout ?? this.level.startLayout ?? { depots: [], checkpoints: [] };
    this.layout = cloneLayout(start);
    if (this.level.policies) this.layout.policy ??= { ...DEFAULT_POLICY };
    this.history = [];
    this.phase = 'plan';
    this.tool = this.level.tools.depots > 0 ? 'depot' : 'checkpoint';
    this.cursor = Math.floor(this.level.bins / 2);
    this.run = null;
    this.acc = 0;
    this.fast = false;
    this.paused = false;
    this.parcels = [];
    this.flashes = new Map();
    this.wasRunning = new Map();
    this.toolButtons = {};
    this.dialButtons = {};
    this.budgetText = null;
    this.planButtons = [];
    this.runButtons = [];
    this.picker = [];

    const science = this.v === 'science';
    this.cameras.main.setBackgroundColor(science ? SCI.bg : PALETTE.sky);
    this.road = new RoadView(this, this.level, this.v, {
      x0: X0,
      x1: X1,
      roadY: ROAD_Y,
      maxRise: 300,
      top: 120,
      bottom: 620,
    });
    this.road.root.setDepth(5);
    const { width, height } = this.scale;
    this.weather = this.add
      .rectangle(0, 0, width, height, PALETTE.heat, 0)
      .setOrigin(0)
      .setDepth(7);
    this.weatherBanner = this.add
      .text(width / 2, 150, '', {
        ...TEXT_STYLES.body,
        fontStyle: 'bold',
        color: '#7a3a10',
        backgroundColor: '#fde3c8',
        padding: { x: 14, y: 6 },
      })
      .setOrigin(0.5)
      .setDepth(25)
      .setVisible(false);
    this.buildHud();
    this.buildInput();
    this.refresh();

    if (data.warm) {
      this.startRunning();
      for (let t = 0; t < data.warm && this.run; t += TUNING.step) stepRun(this.run, TUNING.step);
      this.refresh();
    } else if (data.skipBrief) {
      announce(`${this.level.name}. Planning. ${this.level.hint}`);
    } else {
      this.openBrief();
    }
  }

  private t(key: Parameters<typeof term>[0]): string {
    return term(key, this.v);
  }

  // ---------- HUD ----------

  private buildHud(): void {
    const { width } = this.scale;
    const lv = this.level;
    const science = this.v === 'science';
    const ink = science ? SCI.text : PALETTE.text;
    this.add
      .rectangle(0, 0, width, 104, science ? SCI.panel : PALETTE.cream)
      .setOrigin(0)
      .setDepth(20);
    this.add
      .text(24, 14, `${lv.number} · ${lv.name}`, {
        ...TEXT_STYLES.title,
        fontSize: '32px',
        color: ink,
      })
      .setDepth(21);
    this.add
      .text(24, 52, this.goalLine(), {
        ...TEXT_STYLES.small,
        fontSize: '15px',
        color: ink,
        wordWrap: { width: 800 },
      })
      .setDepth(21);
    this.timeText = this.add
      .text(width - 24, 14, '', { ...TEXT_STYLES.title, fontSize: '32px', color: ink })
      .setOrigin(1, 0)
      .setDepth(21);
    this.statusText = this.add
      .text(width - 24, 60, '', {
        ...TEXT_STYLES.small,
        fontSize: '17px',
        align: 'right',
        color: ink,
      })
      .setOrigin(1, 0)
      .setDepth(21);

    this.hintText = this.add
      .text(width / 2, 630, '', {
        ...TEXT_STYLES.small,
        fontSize: '16px',
        align: 'center',
        wordWrap: { width: 1180 },
        color: ink,
      })
      .setOrigin(0.5)
      .setDepth(21);

    this.add
      .rectangle(0, BAR_Y - 22, width, 74, science ? SCI.panel : PALETTE.creamDark)
      .setOrigin(0)
      .setDepth(20);

    const y = BAR_Y + 14;
    let x = 20;
    const addPlan = (w: number, label: string, fn: () => void, color?: number): Button => {
      const b = new Button(this, x + w / 2, y, w, 46, label, fn, color);
      x += w + 10;
      this.planButtons.push(b);
      return b;
    };
    if (lv.tools.depots > 0)
      this.toolButtons.depot = addPlan(180, '', () => this.selectTool('depot'));
    if (lv.tools.checkpoints > 0)
      this.toolButtons.checkpoint = addPlan(230, '', () => this.selectTool('checkpoint'));
    if (lv.policies) {
      for (const d of ['lifetime', 'loading', 'fleet'] as const)
        this.dialButtons[d] = addPlan(215, '', () => this.cycleDial(d));
      for (const b of Object.values(this.dialButtons)) b.label.setFontSize(14);
      this.budgetText = this.add
        .text(x + 4, y, '', { ...TEXT_STYLES.small, fontSize: '16px', color: ink })
        .setOrigin(0, 0.5)
        .setDepth(21);
      x += 110;
    } else {
      addPlan(100, 'UNDO', () => this.undo());
      addPlan(100, 'RESET', () => this.resetLayout());
    }
    x = width - 470;
    addPlan(100, 'MENU', () => this.toMenu());
    addPlan(100, 'HELP', () => this.openBrief());
    this.runButton = new Button(
      this,
      width - 130,
      y,
      220,
      46,
      'RUN ▶  (R)',
      () => this.startRunning(),
      PALETTE.goldDark,
    );
    this.planButtons.push(this.runButton);

    this.fastButton = new Button(this, width - 590, y, 150, 46, '', () => this.toggleFast());
    this.pauseButton = new Button(this, width - 430, y, 150, 46, '', () => this.togglePause());
    const stop = new Button(this, width - 130, y, 220, 46, 'STOP & EDIT (S)', () =>
      this.stopRunning(),
    );
    this.runButtons = [this.fastButton, this.pauseButton, stop];
  }

  private goalLine(): string {
    const lv = this.level;
    const g = lv.goal;
    const stars = (f: (x: number) => string) =>
      `★ ${f(g.one)}   ★★ ${f(g.two)}   ★★★ ${f(g.three)}`;
    if (g.metric === 'deliveries') return `Goal: deliveries in one minute   ${stars(String)}`;
    const who = lv.buildings
      .filter((b) => b.role === 'consumer' && b.active)
      .map((b) => buildingName(b, this.v))
      .join(', ');
    const extras = [
      g.maxMixups !== undefined ? `${this.t('mixups')} under ${pct(g.maxMixups)}` : '',
      g.maxWrong !== undefined ? `${this.t('wrong')} under ${pct(g.maxWrong)}` : '',
      g.minEach !== undefined ? `each at least ${pct(g.minEach)}` : '',
    ].filter(Boolean);
    return `Keep running: ${who}   ${stars(pct)}${extras.length ? `   ·   ${extras.join(' · ')}` : ''}`;
  }

  private refresh(): void {
    const lv = this.level;
    const planning = this.phase !== 'run';
    this.toolButtons.depot?.setText(
      `${this.tool === 'depot' ? '▸ ' : ''}${this.t('depot').toUpperCase()} (1)  ${lv.tools.depots - this.layout.depots.length} left`,
    );
    this.toolButtons.checkpoint?.setText(
      `${this.tool === 'checkpoint' ? '▸ ' : ''}${this.t('checkpoint').toUpperCase()} (2)  ${lv.tools.checkpoints - this.layout.checkpoints.length} left`,
    );
    if (lv.policies) {
      const c = this.layout.policy ?? DEFAULT_POLICY;
      const label = (name: string, o: PolicyOption | undefined, key: string) =>
        `${name.toUpperCase()} (${key})\n${o?.label ?? ''} · cost ${o?.cost ?? 0}`;
      this.dialButtons.lifetime?.setText(
        label(this.t('maintenance'), lv.policies.lifetime[c.lifetime], '3'),
      );
      this.dialButtons.loading?.setText(
        label(this.t('depotSpeed'), lv.policies.loading[c.loading], '4'),
      );
      this.dialButtons.fleet?.setText(label(this.t('fleet'), lv.policies.fleet[c.fleet], '5'));
      const spent = policyCost(lv, c);
      this.budgetText?.setText(
        `Budget\n${spent} of ${lv.policies.budget}${spent > lv.policies.budget ? '  over!' : ''}`,
      );
    }
    for (const b of this.planButtons) b.setVisible(planning);
    for (const b of this.runButtons) b.setVisible(!planning);
    this.budgetText?.setVisible(planning);
    this.fastButton.setText(this.fast ? 'NORMAL (F)' : 'FAST ⏩ (F)');
    this.pauseButton.setText(this.paused ? 'GO (P)' : 'PAUSE (P)');
    this.runButton.setEnabled(this.canRun());

    if (planning) {
      this.timeText.setText(`${lv.durationSeconds}s`);
      this.statusText.setText(
        lv.weather ? `Forecast: ${lv.weather.name} at ${lv.weather.at}s` : 'Planning',
      );
      this.hintText.setText(
        this.v === 'science'
          ? this.scienceTip(this.cursor)
          : `${lv.hint}   ·   ← → move · ENTER place · U undo · R run`,
      );
    } else if (this.run) {
      const left = Math.max(0, lv.durationSeconds - this.run.engine.time);
      this.timeText.setText(`${Math.ceil(left)}s`);
      const score = scoreRun(lv, this.run.city);
      const parts = [formatValue(lv, score.value)];
      if (lv.goal.maxMixups !== undefined) parts.push(`${this.t('mixups')} ${pct(score.mixups)}`);
      if (lv.goal.maxWrong !== undefined) parts.push(`${this.t('wrong')} ${pct(score.wrong)}`);
      this.statusText.setText(parts.join('   '));
      this.hintText.setText(
        this.paused
          ? 'Paused. Press P or GO to carry on.'
          : this.v === 'science'
            ? 'Loops form as cohesin extrudes. Matching enhancer–gene contacts make expression likely, not certain.'
            : 'Golden arches are shortcuts. When one joins a supplier to the right customer, deliveries can cross.',
      );
    }
    this.redraw();
  }

  private redraw(): void {
    this.road.draw({
      layout: this.layout,
      run: this.run,
      cityParams: this.run?.cityParams ?? TUNING.city,
      cursor: this.phase === 'plan' ? this.cursor : null,
      parcels: this.parcels,
      flashes: this.flashes,
    });
  }

  // ---------- input ----------

  private buildInput(): void {
    // The whole city is the tap target, so only left-right position matters.
    const zone = this.add
      .zone(X0, 110, X1 - X0, 505)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true })
      .setDepth(15);
    zone.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.phase !== 'plan' || p.wasTouch) return;
      const bin = this.road.binAt(p.worldX);
      if (bin !== this.cursor) {
        this.cursor = bin;
        if (this.v === 'science') this.hintText.setText(this.scienceTip(bin));
        this.redraw();
      }
    });
    zone.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (this.phase !== 'plan') return;
      this.cursor = this.road.binAt(p.worldX);
      // Touch: pick the spot first, with big buttons to nudge and confirm. Mouse acts at once.
      if (p.wasTouch) this.openPicker();
      else this.actAt(this.cursor);
    });

    const kb = this.input.keyboard;
    kb?.on('keydown', (e: KeyboardEvent) => this.onKey(e));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => kb?.removeAllListeners());
  }

  private onKey(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    if (this.phase === 'brief') {
      if (key === 'enter' || key === ' ' || key === 'arrowright') this.nextBriefPage();
      else if (key === 'escape') this.closeBrief();
      return;
    }
    if (key === 'm') {
      sound.toggleMute();
      announce(progress().muted ? 'Sound off' : 'Sound on');
      return;
    }
    if (this.phase === 'plan') {
      if (key === 'arrowleft') this.moveCursor(-1, e.shiftKey ? 5 : 1);
      else if (key === 'arrowright') this.moveCursor(1, e.shiftKey ? 5 : 1);
      else if (key === 'home') this.moveCursor(-1, this.level.bins);
      else if (key === 'end') this.moveCursor(1, this.level.bins);
      else if (key === 'enter' || key === ' ') this.actAt(this.cursor);
      else if (key === 'delete' || key === 'backspace') this.removeAt(this.cursor);
      else if (key === '1') this.selectTool('depot');
      else if (key === '2') this.selectTool('checkpoint');
      else if (key === '3') this.cycleDial('lifetime');
      else if (key === '4') this.cycleDial('loading');
      else if (key === '5') this.cycleDial('fleet');
      else if (key === 'u' || (key === 'z' && (e.ctrlKey || e.metaKey))) this.undo();
      else if (key === 'r') this.startRunning();
      else if (key === 'h') this.openBrief();
      else if (key === 'escape') this.toMenu();
      else return;
      e.preventDefault();
    } else if (this.phase === 'run') {
      if (key === 'f') this.toggleFast();
      else if (key === 'p' || key === ' ') this.togglePause();
      else if (key === 's' || key === 'escape') this.stopRunning();
    }
  }

  private moveCursor(dir: -1 | 1, steps: number): void {
    this.cursor = Phaser.Math.Clamp(this.cursor + dir * steps, 0, this.level.bins - 1);
    this.refresh();
    announce(this.describe(this.cursor));
  }

  private selectTool(tool: Tool): void {
    const available = tool === 'depot' ? this.level.tools.depots : this.level.tools.checkpoints;
    if (available === 0 || this.phase !== 'plan') return;
    this.tool = tool;
    sound.unlock();
    sound.play('click');
    this.refresh();
    announce(
      tool === 'depot'
        ? `${this.t('depot')} selected. ${this.t('machines')} start here.`
        : `${this.t('checkpoint')} selected. It stops ends coming from the side its arrow points at.`,
    );
  }

  private cycleDial(dial: Dial): void {
    const pol = this.level.policies;
    if (!pol || this.phase !== 'plan') return;
    this.remember();
    const c: PolicyChoice = { ...(this.layout.policy ?? DEFAULT_POLICY) };
    c[dial] = (c[dial] + 1) % pol[dial].length;
    this.layout.policy = c;
    sound.unlock();
    sound.play('turn');
    this.refresh();
    const o = pol[dial][c[dial]];
    announce(
      `${o?.label ?? ''}, costs ${o?.cost ?? 0}. Budget used ${policyCost(this.level, c)} of ${pol.budget}.`,
    );
  }

  // ---------- planning ----------

  private remember(): void {
    this.history.push(cloneLayout(this.layout));
    if (this.history.length > 50) this.history.shift();
  }

  private undo(): void {
    const prev = this.history.pop();
    if (!prev) return this.deny('Nothing to undo.');
    this.layout = prev;
    sound.play('remove');
    this.refresh();
    announce('Undone.');
  }

  private resetLayout(): void {
    this.remember();
    this.layout = cloneLayout(this.level.startLayout ?? { depots: [], checkpoints: [] });
    if (this.level.policies) this.layout.policy = { ...DEFAULT_POLICY };
    sound.play('remove');
    this.refresh();
    announce('Plan reset. U undoes this.');
  }

  private fixedCheckpointAt(bin: number): Checkpoint | undefined {
    return this.level.fixedCheckpoints.find((c) => c.bin === bin);
  }

  private actAt(bin: number): void {
    sound.unlock();
    if (this.level.fixedDepots.includes(bin) || this.fixedCheckpointAt(bin)) {
      sound.play('deny');
      announce('That one is part of the city and can’t be changed.');
      return;
    }
    const cp = this.layout.checkpoints.find((c) => c.bin === bin);
    if (cp) {
      this.remember();
      if (cp.facing === 1) {
        cp.facing = -1;
        sound.play('turn');
      } else {
        this.layout.checkpoints = this.layout.checkpoints.filter((c) => c !== cp);
        sound.play('remove');
      }
      this.afterEdit(bin);
      return;
    }
    if (this.layout.depots.includes(bin)) {
      this.remember();
      this.layout.depots = this.layout.depots.filter((d) => d !== bin);
      sound.play('remove');
      this.afterEdit(bin);
      return;
    }
    this.place(bin);
  }

  private place(bin: number): void {
    const lv = this.level;
    const depotsLeft = lv.tools.depots - this.layout.depots.length;
    const checkpointsLeft = lv.tools.checkpoints - this.layout.checkpoints.length;
    let tool = this.tool;
    if (tool === 'depot' && depotsLeft === 0 && checkpointsLeft > 0) tool = 'checkpoint';
    if (tool === 'checkpoint' && checkpointsLeft === 0 && depotsLeft > 0) tool = 'depot';

    if (tool === 'depot') {
      if (lv.tools.depots === 0) return this.deny(`No ${this.t('depot')}s to place in this level.`);
      this.remember();
      if (depotsLeft > 0) this.layout.depots.push(bin);
      else if (lv.tools.depots === 1)
        this.layout.depots = [bin]; // only one: just move it
      else return this.deny('None left. Tap one to pick it up.');
    } else {
      if (lv.tools.checkpoints === 0)
        return this.deny(`No ${this.t('checkpoints')} to place in this level.`);
      if (checkpointsLeft === 0)
        return this.deny('None left. Tap one to turn it around or pick it up.');
      this.remember();
      this.layout.checkpoints.push(checkpoint(bin, 1));
    }
    sound.play('place');
    this.afterEdit(bin);
  }

  private removeAt(bin: number): void {
    const before = this.layout.depots.length + this.layout.checkpoints.length;
    const snapshot = cloneLayout(this.layout);
    this.layout.depots = this.layout.depots.filter((d) => d !== bin);
    this.layout.checkpoints = this.layout.checkpoints.filter((c) => c.bin !== bin);
    if (this.layout.depots.length + this.layout.checkpoints.length < before) {
      this.history.push(snapshot);
      sound.play('remove');
      this.afterEdit(bin);
    }
  }

  private deny(message: string): void {
    sound.play('deny');
    announce(message);
    this.hintText.setText(message);
  }

  private afterEdit(bin: number): void {
    this.refresh();
    announce(this.describe(bin));
  }

  // ---------- touch picker ----------

  private openPicker(): void {
    this.closePicker();
    const x = Phaser.Math.Clamp(this.road.binX(this.cursor), 230, this.scale.width - 230);
    const y = 300;
    const nudge = (dir: -1 | 1) => {
      this.cursor = Phaser.Math.Clamp(this.cursor + dir, 0, this.level.bins - 1);
      sound.play('click');
      this.openPicker();
      announce(this.describe(this.cursor));
    };
    this.picker = [
      new Button(this, x - 160, y, 90, 80, '◀', () => nudge(-1)),
      new Button(
        this,
        x,
        y,
        210,
        80,
        this.actionLabel(this.cursor),
        () => {
          this.actAt(this.cursor);
          this.openPicker();
        },
        PALETTE.goldDark,
      ),
      new Button(this, x + 160, y, 90, 80, '▶', () => nudge(1)),
      new Button(this, x + 160, y - 70, 64, 44, '✕', () => this.closePicker()),
    ];
    for (const b of this.picker) {
      b.bg.setDepth(60);
      b.label.setDepth(61).setFontSize(22);
    }
    this.refresh();
  }

  private closePicker(): void {
    for (const b of this.picker) b.destroy();
    this.picker = [];
  }

  private actionLabel(bin: number): string {
    if (this.level.fixedDepots.includes(bin) || this.fixedCheckpointAt(bin)) return 'FIXED';
    const cp = this.layout.checkpoints.find((c) => c.bin === bin);
    if (cp) return cp.facing === 1 ? 'TURN ◀' : 'PICK UP';
    if (this.layout.depots.includes(bin)) return 'PICK UP';
    const depotsLeft = this.level.tools.depots - this.layout.depots.length;
    const cpsLeft = this.level.tools.checkpoints - this.layout.checkpoints.length;
    const tool =
      this.tool === 'depot'
        ? depotsLeft > 0 || cpsLeft === 0
          ? 'depot'
          : 'checkpoint'
        : cpsLeft > 0 || depotsLeft === 0
          ? 'checkpoint'
          : 'depot';
    if (tool === 'depot')
      return depotsLeft > 0 || this.level.tools.depots === 1
        ? `${this.t('depot').toUpperCase()} HERE`
        : 'NONE LEFT';
    return cpsLeft > 0 ? `${this.t('checkpoint').toUpperCase()} ▶` : 'NONE LEFT';
  }

  /** Spoken description of one address, for screen readers and keyboard play. */
  private describe(bin: number): string {
    const parts = [`${this.t('address')} ${bin + 1} of ${this.level.bins}`];
    const di = this.level.districts.findIndex((d) => bin >= d.from && bin <= d.to);
    const district = this.level.districts[di];
    if (district) parts.push(this.v === 'science' ? `domain ${di + 1}` : district.name);
    for (const b of this.level.buildings) {
      if (Math.abs(b.bin - bin) <= TUNING.city.reach)
        parts.push(
          `${b.bin === bin ? 'at' : 'next to'} ${buildingName(b, this.v)}${b.active ? '' : ` (${this.t('closed')})`}`,
        );
    }
    if (this.level.fixedDepots.includes(bin)) parts.push(`fixed ${this.t('depot')}`);
    if (this.layout.depots.includes(bin)) parts.push(`your ${this.t('depot')}`);
    for (const r of this.level.routes ?? [])
      if (bin >= Math.min(r.from, r.to) && bin <= Math.max(r.from, r.to))
        parts.push(`on the ${this.t('truck')} route, heading ${r.to < r.from ? 'left' : 'right'}`);
    const cp = this.fixedCheckpointAt(bin) ?? this.layout.checkpoints.find((c) => c.bin === bin);
    if (cp)
      parts.push(
        cp.facing === 1
          ? `${this.t('checkpoint')} facing right: stops ends coming from the right`
          : `${this.t('checkpoint')} facing left: stops ends coming from the left`,
      );
    if (parts.length === 1 || (parts.length === 2 && district))
      parts.push(`empty ${this.t('road')}`);
    return parts.join(', ') + '.';
  }

  /** Science Mode: a short explanation of whatever is at this bin. */
  private scienceTip(bin: number): string {
    if (this.layout.checkpoints.some((c) => c.bin === bin) || this.fixedCheckpointAt(bin))
      return SCIENCE_TIPS.checkpoint;
    if (this.layout.depots.includes(bin) || this.level.fixedDepots.includes(bin))
      return SCIENCE_TIPS.depot;
    const b = this.level.buildings.find((x) => Math.abs(x.bin - bin) <= TUNING.city.reach);
    if (b) return b.role === 'supplier' ? SCIENCE_TIPS.enhancer : SCIENCE_TIPS.gene;
    if (
      (this.level.routes ?? []).some(
        (r) => bin >= Math.min(r.from, r.to) && bin <= Math.max(r.from, r.to),
      )
    )
      return SCIENCE_TIPS.truck;
    if (this.level.districts.length) return SCIENCE_TIPS.domain;
    return SCIENCE_TIPS.machine;
  }

  private canRun(): boolean {
    const lv = this.level;
    const hasDepot = lv.fixedDepots.length + this.layout.depots.length > 0;
    const affordable =
      !lv.policies || policyCost(lv, this.layout.policy ?? DEFAULT_POLICY) <= lv.policies.budget;
    return hasDepot && affordable;
  }

  // ---------- running ----------

  private startRunning(): void {
    if (this.phase !== 'plan') return;
    if (!this.canRun())
      return this.deny(
        this.level.policies
          ? 'Over budget: choose cheaper options first.'
          : `Place a ${this.t('depot')} first: ${this.t('machines')} need somewhere to start.`,
      );
    sound.unlock();
    sound.play('click');
    this.closePicker();
    this.phase = 'run';
    this.run = startRun(this.level, this.layout, Math.floor(Math.random() * 2 ** 31));
    this.acc = 0;
    this.parcels = [];
    this.wasRunning.clear();
    this.weather.setFillStyle(PALETTE.heat, 0);
    this.weatherBanner.setVisible(false);
    this.refresh();
    announce('Running. F for fast, P to pause, S to stop and edit.');
  }

  private stopRunning(): void {
    if (this.phase !== 'run') return;
    this.phase = 'plan';
    this.run = null;
    this.parcels = [];
    this.fast = false;
    this.paused = false;
    this.weather.setFillStyle(PALETTE.heat, 0);
    this.weatherBanner.setVisible(false);
    this.refresh();
    announce('Stopped. Back to planning.');
  }

  private toggleFast(): void {
    this.fast = !this.fast;
    this.refresh();
    announce(this.fast ? 'Fast' : 'Normal speed');
  }

  private togglePause(): void {
    this.paused = !this.paused;
    this.refresh();
    announce(this.paused ? 'Paused' : 'Going');
  }

  override update(time: number, delta: number): void {
    for (const [id, a] of this.flashes) this.flashes.set(id, Math.max(0, a - delta / 600));
    if (this.phase !== 'run' || !this.run || this.paused) {
      if (this.flashes.size) this.redraw();
      return;
    }
    const run = this.run;
    const hadWeather = run.weatherStarted;
    this.acc += (Math.min(delta, 100) / 1000) * (this.fast ? TUNING.fastForward : 1);
    let stalls = 0;
    while (this.acc >= TUNING.step && !isFinished(run)) {
      this.acc -= TUNING.step;
      for (const ev of stepRun(run, TUNING.step)) {
        if (ev.type === 'delivered') this.onDelivery(ev.from, ev.to, ev.machineId);
        else if (ev.type === 'loaded') sound.play('load');
        else if (ev.type === 'stalled') stalls++;
      }
    }
    if (stalls > 0) sound.play('stall');
    if (run.weatherStarted && !hadWeather) this.startWeather();
    if (run.weatherStarted && !progress().reducedEffects)
      this.weather.setFillStyle(PALETTE.heat, 0.08 + Math.sin(time / 400) * 0.03);
    const reduced = progress().reducedEffects;
    const speed = (delta / 1000) * (this.fast ? TUNING.fastForward : 1) * 1.6;
    for (const p of this.parcels) p.t += reduced ? 1 : speed;
    this.parcels = this.parcels.filter((p) => p.t < 1);
    this.announceChanges();
    this.refresh();
    if (isFinished(run)) this.finish();
  }

  private startWeather(): void {
    const w = this.level.weather;
    if (!w) return;
    this.weather.setFillStyle(PALETTE.heat, 0.1);
    const opening = this.level.buildings.filter((b) => b.activeFrom === w.at);
    const msg = `☀ ${w.name.toUpperCase()}: demand up, ${this.t('checkpoints')} leakier${opening.length ? `, ${opening.map((b) => buildingName(b, this.v)).join(', ')} open${opening.length === 1 ? 's' : ''}` : ''}`;
    this.weatherBanner.setText(msg).setVisible(true);
    sound.play('stall');
    announce(msg);
  }

  private onDelivery(fromId: string, toId: string, machineId: number): void {
    const run = this.run;
    const from = this.level.buildings.find((b) => b.id === fromId);
    const to = this.level.buildings.find((b) => b.id === toId);
    const m = run?.engine.machines.find((x) => x.id === machineId);
    if (!from || !to || !m) return;
    sound.play('deliver');
    this.flashes.set(toId, 1);
    if (progress().reducedEffects || this.parcels.length > 12) return;
    if (!links(m, from, to, TUNING.city.reach)) return;
    const forward = from.bin < to.bin;
    const curve = forward
      ? this.road.curve(m.left, m.right)
      : reversed(this.road.curve(m.left, m.right));
    this.parcels.push({ curve, t: 0, resource: from.resource });
  }

  /** Tell screen-reader players when a customer starts or stops running. */
  private announceChanges(): void {
    const run = this.run;
    if (!run) return;
    for (const b of this.level.buildings) {
      if (b.role !== 'consumer' || !isOpen(b, run.city.time)) continue;
      const on = isRunning(run.city, b.id, run.cityParams);
      if (this.wasRunning.get(b.id) !== on && this.wasRunning.has(b.id))
        announce(`${buildingName(b, this.v)} ${on ? this.t('running') : this.t('waiting')}`);
      this.wasRunning.set(b.id, on);
    }
  }

  private finish(): void {
    const run = this.run;
    if (!run) return;
    this.phase = 'plan';
    this.scene.start('Results', { levelId: this.level.id, layout: this.layout, run });
  }

  // ---------- briefing ----------

  private openBrief(): void {
    if (this.phase === 'run') return;
    this.closePicker();
    this.phase = 'brief';
    this.briefPage = 0;
    this.drawBriefPage();
  }

  private drawBriefPage(): void {
    for (const o of this.brief) o.destroy();
    this.brief = [];
    const { width, height } = this.scale;
    const pages = this.level.intro;
    const page = pages[this.briefPage] ?? '';
    const last = this.briefPage >= pages.length - 1;
    const shade = this.add
      .rectangle(0, 0, width, height, PALETTE.ink, 0.45)
      .setOrigin(0)
      .setDepth(80)
      .setInteractive();
    const panel = this.add
      .rectangle(width / 2, height / 2, 760, 340, PALETTE.cream)
      .setStrokeStyle(3, PALETTE.ink)
      .setDepth(81);
    const title = this.add
      .text(width / 2, height / 2 - 130, `${this.level.number} · ${this.level.name}`, {
        ...TEXT_STYLES.title,
        fontSize: '36px',
      })
      .setOrigin(0.5)
      .setDepth(82);
    const body = this.add
      .text(width / 2, height / 2 - 10, page, {
        ...TEXT_STYLES.body,
        align: 'center',
        wordWrap: { width: 660 },
        lineSpacing: 6,
      })
      .setOrigin(0.5)
      .setDepth(82);
    const counter = this.add
      .text(
        width / 2,
        height / 2 + 150,
        `${this.briefPage + 1} / ${pages.length}   ·   ENTER next · ESC skip`,
        {
          ...TEXT_STYLES.hint,
          fontSize: '16px',
        },
      )
      .setOrigin(0.5)
      .setDepth(82);
    const next = new Button(
      this,
      width / 2 + 250,
      height / 2 + 110,
      200,
      46,
      last ? 'START ▸' : 'NEXT ▸',
      () => this.nextBriefPage(),
      PALETTE.goldDark,
    );
    const skip = new Button(this, width / 2 - 250, height / 2 + 110, 140, 46, 'SKIP', () =>
      this.closeBrief(),
    );
    for (const b of [next, skip]) {
      b.bg.setDepth(83);
      b.label.setDepth(84);
    }
    this.brief = [shade, panel, title, body, counter, next.bg, next.label, skip.bg, skip.label];
    announce(
      `${this.briefPage === 0 ? `Level ${this.level.number}, ${this.level.name}. ` : ''}${page}`,
    );
  }

  private nextBriefPage(): void {
    sound.unlock();
    sound.play('click');
    if (this.briefPage >= this.level.intro.length - 1) return this.closeBrief();
    this.briefPage++;
    this.drawBriefPage();
  }

  private closeBrief(): void {
    for (const o of this.brief) o.destroy();
    this.brief = [];
    this.phase = 'plan';
    this.refresh();
    announce(
      `Planning. ${this.level.hint} Use left and right arrows to move along the ${this.t('road')}, Enter to place, R to run.`,
    );
  }

  private toMenu(): void {
    sound.play('click');
    this.scene.start('LevelSelect');
  }
}

function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

function cloneLayout(l: Layout): Layout {
  return {
    depots: [...l.depots],
    checkpoints: l.checkpoints.map((c) => ({ ...c })),
    ...(l.policy ? { policy: { ...l.policy } } : {}),
  };
}

/** The same arch, travelled from right to left. */
function reversed(c: Phaser.Curves.CubicBezier): Phaser.Curves.CubicBezier {
  return new Phaser.Curves.CubicBezier(c.p3, c.p2, c.p1, c.p0);
}
