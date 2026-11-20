import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import { TUNING } from '../config/tuning';
import { buildingName, term, type View } from '../content/terms';
import { sandbox } from '../levels/sandbox';
import type { Building, LevelConfig, Resource } from '../levels/types';
import { buildingMarks, drawHeatmap, drawHistogram } from '../render/charts';
import { RoadView } from '../render/RoadView';
import {
  contactMap,
  difference,
  lengthDistribution,
  similarity,
  toCsv,
  type ContactMap,
} from '../systems/contacts';
import type { EngineParams } from '../systems/extrusion';
import {
  checkpoint,
  measure,
  startRun,
  stepRun,
  type Layout,
  type Overrides,
  type Run,
} from '../systems/run';
import { announce } from '../ui/announce';
import { FocusButton, FocusList, Stepper, type Focusable } from '../ui/Controls';
import { SCI } from '../ui/scienceArt';
import { TEXT_STYLES } from '../ui/text';

const MEASURE_SECONDS = 300;

interface Settings {
  engine: EngineParams;
  reliability: number;
  trafficRate: number;
}

interface Snapshot {
  label: string;
  map: ContactMap;
  lengths: number[];
  potential: number[];
}

const RESOURCES: Resource[] = ['bread', 'power', 'water'];

// City Planner: an open sandbox on the same engine. Place anything, change every setting, run it
// live, and compare a baseline city with a changed one on the connectivity maps.
export class PlannerScene extends Phaser.Scene {
  private v: View = 'city';
  private level!: LevelConfig;
  private road!: RoadView;
  private layout: Layout = { depots: [], checkpoints: [] };
  private settings!: Settings;
  private seed = 1;
  private run: Run | null = null;
  private running = false;
  private fast = false;
  private acc = 0;
  private cursor = 20;
  private tool: 'depot' | 'checkpoint' = 'depot';
  private focus = new FocusList();
  private status!: Phaser.GameObjects.Text;
  private panel: Phaser.GameObjects.GameObject[] = [];
  private panelSteppers: Stepper[] = [];
  private panelOpen: 'none' | 'settings' | 'maps' = 'none';
  private baseline: Snapshot | null = null;
  private selected = 0;
  private roadFocus!: Focusable;

  constructor() {
    super('Planner');
  }

  create(): void {
    this.v = progress().scienceMode ? 'science' : 'city';
    this.level = {
      ...sandbox,
      buildings: sandbox.buildings.map((b) => ({ ...b })),
      routes: sandbox.routes?.map((r) => ({ ...r })) ?? [],
    };
    this.layout = {
      depots: [20],
      checkpoints: [checkpoint(4, 1), checkpoint(13, -1)],
    };
    this.settings = {
      engine: { ...TUNING.engine, ...sandbox.engine } as EngineParams,
      reliability: TUNING.checkpointReliability,
      trafficRate: 0,
    };
    this.seed = 1;
    this.run = null;
    this.running = false;
    this.fast = false;
    this.cursor = 20;
    this.focus = new FocusList();
    this.panel = [];
    this.panelSteppers = [];
    this.panelOpen = 'none';
    this.baseline = null;
    this.selected = 0;
    this.build();
  }

  private t(key: Parameters<typeof term>[0]): string {
    return term(key, this.v);
  }

  private build(): void {
    const science = this.v === 'science';
    const { width } = this.scale;
    this.cameras.main.setBackgroundColor(science ? SCI.bg : PALETTE.sky);
    this.road = new RoadView(this, this.level, this.v, {
      x0: 60,
      x1: 1220,
      roadY: 400,
      maxRise: 250,
      top: 96,
      bottom: 560,
    });
    const ink = science ? SCI.text : PALETTE.text;
    this.add
      .rectangle(0, 0, width, 88, science ? SCI.panel : PALETTE.cream)
      .setOrigin(0)
      .setDepth(20);
    this.add
      .text(24, 12, science ? 'SCIENCE SANDBOX' : 'CITY PLANNER', {
        ...TEXT_STYLES.title,
        fontSize: '30px',
        color: ink,
      })
      .setDepth(21);
    this.status = this.add
      .text(24, 54, '', { ...TEXT_STYLES.small, fontSize: '15px', color: ink })
      .setDepth(21);

    this.add
      .rectangle(0, 578, width, 142, science ? SCI.panel : PALETTE.creamDark)
      .setOrigin(0)
      .setDepth(20);

    const zone = this.add.zone(60, 96, 1160, 470).setOrigin(0).setInteractive().setDepth(15);
    zone.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.wasTouch) return;
      this.cursor = this.road.binAt(p.worldX);
    });
    zone.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (this.panelOpen !== 'none') return;
      this.cursor = this.road.binAt(p.worldX);
      this.actAt(this.cursor);
    });

    this.roadFocus = {
      describe: () => `Road. ${this.describeBin()}`,
      activate: () => this.actAt(this.cursor),
      adjust: (dir, big) => {
        this.cursor = Phaser.Math.Clamp(this.cursor + dir * (big ? 5 : 1), 0, this.level.bins - 1);
        announce(this.describeBin());
      },
      setFocus: () => undefined,
    };

    const row1 = 614;
    const row2 = 676;
    const btn = (
      x: number,
      y: number,
      w: number,
      label: () => string,
      fn: () => void,
      help = '',
      color?: number,
    ) => {
      const b = new FocusButton(this, x + w / 2, y, w, 48, label, fn, color, help);
      b.button.bg.setDepth(50);
      b.button.label.setDepth(51);
      this.focus.add(b);
      return b;
    };
    this.focus.add(this.roadFocus);
    const toolBtn = btn(
      20,
      row1,
      200,
      () => `${this.tool === 'depot' ? '▸ ' : ''}${this.t('depot').toUpperCase()}`,
      () => this.setTool('depot'),
    );
    const cpBtn = btn(
      230,
      row1,
      220,
      () => `${this.tool === 'checkpoint' ? '▸ ' : ''}${this.t('checkpoint').toUpperCase()}`,
      () => this.setTool('checkpoint'),
    );
    this.toolButtons = [toolBtn, cpBtn];
    btn(
      460,
      row1,
      160,
      () => 'SETTINGS…',
      () => this.openSettings(),
      'Change machines, checkpoints, traffic and buildings.',
    );
    btn(
      630,
      row1,
      160,
      () => 'MAPS…',
      () => this.openMaps(),
      'Measure this city and compare it with a baseline.',
    );
    btn(
      800,
      row1,
      120,
      () => 'CLEAR',
      () => this.clear(),
      'Remove everything you placed.',
    );
    btn(
      930,
      row1,
      150,
      () => (this.v === 'city' ? 'VIEW: CITY' : 'VIEW: SCIENCE'),
      () => this.toggleView(),
    );
    btn(
      1090,
      row1,
      170,
      () => 'MENU',
      () => this.scene.start('Modes'),
    );
    btn(
      20,
      row2,
      200,
      () => (this.running ? 'PAUSE ❚❚' : 'RUN ▶'),
      () => this.toggleRun(),
      'Run the city live.',
      PALETTE.goldDark,
    );
    btn(
      230,
      row2,
      160,
      () => (this.fast ? 'NORMAL' : 'FAST ⏩'),
      () => {
        this.fast = !this.fast;
      },
    );
    btn(
      400,
      row2,
      160,
      () => 'RESTART',
      () => this.restartRun(),
      'Start the live run again with the current seed.',
    );
    const seed = new Stepper(
      this,
      570,
      row2,
      220,
      'Random seed',
      () => String(this.seed),
      (d, big) => {
        this.seed = Math.max(1, this.seed + d * (big ? 10 : 1));
        this.restartRun();
      },
      'Same seed, same layout, same settings: same city every time.',
      this.v === 'science',
    );
    this.focus.add(seed);
    btn(
      800,
      row2,
      210,
      () => 'EXPORT DATA',
      () => this.exportData(),
      'Download the connectivity map as CSV and the settings as JSON.',
    );
    btn(
      1020,
      row2,
      240,
      () => 'HELP',
      () => this.help(),
    );

    const kb = this.input.keyboard;
    kb?.on('keydown', (e: KeyboardEvent) => this.onKey(e));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => kb?.removeAllListeners());
    this.focus.focus(0);
    announce(
      `${this.v === 'science' ? 'Science sandbox' : 'City Planner'}. Place ${this.t('depot')}s and ${this.t('checkpoints')} anywhere, change every setting, and compare maps. Tab moves between controls.`,
    );
  }

  private toolButtons: FocusButton[] = [];

  private onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      if (this.panelOpen !== 'none') this.closePanel();
      else this.scene.start('Modes');
      return;
    }
    if (this.focus.handle(e)) return;
    const k = e.key.toLowerCase();
    if (k === 'r') this.toggleRun();
    else if (k === 'f') this.fast = !this.fast;
    else if (k === '1') this.setTool('depot');
    else if (k === '2') this.setTool('checkpoint');
  }

  private describeBin(): string {
    const bin = this.cursor;
    const parts = [`${this.t('address')} ${bin + 1}`];
    for (const b of this.level.buildings)
      if (Math.abs(b.bin - bin) <= 1) parts.push(`near ${buildingName(b, this.v)}`);
    if (this.layout.depots.includes(bin)) parts.push(this.t('depot'));
    const cp = this.layout.checkpoints.find((c) => c.bin === bin);
    if (cp) parts.push(`${this.t('checkpoint')} facing ${cp.facing === 1 ? 'right' : 'left'}`);
    return parts.join(', ') + '. Enter places, turns or removes.';
  }

  private setTool(tool: 'depot' | 'checkpoint'): void {
    this.tool = tool;
    for (const b of this.toolButtons) b.refresh();
    announce(`${tool === 'depot' ? this.t('depot') : this.t('checkpoint')} selected`);
  }

  private actAt(bin: number): void {
    sound.unlock();
    const cp = this.layout.checkpoints.find((c) => c.bin === bin);
    if (cp) {
      if (cp.facing === 1) cp.facing = -1;
      else this.layout.checkpoints = this.layout.checkpoints.filter((c) => c !== cp);
      sound.play('turn');
    } else if (this.layout.depots.includes(bin)) {
      this.layout.depots = this.layout.depots.filter((d) => d !== bin);
      sound.play('remove');
    } else if (this.tool === 'depot') {
      this.layout.depots.push(bin);
      sound.play('place');
    } else {
      this.layout.checkpoints.push(checkpoint(bin, 1));
      sound.play('place');
    }
    announce(this.describeBin());
    if (this.run) this.restartRun();
  }

  private clear(): void {
    this.layout = { depots: [], checkpoints: [] };
    this.restartRun();
    announce('Cleared.');
  }

  private overrides(): Overrides {
    return {
      engine: this.settings.engine,
      reliability: this.settings.reliability,
      trafficRate: this.settings.trafficRate,
    };
  }

  /** The level as currently configured (buildings and traffic as set in Settings). */
  private configured(): { level: LevelConfig; layout: Layout } {
    const level: LevelConfig = {
      ...this.level,
      engine: { ...this.settings.engine },
      routes: (this.level.routes ?? []).map((r) => ({ ...r, rate: this.settings.trafficRate })),
    };
    const layout: Layout = {
      depots: [...this.layout.depots],
      checkpoints: this.layout.checkpoints.map((c) => ({
        ...c,
        reliability: this.settings.reliability,
      })),
    };
    return { level, layout };
  }

  private restartRun(): void {
    const { level, layout } = this.configured();
    this.run = startRun(level, layout, this.seed);
    this.acc = 0;
  }

  private toggleRun(): void {
    sound.unlock();
    if (!this.run) this.restartRun();
    this.running = !this.running;
    announce(this.running ? 'Running' : 'Paused');
  }

  override update(_t: number, delta: number): void {
    if (this.running && this.run && this.panelOpen === 'none') {
      this.acc += (Math.min(delta, 100) / 1000) * (this.fast ? TUNING.fastForward : 1);
      while (this.acc >= TUNING.step) {
        this.acc -= TUNING.step;
        stepRun(this.run, TUNING.step);
      }
    }
    this.road.draw({
      layout: this.layout,
      run: this.run,
      cityParams: this.run?.cityParams ?? TUNING.city,
      cursor: this.cursor,
      parcels: [],
      flashes: new Map(),
    });
    const s = this.settings;
    this.status.setText(
      `seed ${this.seed} · ${this.t('fleet').toLowerCase()} ${s.engine.fleet} · speed ${s.engine.speed}/s · lifetime ${s.engine.lifetimeMean}s · loading every ${s.engine.loadInterval}s · hold ${Math.round(s.reliability * 100)}% · slip ${s.engine.bypassPerSecond}/s · traffic ${s.trafficRate}/s` +
        (this.run ? ` · t = ${Math.floor(this.run.engine.time)}s` : ''),
    );
  }

  private toggleView(): void {
    saveProgress({ scienceMode: !progress().scienceMode });
    this.scene.restart();
  }

  // ---------- panels ----------

  private closePanel(): void {
    for (const o of this.panel) o.destroy();
    for (const s of this.panelSteppers) s.destroy();
    this.panel = [];
    this.panelSteppers = [];
    this.panelOpen = 'none';
    this.focusBackup?.();
  }

  private focusBackup: (() => void) | null = null;

  private openPanel(kind: 'settings' | 'maps', title: string): FocusList {
    this.closePanel();
    this.panelOpen = kind;
    const { width, height } = this.scale;
    const dark = this.v === 'science';
    const shade = this.add
      .rectangle(0, 0, width, height, dark ? SCI.bg : PALETTE.cream, 0.97)
      .setOrigin(0)
      .setDepth(60)
      .setInteractive();
    const head = this.add
      .text(width / 2, 34, title, {
        ...TEXT_STYLES.title,
        fontSize: '30px',
        color: dark ? SCI.text : PALETTE.text,
      })
      .setOrigin(0.5)
      .setDepth(61);
    this.panel.push(shade, head);
    const list = new FocusList();
    const outer = this.focus;
    this.focus = list;
    this.focusBackup = () => {
      this.focus = outer;
      this.focusBackup = null;
    };
    return list;
  }

  private panelButton(
    list: FocusList,
    x: number,
    y: number,
    w: number,
    label: () => string,
    fn: () => void,
    color?: number,
  ): FocusButton {
    const b = new FocusButton(this, x, y, w, 50, label, fn, color);
    b.button.bg.setDepth(71);
    b.button.label.setDepth(72);
    this.panel.push(b.button.bg, b.button.label);
    list.add(b);
    return b;
  }

  private openSettings(): void {
    const list = this.openPanel(
      'settings',
      this.v === 'science' ? 'Model settings' : 'City settings',
    );
    const e = this.settings.engine;
    const dark = this.v === 'science';
    const num = (x: number, d = 2) => String(Math.round(x * 10 ** d) / 10 ** d);
    const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
    const defs: [string, () => string, (d: -1 | 1, big: boolean) => void, string][] = [
      [
        `${this.t('fleet')} size`,
        () => String(e.fleet),
        (d, b) => (e.fleet = clamp(e.fleet + d * (b ? 5 : 1), 0, 30)),
        'How many can be out at once.',
      ],
      [
        'Speed (addresses/s)',
        () => num(e.speed, 1),
        (d, b) => (e.speed = clamp(e.speed + d * (b ? 1 : 0.5), 0.5, 10)),
        'How fast each end moves, on average.',
      ],
      [
        'Lifetime (s)',
        () => num(e.lifetimeMean, 0),
        (d, b) => (e.lifetimeMean = clamp(e.lifetimeMean + d * (b ? 20 : 2), 1, 300)),
        'Average time before a machine is retired.',
      ],
      [
        'Loading every (s)',
        () => num(e.loadInterval, 1),
        (d, b) => (e.loadInterval = clamp(e.loadInterval + d * (b ? 5 : 0.5), 0.5, 60)),
        'Average wait between loads at each depot.',
      ],
      [
        `${this.t('checkpoint')} hold %`,
        () => `${Math.round(this.settings.reliability * 100)}%`,
        (d, b) =>
          (this.settings.reliability = clamp(
            this.settings.reliability + d * (b ? 0.25 : 0.05),
            0,
            1,
          )),
        'Chance an end that meets a checkpoint head on stops.',
      ],
      [
        'Slip-past (per s)',
        () => num(e.bypassPerSecond, 2),
        (d, b) => (e.bypassPerSecond = clamp(e.bypassPerSecond + d * (b ? 0.1 : 0.01), 0, 1)),
        'Chance per second a held end slips through.',
      ],
      [
        `${this.t('truck')} traffic (per s)`,
        () => num(this.settings.trafficRate, 2),
        (d, b) =>
          (this.settings.trafficRate = clamp(
            this.settings.trafficRate + d * (b ? 0.5 : 0.1),
            0,
            3,
          )),
        'Trucks drive right to left along the whole road.',
      ],
      [
        'Truck push chance',
        () => num(e.trafficPush ?? 0, 2),
        (d, b) => (e.trafficPush = clamp((e.trafficPush ?? 0) + d * (b ? 0.25 : 0.05), 0, 1)),
        'Chance a truck shoves a machine end it meets.',
      ],
      [
        'Truck block chance',
        () => num(e.trafficBlock ?? 0, 2),
        (d, b) => (e.trafficBlock = clamp((e.trafficBlock ?? 0) + d * (b ? 0.25 : 0.05), 0, 1)),
        'Chance an oncoming truck holds an end up.',
      ],
    ];
    defs.forEach(([label, value, change, help], i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const s = new Stepper(
        this,
        80 + col * 380,
        110 + row * 72,
        340,
        label,
        value,
        change,
        help,
        dark,
      );
      this.panelSteppers.push(s);
      list.add(s);
    });

    // buildings: choose one, then open/close it or change what it makes or needs
    const y = 360;
    const b = () => this.level.buildings[this.selected] as Building;
    let refreshBuilding = () => undefined as void;
    const pick = new Stepper(
      this,
      80,
      y,
      340,
      'Building',
      () => `${buildingName(b(), this.v)} (${this.t('address')} ${b().bin + 1})`,
      (d) => {
        this.selected =
          (this.selected + d + this.level.buildings.length) % this.level.buildings.length;
        refreshBuilding();
      },
      'Choose a building to change.',
      dark,
    );
    this.panelSteppers.push(pick);
    list.add(pick);
    const open = this.panelButton(
      list,
      650,
      y,
      300,
      () => `${b().active ? 'Open ✓ (tap to close)' : 'Closed (tap to open)'}`,
      () => {
        b().active = !b().active;
        pick.refresh();
      },
    );
    const res = this.panelButton(
      list,
      990,
      y,
      300,
      () => `${b().role === 'supplier' ? 'Makes' : 'Needs'}: ${b().resource}`,
      () => {
        const i = RESOURCES.indexOf(b().resource);
        b().resource = RESOURCES[(i + 1) % RESOURCES.length] ?? 'bread';
        pick.refresh();
      },
    );
    refreshBuilding = () => {
      open.refresh();
      res.refresh();
    };
    const note = this.add
      .text(
        this.scale.width / 2,
        440,
        'Compatibility: a supplier serves a customer only if they share a resource. Changing these is how you rewire the city’s rules.',
        {
          ...TEXT_STYLES.small,
          align: 'center',
          wordWrap: { width: 1000 },
          color: dark ? SCI.textDim : PALETTE.textDim,
        },
      )
      .setOrigin(0.5)
      .setDepth(61);
    this.panel.push(note);
    this.panelButton(
      list,
      this.scale.width / 2 - 170,
      540,
      300,
      () => 'RESET SETTINGS',
      () => {
        this.settings = {
          engine: { ...TUNING.engine, ...sandbox.engine } as EngineParams,
          reliability: TUNING.checkpointReliability,
          trafficRate: 0,
        };
        this.closePanel();
        this.openSettings();
      },
    );
    this.panelButton(
      list,
      this.scale.width / 2 + 170,
      540,
      300,
      () => 'DONE',
      () => {
        this.closePanel();
        this.restartRun();
      },
      PALETTE.goldDark,
    );
    list.focus(0);
  }

  private snapshot(label: string): Snapshot {
    const { level, layout } = this.configured();
    const run = measure(level, layout, this.seed, MEASURE_SECONDS, this.overrides());
    return {
      label,
      map: contactMap(run.engine),
      lengths: lengthDistribution(run.engine, 'realized'),
      potential: lengthDistribution(run.engine, 'potential'),
    };
  }

  private openMaps(): void {
    const list = this.openPanel(
      'maps',
      `Maps (${MEASURE_SECONDS} simulated seconds, seed ${this.seed})`,
    );
    const dark = this.v === 'science';
    const current = this.snapshot('This city');
    const marks = buildingMarks(
      this.level.buildings.filter((b) => b.active),
      (b) => buildingName(b, this.v),
    );
    const size = 230;
    const add = (o: Phaser.GameObjects.Container) => {
      o.setDepth(65);
      this.panel.push(o);
    };
    const title = (s: string) =>
      dark ? s.replace('City Connectivity Map', 'Simulated contact map') : s;
    if (this.baseline) {
      add(
        drawHeatmap(this, this.baseline.map, 110, 120, size, {
          title: title('Baseline'),
          marks,
          dark,
        }),
      );
      add(drawHeatmap(this, current.map, 470, 120, size, { title: title('This city'), dark }));
      add(
        drawHeatmap(this, difference(this.baseline.map, current.map), 830, 120, size, {
          title: 'Difference',
          note: 'orange = more than baseline, blue = less',
          scale: 'diverging',
          dark,
        }),
      );
      const sim = similarity(this.baseline.map, current.map);
      this.panel.push(
        this.add
          .text(1080, 235, `Similarity\n${sim} / 100`, {
            ...TEXT_STYLES.body,
            align: 'center',
            color: dark ? SCI.text : PALETTE.text,
          })
          .setOrigin(0, 0.5)
          .setDepth(65),
      );
      add(
        drawHistogram(
          this,
          this.baseline.lengths,
          110,
          420,
          330,
          90,
          `Baseline: ${this.t('shortcut')} lengths`,
          this.baseline.potential,
          dark,
        ),
      );
    } else {
      add(
        drawHeatmap(this, current.map, 470, 120, size, {
          title: title(this.t('map')),
          note: this.t('mapNote'),
          marks,
          dark,
        }),
      );
    }
    add(
      drawHistogram(
        this,
        current.lengths,
        470,
        420,
        330,
        90,
        `This city: ${this.t('shortcut')} lengths`,
        current.potential,
        dark,
      ),
    );
    this.panel.push(
      this.add
        .text(
          830,
          440,
          'Bars: realized lengths (time-weighted).\nLine: potential span, how long they\nwould be by now with nothing in the way.',
          {
            ...TEXT_STYLES.small,
            fontSize: '14px',
            color: dark ? SCI.textDim : PALETTE.textDim,
          },
        )
        .setDepth(65),
    );
    this.panelButton(
      list,
      300,
      640,
      380,
      () => 'SAVE THIS CITY AS BASELINE',
      () => {
        this.baseline = { ...current, label: 'Baseline' };
        announce('Saved as baseline. Change something, then open Maps again to compare.');
        this.closePanel();
      },
    );
    this.panelButton(
      list,
      980,
      640,
      300,
      () => 'CLOSE',
      () => this.closePanel(),
      PALETTE.goldDark,
    );
    list.focus(0);
    announce(
      this.baseline
        ? `Comparison ready. Similarity to baseline ${similarity(this.baseline.map, current.map)} out of 100.`
        : 'Map ready. Save it as a baseline to compare against changes.',
    );
  }

  private exportData(): void {
    const { level, layout } = this.configured();
    const run = measure(level, layout, this.seed, MEASURE_SECONDS, this.overrides());
    const csv = toCsv(contactMap(run.engine));
    const json = JSON.stringify(
      {
        note: 'Model output from SHORTCUT. City Planner. Contact propensity from a simplified loop-extrusion-inspired simulation, not experimental data.',
        seed: this.seed,
        seconds: MEASURE_SECONDS,
        settings: this.settings,
        layout: this.layout,
        buildings: this.level.buildings,
        lengthDistribution: lengthDistribution(run.engine, 'realized'),
      },
      null,
      2,
    );
    download(`shortcut-map-seed${this.seed}.csv`, csv, 'text/csv');
    download(`shortcut-settings-seed${this.seed}.json`, json, 'application/json');
    announce('Exported the map as CSV and the settings as JSON.');
  }

  private help(): void {
    announce(
      'Tap or press Enter on the road to place, turn, or remove. Settings changes how everything behaves. Maps measures five simulated minutes and compares against a saved baseline. Export downloads the data. The seed makes runs repeatable.',
    );
    this.status.setText(
      'Tap the road to place, turn or remove. SETTINGS changes the rules. MAPS measures and compares. Same seed = same result.',
    );
  }
}

function download(name: string, text: string, type: string): void {
  try {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    // downloads blocked; nothing else to do
  }
}
