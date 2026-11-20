import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress } from '../config/progress';
import { TUNING } from '../config/tuning';
import { getLevel } from '../levels';
import type { Building, LevelConfig } from '../levels/types';
import { districtOf, isRunning, links } from '../systems/city';
import type { Checkpoint } from '../systems/extrusion';
import { checkpoint, isFinished, startRun, stepRun, type Layout, type Run } from '../systems/run';
import { formatValue, scoreRun } from '../systems/score';
import { announce } from '../ui/announce';
import { Button } from '../ui/Button';
import {
  drawBuilding,
  drawCheckpoint,
  drawDepot,
  drawMachineEnd,
  drawParcel,
  shortcutCurve,
} from '../ui/cityArt';
import { TEXT_STYLES } from '../ui/text';

type Phase = 'brief' | 'plan' | 'run';
type Tool = 'depot' | 'checkpoint';

export interface LevelSceneData {
  levelId: string;
  layout?: Layout;
  skipBrief?: boolean;
  /** Dev only: start running straight away and skip ahead this many seconds. */
  warm?: number;
}

interface Parcel {
  curve: Phaser.Curves.CubicBezier;
  t: number;
  resource: Building['resource'];
}

// Screen layout
const X0 = 70;
const X1 = 1210;
const ROAD_Y = 470;
const ROAD_TOP = ROAD_Y - 18;
const BUILDING_Y = 540;
const MAX_RISE = 300;
const BAR_Y = 668;

// One level: read the briefing, plan the layout, then watch a minute of the city.
export class LevelScene extends Phaser.Scene {
  private level!: LevelConfig;
  private layout: Layout = { depots: [], checkpoints: [] };
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

  private dyn!: Phaser.GameObjects.Graphics;
  private cursorGfx!: Phaser.GameObjects.Graphics;
  private buildingLabels = new Map<string, Phaser.GameObjects.Text>();
  private statusText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private toolButtons: Partial<Record<Tool, Button>> = {};
  private runButton!: Button;
  private fastButton!: Button;
  private pauseButton!: Button;
  private stopButton!: Button;
  private menuButton!: Button;
  private helpButton!: Button;
  private brief: Phaser.GameObjects.GameObject[] = [];
  private briefPage = 0;

  constructor() {
    super('Level');
  }

  create(data: LevelSceneData): void {
    this.level = getLevel(data.levelId);
    this.layout = data.layout
      ? {
          depots: [...data.layout.depots],
          checkpoints: data.layout.checkpoints.map((c) => ({ ...c })),
        }
      : { depots: [], checkpoints: [] };
    this.phase = 'plan';
    this.tool = this.level.tools.depots > 0 ? 'depot' : 'checkpoint';
    this.cursor = Math.floor(this.level.bins / 2);
    this.run = null;
    this.acc = 0;
    this.fast = false;
    this.paused = false;
    this.parcels = [];
    this.flashes.clear();
    this.wasRunning.clear();
    this.buildingLabels.clear();
    this.toolButtons = {};

    this.cameras.main.setBackgroundColor(PALETTE.sky);
    this.drawStatic();
    this.dyn = this.add.graphics().setDepth(10);
    this.cursorGfx = this.add.graphics().setDepth(12);
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

  // ---------- geometry ----------

  private binW(): number {
    return (X1 - X0) / this.level.bins;
  }

  private binX(bin: number): number {
    return X0 + (bin + 0.5) * this.binW();
  }

  private binAt(x: number): number {
    return Phaser.Math.Clamp(Math.floor((x - X0) / this.binW()), 0, this.level.bins - 1);
  }

  // ---------- drawing ----------

  private drawStatic(): void {
    const { width } = this.scale;
    const g = this.add.graphics().setDepth(0);

    // districts as tinted ground, each with a label
    for (const d of this.level.districts) {
      const color = d.id === 'old-town' ? PALETTE.oldTown : PALETTE.works;
      const left = X0 + d.from * this.binW();
      const right = X0 + (d.to + 1) * this.binW();
      g.fillStyle(color, 1).fillRect(left, 120, right - left, 500);
      this.add
        .text((left + right) / 2, 132, d.name.toUpperCase(), {
          ...TEXT_STYLES.small,
          fontStyle: 'bold',
          color: PALETTE.textDim,
        })
        .setOrigin(0.5, 0)
        .setDepth(1);
    }
    for (let i = 1; i < this.level.districts.length; i++) {
      const x = X0 + (this.level.districts[i]?.from ?? 0) * this.binW();
      g.lineStyle(2, 0x8d8578, 1);
      for (let y = 124; y < 616; y += 16) g.lineBetween(x, y, x, y + 8);
    }

    // grass strip and road
    g.fillStyle(PALETTE.sage, 1).fillRect(0, ROAD_Y + 18, width, 120);
    g.fillStyle(PALETTE.road, 1).fillRect(X0 - 20, ROAD_Y - 18, X1 - X0 + 40, 36);
    g.lineStyle(2, PALETTE.roadLine, 0.8);
    for (let x = X0; x < X1; x += 28) g.lineBetween(x, ROAD_Y, x + 14, ROAD_Y);
    // address ticks so the bins are visible
    g.lineStyle(1, 0x4c4944, 1);
    for (let i = 0; i <= this.level.bins; i++) {
      const x = X0 + i * this.binW();
      g.lineBetween(x, ROAD_Y + 12, x, ROAD_Y + 18);
    }
    // road ends
    g.fillStyle(PALETTE.ink, 1)
      .fillRect(X0 - 24, ROAD_Y - 22, 6, 44)
      .fillRect(X1 + 18, ROAD_Y - 22, 6, 44);

    // buildings below the road
    for (const b of this.level.buildings) {
      const label = this.add
        .text(this.binX(b.bin), BUILDING_Y + 34, '', {
          ...TEXT_STYLES.small,
          fontSize: '15px',
          align: 'center',
          backgroundColor: '#f7f1e4',
          padding: { x: 4, y: 1 },
        })
        .setOrigin(0.5, 0)
        .setDepth(6);
      this.buildingLabels.set(b.id, label);
    }
  }

  private drawBuildings(g: Phaser.GameObjects.Graphics): void {
    for (const b of this.level.buildings) {
      const lit =
        b.role === 'supplier' || (this.run ? isRunning(this.run.city, b.id, TUNING.city) : false);
      const x = this.binX(b.bin);
      // a short driveway to the road
      g.fillStyle(PALETTE.creamDark, 1).fillRect(x - 5, ROAD_Y + 18, 10, 10);
      drawBuilding(g, b.kind, x, BUILDING_Y, lit);
      const flash = this.flashes.get(b.id) ?? 0;
      if (flash > 0) {
        g.lineStyle(3, PALETTE.gold, flash).strokeCircle(x, BUILDING_Y - 4, 44);
      }
    }
  }

  private redraw(): void {
    const g = this.dyn;
    g.clear();
    this.drawBuildings(g);

    const machines = this.run?.engine.machines ?? [];

    // shortcuts first, so the signs and machines sit on top of them
    for (const m of machines) {
      if (m.left === m.right) continue;
      const points = shortcutCurve(
        this.binX(m.left),
        this.binX(m.right),
        ROAD_TOP - 2,
        MAX_RISE,
      ).getPoints(48);
      const dl = districtOf(this.level, m.left);
      const dr = districtOf(this.level, m.right);
      if (dl !== null && dr !== null && dl !== dr) {
        // mix-ups are dashed and terracotta, so they read without colour too
        g.lineStyle(4, PALETTE.terracottaDark, 1);
        for (let i = 0; i + 2 < points.length; i += 4) {
          g.strokePoints(points.slice(i, i + 3));
        }
      } else {
        g.lineStyle(8, PALETTE.goldDark, 0.9).strokePoints(points);
        g.lineStyle(4, PALETTE.gold, 1).strokePoints(points);
      }
    }

    // planned or fixed equipment
    const fixedDepots = new Set(this.level.fixedDepots);
    for (const bin of [...this.level.fixedDepots, ...this.layout.depots])
      drawDepot(g, this.binX(bin), ROAD_TOP, fixedDepots.has(bin));
    for (const c of this.level.fixedCheckpoints)
      drawCheckpoint(g, this.binX(c.bin), ROAD_TOP, c.facing, true);
    for (const c of this.layout.checkpoints)
      drawCheckpoint(g, this.binX(c.bin), ROAD_TOP, c.facing, false);

    // machine ends and parcels in transit
    for (const m of machines) {
      drawMachineEnd(g, this.binX(m.left), ROAD_Y - 2, m.leftStalled);
      if (m.right !== m.left) drawMachineEnd(g, this.binX(m.right), ROAD_Y - 2, m.rightStalled);
    }
    for (const p of this.parcels) {
      const pt = p.curve.getPoint(p.t);
      drawParcel(g, pt.x, pt.y, p.resource);
    }

    // keyboard / hover cursor
    const cg = this.cursorGfx;
    cg.clear();
    if (this.phase === 'plan') {
      const x = X0 + this.cursor * this.binW();
      cg.lineStyle(3, PALETTE.ink, 1).strokeRect(x + 1, ROAD_Y - 66, this.binW() - 2, 88);
    }
  }

  // ---------- HUD ----------

  private buildHud(): void {
    const { width } = this.scale;
    const lv = this.level;
    this.add.rectangle(0, 0, width, 104, PALETTE.cream).setOrigin(0).setDepth(20);
    this.add
      .text(24, 14, `${lv.number} · ${lv.name}`, { ...TEXT_STYLES.title, fontSize: '32px' })
      .setDepth(21);
    const g = lv.goal;
    const goalLine =
      g.metric === 'deliveries'
        ? `Goal: deliveries in one minute   ★ ${g.one}   ★★ ${g.two}   ★★★ ${g.three}`
        : `Goal: keep ${lv.buildings
            .filter((b) => b.role === 'consumer')
            .map((b) => `the ${b.name}`)
            .join(
              ' and ',
            )} running   ★ ${pct(g.one)}   ★★ ${pct(g.two)}   ★★★ ${pct(g.three)}${g.maxMixups !== undefined ? `   ·   mix-ups under ${pct(g.maxMixups)}` : ''}`;
    this.add.text(24, 58, goalLine, { ...TEXT_STYLES.small, fontSize: '17px' }).setDepth(21);
    this.timeText = this.add
      .text(width - 24, 14, '', { ...TEXT_STYLES.title, fontSize: '32px' })
      .setOrigin(1, 0)
      .setDepth(21);
    this.statusText = this.add
      .text(width - 24, 60, '', { ...TEXT_STYLES.small, fontSize: '17px', align: 'right' })
      .setOrigin(1, 0)
      .setDepth(21);

    this.hintText = this.add
      .text(width / 2, 630, '', {
        ...TEXT_STYLES.small,
        fontSize: '17px',
        align: 'center',
        wordWrap: { width: 1100 },
      })
      .setOrigin(0.5)
      .setDepth(21);

    this.add
      .rectangle(0, BAR_Y - 22, width, 74, PALETTE.creamDark)
      .setOrigin(0)
      .setDepth(20);
    let x = 110;
    if (lv.tools.depots > 0) {
      this.toolButtons.depot = new Button(this, x, BAR_Y + 14, 190, 46, '', () =>
        this.selectTool('depot'),
      );
      x += 205;
    }
    if (lv.tools.checkpoints > 0) {
      this.toolButtons.checkpoint = new Button(this, x + 15, BAR_Y + 14, 220, 46, '', () =>
        this.selectTool('checkpoint'),
      );
    }
    this.menuButton = new Button(this, width - 470, BAR_Y + 14, 110, 46, 'MENU', () =>
      this.toMenu(),
    );
    this.helpButton = new Button(this, width - 350, BAR_Y + 14, 110, 46, 'HELP', () =>
      this.openBrief(),
    );
    this.runButton = new Button(
      this,
      width - 130,
      BAR_Y + 14,
      220,
      46,
      'RUN ▶  (R)',
      () => this.startRunning(),
      PALETTE.goldDark,
    );
    this.fastButton = new Button(this, width - 590, BAR_Y + 14, 150, 46, '', () =>
      this.toggleFast(),
    );
    this.pauseButton = new Button(this, width - 430, BAR_Y + 14, 150, 46, '', () =>
      this.togglePause(),
    );
    this.stopButton = new Button(this, width - 130, BAR_Y + 14, 220, 46, 'STOP & EDIT (S)', () =>
      this.stopRunning(),
    );
  }

  private refresh(): void {
    const lv = this.level;
    const planning = this.phase !== 'run';
    const placedDepots = this.layout.depots.length;
    const placedCheckpoints = this.layout.checkpoints.length;
    this.toolButtons.depot
      ?.setText(
        `${this.tool === 'depot' ? '▸ ' : ''}DEPOT (1)  ${lv.tools.depots - placedDepots} left`,
      )
      .setVisible(planning);
    this.toolButtons.checkpoint
      ?.setText(
        `${this.tool === 'checkpoint' ? '▸ ' : ''}CHECKPOINT (2)  ${lv.tools.checkpoints - placedCheckpoints} left`,
      )
      .setVisible(planning);
    this.menuButton.setVisible(planning);
    this.helpButton.setVisible(planning);
    this.runButton.setVisible(planning);
    this.fastButton.setVisible(!planning).setText(this.fast ? 'NORMAL (F)' : 'FAST ⏩ (F)');
    this.pauseButton.setVisible(!planning).setText(this.paused ? 'GO (P)' : 'PAUSE (P)');
    this.stopButton.setVisible(!planning);
    this.runButton.setEnabled(this.canRun());

    if (planning) {
      this.timeText.setText(`${lv.durationSeconds}s`);
      this.statusText.setText('Planning');
      this.hintText.setText(`${lv.hint}   ·   ← → move · ENTER place · R run`);
    } else if (this.run) {
      const left = Math.max(0, lv.durationSeconds - this.run.engine.time);
      this.timeText.setText(`${Math.ceil(left)}s`);
      const score = scoreRun(lv, this.run.city);
      const mix = lv.goal.maxMixups !== undefined ? `   mix-ups ${pct(score.mixups)}` : '';
      this.statusText.setText(`${formatValue(lv, score.value)}${mix}`);
      this.hintText.setText(
        this.paused
          ? 'Paused. Press P or GO to carry on.'
          : 'Golden arches are shortcuts. When one joins a supplier to the right customer, deliveries can cross.',
      );
    }

    for (const b of lv.buildings) {
      const label = this.buildingLabels.get(b.id);
      if (!label) continue;
      if (b.role === 'supplier') label.setText(`${b.name}\nmakes ${b.resource}`);
      else if (!this.run) label.setText(`${b.name}\nneeds ${b.resource}`);
      else {
        const on = isRunning(this.run.city, b.id, TUNING.city);
        label.setText(`${b.name}\n${on ? 'running ✓' : 'waiting…'}`);
      }
    }
    this.redraw();
  }

  // ---------- input ----------

  private buildInput(): void {
    const zone = this.add
      .zone(X0, ROAD_Y - 70, X1 - X0, 100)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true })
      .setDepth(15);
    zone.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.phase !== 'plan') return;
      const bin = this.binAt(p.worldX);
      if (bin !== this.cursor) {
        this.cursor = bin;
        this.redraw();
      }
    });
    zone.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (this.phase !== 'plan') return;
      this.cursor = this.binAt(p.worldX);
      this.actAt(this.cursor);
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
    this.redraw();
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
        ? 'Depot selected. Machines start at depots.'
        : 'Checkpoint selected. A checkpoint stops machine ends coming from the side its arrow points at.',
    );
  }

  // ---------- planning ----------

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
      if (depotsLeft > 0) this.layout.depots.push(bin);
      else if (lv.tools.depots === 1)
        this.layout.depots = [bin]; // only one: just move it
      else return this.deny('No depots left. Tap one to pick it up.');
    } else {
      if (checkpointsLeft === 0)
        return this.deny('No checkpoints left. Tap one to turn it around or pick it up.');
      this.layout.checkpoints.push(checkpoint(bin, 1));
    }
    sound.play('place');
    this.afterEdit(bin);
  }

  private removeAt(bin: number): void {
    const before = this.layout.depots.length + this.layout.checkpoints.length;
    this.layout.depots = this.layout.depots.filter((d) => d !== bin);
    this.layout.checkpoints = this.layout.checkpoints.filter((c) => c.bin !== bin);
    if (this.layout.depots.length + this.layout.checkpoints.length < before) {
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

  /** Spoken description of one address, for screen readers and keyboard play. */
  private describe(bin: number): string {
    const parts = [`Address ${bin + 1} of ${this.level.bins}`];
    const district = this.level.districts.find((d) => bin >= d.from && bin <= d.to);
    if (district) parts.push(district.name);
    for (const b of this.level.buildings) {
      if (Math.abs(b.bin - bin) <= TUNING.city.reach)
        parts.push(`${b.bin === bin ? 'at' : 'next to'} the ${b.name}`);
    }
    if (this.level.fixedDepots.includes(bin)) parts.push('city depot');
    if (this.layout.depots.includes(bin)) parts.push('your depot');
    const cp = this.fixedCheckpointAt(bin) ?? this.layout.checkpoints.find((c) => c.bin === bin);
    if (cp)
      parts.push(
        cp.facing === 1
          ? 'checkpoint facing right: stops ends coming from the right'
          : 'checkpoint facing left: stops ends coming from the left',
      );
    if (parts.length === 1 || (parts.length === 2 && district)) parts.push('empty road');
    return parts.join(', ') + '.';
  }

  private canRun(): boolean {
    return this.level.fixedDepots.length + this.layout.depots.length > 0;
  }

  // ---------- running ----------

  private startRunning(): void {
    if (this.phase !== 'plan') return;
    if (!this.canRun()) return this.deny('Place a depot first: machines need somewhere to start.');
    sound.unlock();
    sound.play('click');
    this.phase = 'run';
    this.run = startRun(this.level, this.layout, Math.floor(Math.random() * 2 ** 31));
    this.acc = 0;
    this.parcels = [];
    this.refresh();
    announce(
      'Running. Machines are loading at the depot. F for fast, P to pause, S to stop and edit.',
    );
  }

  private stopRunning(): void {
    if (this.phase !== 'run') return;
    this.phase = 'plan';
    this.run = null;
    this.parcels = [];
    this.fast = false;
    this.paused = false;
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

  override update(_time: number, delta: number): void {
    for (const [id, a] of this.flashes) this.flashes.set(id, Math.max(0, a - delta / 600));
    if (this.phase !== 'run' || !this.run || this.paused) {
      if (this.flashes.size) this.redraw();
      return;
    }
    const run = this.run;
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
    const reduced = progress().reducedEffects;
    const speed = (delta / 1000) * (this.fast ? TUNING.fastForward : 1) * 1.6;
    for (const p of this.parcels) p.t += reduced ? 1 : speed;
    this.parcels = this.parcels.filter((p) => p.t < 1);
    this.announceChanges();
    this.refresh();
    if (isFinished(run)) this.finish();
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
    const curve = shortcutCurve(
      this.binX(forward ? m.left : m.right),
      this.binX(forward ? m.right : m.left),
      ROAD_TOP - 2,
      MAX_RISE,
    );
    this.parcels.push({ curve, t: 0, resource: from.resource });
  }

  /** Tell screen-reader players when a customer starts or stops running. */
  private announceChanges(): void {
    if (!this.run) return;
    for (const b of this.level.buildings) {
      if (b.role !== 'consumer') continue;
      const on = isRunning(this.run.city, b.id, TUNING.city);
      if (this.wasRunning.get(b.id) !== on && this.wasRunning.has(b.id))
        announce(`${b.name} ${on ? 'is running' : 'is waiting'}`);
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
        height / 2 + 140,
        `${this.briefPage + 1} / ${pages.length}   ·   ENTER next · ESC skip`,
        TEXT_STYLES.hint,
      )
      .setOrigin(0.5)
      .setDepth(82);
    const next = new Button(
      this,
      width / 2 + 250,
      height / 2 + 120,
      200,
      46,
      last ? 'START ▸' : 'NEXT ▸',
      () => this.nextBriefPage(),
      PALETTE.goldDark,
    );
    const skip = new Button(this, width / 2 - 250, height / 2 + 120, 140, 46, 'SKIP', () =>
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
      `Planning. ${this.level.hint} Use left and right arrows to move along the road, Enter to place, R to run.`,
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
