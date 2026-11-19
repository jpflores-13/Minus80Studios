import Phaser from 'phaser';
import { PALETTE, PIXEL, TOOLBAR_HEIGHT } from '../config/gameConfig';
import { TUNING } from '../config/tuning';
import { MapView } from '../entities/MapView';
import { getLevel } from '../levels';
import type { EquipmentKind, LevelConfig, PollutionSource } from '../levels/types';
import {
  move,
  place,
  remaining,
  remove,
  type Deployment,
  type Phase,
  type PlaceResult,
} from '../systems/equipment';
import { segmentLength } from '../systems/network';
import { performance, tally } from '../systems/score';
import { advance, createSim, syncTraps, type SimState } from '../systems/sim';
import { Button } from '../ui/Button';
import { TEXT_STYLES } from '../ui/text';

const TOOL_NAMES: Record<EquipmentKind, string> = { bin: 'Trash bin', trap: 'Trash trap' };
const TOOL_HELP: Record<EquipmentKind, string> = {
  bin: 'Prevent: place near a neighbourhood to cut its litter',
  trap: 'Intercept: place across the creek. Holds limited litter.',
};
const REJECT: Record<Exclude<PlaceResult, { ok: true }>['reason'], string> = {
  'wrong-phase': 'You can’t move equipment once the flow is released',
  'no-slot': 'Place equipment on a highlighted spot',
  'wrong-kind': 'That spot needs a different piece of equipment',
  occupied: 'Something is already there',
  'none-left': 'None left in your inventory',
};

interface Drag {
  kind: EquipmentKind;
  from: string | null;
  ghost: Phaser.GameObjects.Image;
  startX: number;
  startY: number;
}

/**
 * One watershed level: INVESTIGATE → DEPLOY → FLOW → results.
 * Rules live in src/systems/ (equipment, sim, score). This scene wires input and drawing.
 */
export class LevelScene extends Phaser.Scene {
  private level!: LevelConfig;
  private dep: Deployment = {};
  private phase: Phase = 'investigate';
  private sim: SimState | undefined;
  private map!: MapView;
  private selected: EquipmentKind | null = null;
  private drag: Drag | null = null;
  private paused = false;
  private fast = false;
  private ended = false;

  private header!: Phaser.GameObjects.Text;
  private status!: Phaser.GameObjects.Text;
  private progressFill!: Phaser.GameObjects.Rectangle;
  private toast!: Phaser.GameObjects.Text;
  private toastUntil = 0;
  private inspect!: Phaser.GameObjects.Text;
  private pausedText!: Phaser.GameObjects.Text;
  private toolCards = new Map<
    EquipmentKind,
    { bg: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text }
  >();
  private mainButton!: Button;
  private pauseButton!: Button;
  private speedButton!: Button;

  constructor() {
    super('Level');
  }

  create(data: { levelId?: string }): void {
    this.level = getLevel(data.levelId ?? 'level-1');
    this.dep = {};
    this.phase = 'investigate';
    this.sim = undefined;
    this.selected = null;
    this.drag = null;
    this.paused = false;
    this.fast = false;
    this.ended = false;
    this.toolCards.clear();

    this.map = new MapView(this, this.level);
    this.buildTopBar();
    this.buildToolbar();
    this.bindInput();
    this.enterPhase('investigate');
    this.cameras.main.fadeIn(400);
  }

  override update(time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, 0.1);
    if (this.sim && this.phase === 'flow' && !this.paused) {
      const events = advance(this.sim, dt * (this.fast ? TUNING.sim.fastForward : 1));
      for (const e of events) {
        if (e.type === 'trap-full') this.say('A trash trap is full! Litter now slips past it.');
        if (e.type === 'done') this.finish();
      }
    }
    const highlight = this.drag?.kind ?? this.selected;
    this.map.update(
      time,
      this.dep,
      this.phase === 'deploy' || this.phase === 'flow' ? highlight : null,
      this.sim,
    );
    this.updateHud();
  }

  // ── Phases ────────────────────────────────────────────────────────────────

  private enterPhase(phase: Phase): void {
    this.phase = phase;
    this.selected = null;
    if (phase === 'investigate') {
      this.mainButton.setText('PLAN DEPLOYMENT  →');
      this.say(
        'INVESTIGATE: click a neighbourhood to inspect it. Press F to show flow direction.',
        6000,
      );
    } else if (phase === 'deploy') {
      this.mainButton.setText('RELEASE THE FLOW');
      this.say(
        'DEPLOY: drag equipment onto highlighted spots (or click a tool, then a spot).',
        6000,
      );
    } else if (phase === 'flow') {
      this.mainButton.setVisible(false);
      this.sim = createSim(this.level, this.dep);
      this.say('Here it comes… you can still place any equipment you have left.', 3500);
    }
    this.pauseButton.setVisible(phase === 'flow');
    this.speedButton.setVisible(phase === 'flow');
    this.refreshToolbar();
  }

  private onMainButton(): void {
    if (this.phase === 'investigate') this.enterPhase('deploy');
    else if (this.phase === 'deploy') this.enterPhase('flow');
  }

  private finish(): void {
    if (this.ended || !this.sim) return;
    this.ended = true;
    this.phase = 'results';
    const t = tally(this.sim.items);
    const used = Object.keys(this.dep).length;
    const total = this.level.inventory.bin + this.level.inventory.trap;
    this.time.delayedCall(700, () =>
      this.scene.start('Results', { levelId: this.level.id, tally: t, used, total }),
    );
  }

  // ── Placement ─────────────────────────────────────────────────────────────

  private canEdit(): boolean {
    return this.phase === 'deploy' || this.phase === 'flow';
  }

  private tryPlace(slotId: string, kind: EquipmentKind): void {
    const result = place(this.level, this.dep, this.phase, slotId, kind);
    if (!result.ok) return this.say(REJECT[result.reason]);
    if (this.sim) syncTraps(this.sim);
    this.map.syncEquipment(this.dep);
    if (remaining(this.level, this.dep, kind) === 0) this.selected = null;
    this.refreshToolbar();
  }

  private bindInput(): void {
    this.input.on(
      'pointerdown',
      (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
        if (over.length > 0 || p.y > this.scale.height - TOOLBAR_HEIGHT) return;
        const slot = this.map.slotAt(p.worldX, p.worldY);
        if (slot && this.dep[slot.id] && this.phase === 'deploy') {
          const kind = this.dep[slot.id]!;
          this.startDrag(kind, slot.id, p);
          return;
        }
        if (slot && this.selected && this.canEdit()) return this.tryPlace(slot.id, this.selected);
        if (slot && this.dep[slot.id] && this.phase === 'flow')
          return this.say(REJECT['wrong-phase']);
        const src = this.map.sourceAt(p.worldX, p.worldY);
        if (src) this.showInspect(src);
        else this.inspect.setVisible(false);
      },
    );

    this.input.on('pointermove', (p: Phaser.Input.Pointer) =>
      this.drag?.ghost.setPosition(p.worldX, p.worldY),
    );

    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      const d = this.drag;
      if (!d) return;
      this.drag = null;
      d.ghost.destroy();
      const target = this.map.slotAt(p.worldX, p.worldY);
      const moved = Math.hypot(p.worldX - d.startX, p.worldY - d.startY) > 8;
      if (d.from === null) {
        if (!moved) {
          this.selected = this.selected === d.kind ? null : d.kind;
          this.say(
            this.selected ? `${TOOL_NAMES[d.kind]}: ${TOOL_HELP[d.kind]}` : 'Tool deselected',
          );
        } else if (target) this.tryPlace(target.id, d.kind);
        else this.say(REJECT['no-slot']);
      } else if (target && target.id !== d.from) {
        const result = move(this.level, this.dep, this.phase, d.from, target.id);
        if (!result.ok) this.say(REJECT[result.reason]);
      } else if (!target) {
        remove(this.dep, this.phase, d.from);
        this.say(`${TOOL_NAMES[d.kind]} returned to inventory`);
      }
      this.map.syncEquipment(this.dep);
      this.refreshToolbar();
    });

    const kb = this.input.keyboard;
    kb?.on('keydown-ONE', () => this.selectTool('bin'));
    kb?.on('keydown-TWO', () => this.selectTool('trap'));
    kb?.on('keydown-ENTER', () => this.onMainButton());
    kb?.on('keydown-F', () => (this.map.showFlowArrows = !this.map.showFlowArrows));
    kb?.on('keydown-P', () => this.togglePause());
    kb?.on('keydown-SPACE', () => this.togglePause());
    kb?.on('keydown-X', () => this.toggleSpeed());
    kb?.on('keydown-R', () => this.scene.restart({ levelId: this.level.id }));
    kb?.on('keydown-ESC', () => {
      if (this.phase === 'flow') this.togglePause();
      else this.selected = null;
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      kb?.removeAllListeners();
      for (const evt of ['pointerdown', 'pointermove', 'pointerup']) this.input.off(evt);
    });
  }

  private startDrag(kind: EquipmentKind, from: string | null, p: Phaser.Input.Pointer): void {
    if (!this.canEdit()) return this.say('Inspect first, then press PLAN DEPLOYMENT');
    if (from === null && remaining(this.level, this.dep, kind) <= 0)
      return this.say(REJECT['none-left']);
    const ghost = this.add
      .image(p.worldX, p.worldY, kind)
      .setScale(PIXEL * 1.2)
      .setAlpha(0.8)
      .setDepth(60);
    this.drag = { kind, from, ghost, startX: p.worldX, startY: p.worldY };
  }

  private selectTool(kind: EquipmentKind): void {
    if (!this.canEdit()) return;
    if (remaining(this.level, this.dep, kind) <= 0) return this.say(REJECT['none-left']);
    this.selected = kind;
    this.say(`${TOOL_NAMES[kind]}: ${TOOL_HELP[kind]}`);
  }

  private togglePause(): void {
    if (this.phase !== 'flow') return;
    this.paused = !this.paused;
    this.pausedText.setVisible(this.paused);
    this.pauseButton.setText(this.paused ? 'RESUME' : 'PAUSE');
  }

  private toggleSpeed(): void {
    if (this.phase !== 'flow') return;
    this.fast = !this.fast;
    this.speedButton.setText(this.fast ? `SPEED ×${TUNING.sim.fastForward}` : 'SPEED ×1');
  }

  // ── HUD ───────────────────────────────────────────────────────────────────

  private buildTopBar(): void {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, 64, PALETTE.ink, 0.78).setOrigin(0).setDepth(40);
    this.header = this.add.text(16, 8, '', TEXT_STYLES.bodyLight).setDepth(41);
    this.status = this.add.text(16, 36, '', TEXT_STYLES.smallLight).setDepth(41);
    const barX = width - 420;
    this.add.rectangle(barX, 32, 300, 16, 0x000000, 0.5).setOrigin(0, 0.5).setDepth(41);
    this.progressFill = this.add
      .rectangle(barX, 32, 0, 16, PALETTE.accent)
      .setOrigin(0, 0.5)
      .setDepth(42);
    const tx = barX + 300 * this.level.target;
    this.add.rectangle(tx, 32, 3, 26, 0xffffff).setDepth(43);
    this.add
      .text(tx, 46, `goal ${Math.round(this.level.target * 100)}%`, TEXT_STYLES.label)
      .setOrigin(0.5, 0)
      .setDepth(43);
    this.toast = this.add
      .text(width / 2, height - TOOLBAR_HEIGHT - 28, '', TEXT_STYLES.smallLight)
      .setOrigin(0.5)
      .setDepth(45)
      .setBackgroundColor('#2d2a26dd')
      .setPadding(10, 5, 10, 5)
      .setVisible(false);
    this.inspect = this.add
      .text(0, 0, '', TEXT_STYLES.small)
      .setDepth(46)
      .setBackgroundColor('#f4ead2f0')
      .setPadding(10, 8, 10, 8)
      .setVisible(false);
    this.pausedText = this.add
      .text(width / 2, (height - TOOLBAR_HEIGHT) / 2, 'PAUSED\nP / Space to resume', {
        ...TEXT_STYLES.title,
        align: 'center',
        color: PALETTE.textLight,
      })
      .setOrigin(0.5)
      .setDepth(70)
      .setBackgroundColor('#2d2a26cc')
      .setPadding(24, 16, 24, 16)
      .setVisible(false);
  }

  private buildToolbar(): void {
    const { width, height } = this.scale;
    const y = height - TOOLBAR_HEIGHT / 2;
    this.add
      .rectangle(0, height - TOOLBAR_HEIGHT, width, TOOLBAR_HEIGHT, PALETTE.cream)
      .setOrigin(0)
      .setDepth(48);
    this.add
      .rectangle(0, height - TOOLBAR_HEIGHT, width, 4, PALETTE.creamDark)
      .setOrigin(0)
      .setDepth(49);

    (['bin', 'trap'] as const).forEach((kind, i) => {
      if (this.level.inventory[kind] <= 0) return;
      const x = 24 + i * 250;
      const bg = this.add
        .rectangle(x, y, 230, 76, PALETTE.creamDark)
        .setOrigin(0, 0.5)
        .setDepth(50)
        .setStrokeStyle(2, PALETTE.ink)
        .setInteractive({ useHandCursor: true });
      this.add
        .image(x + 36, y, kind)
        .setScale(PIXEL * 1.4)
        .setDepth(51)
        .setRotation(kind === 'trap' ? Math.PI / 2 : 0);
      const text = this.add
        .text(x + 70, y, '', TEXT_STYLES.small)
        .setOrigin(0, 0.5)
        .setDepth(51);
      bg.on('pointerdown', (p: Phaser.Input.Pointer) => this.startDrag(kind, null, p));
      this.toolCards.set(kind, { bg, text });
    });

    this.mainButton = new Button(
      this,
      width - 160,
      y,
      270,
      64,
      '',
      () => this.onMainButton(),
      PALETTE.warn,
    );
    this.pauseButton = new Button(this, width - 360, y, 110, 52, 'PAUSE', () => this.togglePause());
    this.speedButton = new Button(this, width - 490, y, 130, 52, 'SPEED ×1', () =>
      this.toggleSpeed(),
    );
    new Button(
      this,
      width - 600,
      y,
      80,
      52,
      'RESTART',
      () => this.scene.restart({ levelId: this.level.id }),
      PALETTE.ink,
    );
  }

  private refreshToolbar(): void {
    for (const [kind, card] of this.toolCards) {
      const left = remaining(this.level, this.dep, kind);
      const keyHint = kind === 'bin' ? '[1]' : '[2]';
      card.text.setText(`${TOOL_NAMES[kind]} ${keyHint}\n×${left} left`);
      const usable = left > 0 && this.canEdit();
      card.bg.setAlpha(usable ? 1 : 0.45);
      card.bg.setStrokeStyle(
        this.selected === kind ? 4 : 2,
        this.selected === kind ? PALETTE.warn : PALETTE.ink,
      );
    }
  }

  private updateHud(): void {
    const phaseName = {
      investigate: 'INVESTIGATE',
      deploy: 'DEPLOY',
      flow: 'FLOW',
      results: 'FLOW',
    }[this.phase];
    this.header.setText(
      `LEVEL ${this.level.number} · ${this.level.name.toUpperCase()}    ${phaseName}`,
    );
    if (this.sim) {
      const t = tally(this.sim.items);
      const perf = performance(t);
      const left = Math.max(0, this.level.durationSeconds - this.sim.time);
      this.status.setText(
        `Kept from the ocean: ${Math.round(perf * 100)}%    Reached the ocean: ${t.escaped}    Time left: ${Math.ceil(left)}s`,
      );
      this.progressFill.width = 300 * perf;
    } else {
      this.status.setText(
        `Goal: keep at least ${Math.round(this.level.target * 100)}% of litter out of the ocean.  ${this.level.intro}`,
      );
      this.progressFill.width = 0;
    }
    this.refreshToolbar();
    if (this.time.now > this.toastUntil) this.toast.setVisible(false);
  }

  private say(message: string, ms = 2200): void {
    this.toast.setText(message).setVisible(true);
    this.toastUntil = this.time.now + ms;
  }

  /** Investigation: qualitative information only (no exact rates), so players reason rather than calculate. */
  private showInspect(src: PollutionSource): void {
    const level = src.rate >= 0.6 ? 'High' : src.rate >= 0.4 ? 'Medium' : 'Low';
    const seg = this.level.segments.find((s) => s.id === src.entry.segmentId);
    const frac = seg ? src.entry.s / segmentLength(seg) : 0;
    const where = frac < 0.33 ? 'upstream' : frac < 0.75 ? 'mid-creek' : 'close to the ocean';
    this.inspect
      .setText(`${src.label}\nLitter: ${level}\nDrains into the creek ${where}`)
      .setPosition(Math.min(src.pos.x + 40, this.scale.width - 300), Math.max(src.pos.y - 30, 70))
      .setVisible(true);
  }
}
