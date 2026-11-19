import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE, PIXEL, TOOLBAR_HEIGHT } from '../config/gameConfig';
import { TUNING } from '../config/tuning';
import { MapView } from '../entities/MapView';
import { getLevel } from '../levels';
import {
  EQUIPMENT_ORDER,
  type EquipmentKind,
  type LevelConfig,
  type PollutionSource,
} from '../levels/types';
import {
  isSlotKind,
  move,
  place,
  remaining,
  remove,
  rotateBoom,
  type ActionsUsed,
  type Deployment,
  type Orientations,
  type Phase,
  type PlaceResult,
} from '../systems/equipment';
import { scout } from '../systems/gps';
import { segmentLength } from '../systems/network';
import { performance, tally } from '../systems/score';
import { advance, cleanup, createSim, syncEquipment, type SimState } from '../systems/sim';
import { forecast, INTENSITY_LABEL } from '../systems/weather';
import { Button } from '../ui/Button';
import { TEXT_STYLES } from '../ui/text';

const NAMES: Record<EquipmentKind, string> = {
  gps: 'GPS bottle',
  bin: 'Trash bin',
  filter: 'Drain filter',
  trap: 'Trash trap',
  boom: 'Floating boom',
  cleanup: 'Cleanup crew',
};

const HELP: Record<EquipmentKind, string> = {
  gps: 'Click a neighbourhood to release a tracked research bottle and watch where it goes.',
  bin: 'Prevent: place by a neighbourhood to cut its litter.',
  filter: 'Filter: place on a storm drain to catch litter before it reaches the water.',
  trap: 'Intercept: place across the water. Holds a limited amount.',
  boom: 'Redirect: steers floating litter toward one bank. Click it to flip direction.',
  cleanup: 'During the flow: click a full trap, a filter, or a snag to clear it.',
};

const REJECT: Record<Exclude<PlaceResult, { ok: true }>['reason'], string> = {
  'wrong-phase': 'Placed equipment is locked once the flow is released.',
  'no-slot': 'Drop equipment on a highlighted spot.',
  'wrong-kind': 'That spot needs a different piece of equipment.',
  occupied: 'Something is already there.',
  'none-left': 'None left.',
};

interface Drag {
  kind: EquipmentKind;
  from: string | null;
  ghost: Phaser.GameObjects.Image;
  startX: number;
  startY: number;
}

// One watershed: INVESTIGATE -> DEPLOY -> FLOW -> results.
// Rules live in src/systems; this scene handles input and drawing.
export class LevelScene extends Phaser.Scene {
  private level!: LevelConfig;
  private dep: Deployment = {};
  private orient: Orientations = {};
  private used: ActionsUsed = {};
  private phase: Phase = 'investigate';
  private sim: SimState | undefined;
  private map!: MapView;
  private selected: EquipmentKind | null = null;
  private drag: Drag | null = null;
  private paused = false;
  private fast = false;
  private ended = false;
  private briefing: Phaser.GameObjects.Container | null = null;

  private header!: Phaser.GameObjects.Text;
  private status!: Phaser.GameObjects.Text;
  private weatherText!: Phaser.GameObjects.Text;
  private progressFill!: Phaser.GameObjects.Rectangle;
  private toast!: Phaser.GameObjects.Text;
  private toastUntil = 0;
  private inspect!: Phaser.GameObjects.Text;
  private pausedText!: Phaser.GameObjects.Text;
  private cards = new Map<
    EquipmentKind,
    { bg: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text; key: string }
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
    this.orient = {};
    this.used = {};
    this.phase = 'investigate';
    this.sim = undefined;
    this.selected = null;
    this.drag = null;
    this.paused = false;
    this.fast = false;
    this.ended = false;
    this.cards.clear();

    this.map = new MapView(this, this.level);
    this.buildTopBar();
    this.buildToolbar();
    this.bindInput();
    this.enterPhase('investigate');
    this.showBriefing();
    this.cameras.main.fadeIn(400);
    sound.unlock();
    sound.startAmbience();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => sound.stopAmbience());

    if (import.meta.env.DEV) {
      void import('../debug/DebugPanel').then(({ DebugPanel }) =>
        DebugPanel.attach(this, () => ({ sim: this.sim, map: this.map, level: this.level })),
      );
    }
  }

  override update(time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, 0.1);
    if (this.sim && this.phase === 'flow' && !this.paused) {
      for (const e of advance(this.sim, dt * (this.fast ? TUNING.sim.fastForward : 1))) {
        if (e.type === 'intercepted') sound.play('catch');
        if (e.type === 'full') {
          sound.play('full');
          this.say(
            `${e.slotId.startsWith('filter') ? 'A drain filter' : 'A trash trap'} is full. Litter now gets past it.`,
          );
        }
        if (e.type === 'weather') {
          sound.setRain({ dry: 0, light: 1, moderate: 2, heavy: 3 }[e.conditions]);
          this.say(
            e.conditions === 'dry' ? 'The rain has stopped.' : `${INTENSITY_LABEL[e.conditions]}!`,
          );
        }
        if (e.type === 'done') this.finish();
      }
    }
    const highlight = this.drag?.kind ?? this.selected;
    const editing = this.phase === 'deploy' || this.phase === 'flow';
    this.map.update(
      time,
      dt,
      this.dep,
      this.orient,
      editing ? highlight : null,
      this.sim,
      this.sim?.conditions ?? 'dry',
    );
    this.updateHud();
  }

  // Phases

  private enterPhase(phase: Phase): void {
    this.phase = phase;
    this.selected = null;
    if (phase === 'investigate') {
      this.mainButton.setText('PLAN DEPLOYMENT  →');
      if ((this.level.inventory.gps ?? 0) > 0) this.selected = 'gps';
    } else if (phase === 'deploy') {
      this.mainButton.setText('RELEASE THE FLOW');
      this.say('Drag equipment onto highlighted spots, or click a tool and then a spot.', 5000);
    } else if (phase === 'flow') {
      this.mainButton.setVisible(false);
      this.sim = createSim(this.level, this.dep, { orientations: this.orient });
      this.sim.used = this.used;
      this.say('Here it comes. You can still place anything you have left.', 3500);
    }
    this.pauseButton.setVisible(phase === 'flow');
    this.speedButton.setVisible(phase === 'flow');
    this.refreshToolbar();
  }

  private onMainButton(): void {
    if (this.briefing) return this.closeBriefing();
    sound.play('click');
    if (this.phase === 'investigate') this.enterPhase('deploy');
    else if (this.phase === 'deploy') this.enterPhase('flow');
  }

  private finish(): void {
    if (this.ended || !this.sim) return;
    this.ended = true;
    this.phase = 'results';
    const t = tally(this.sim.items);
    const placed = Object.keys(this.dep).length + (this.used.gps ?? 0) + (this.used.cleanup ?? 0);
    const total = Object.values(this.level.inventory).reduce((a, b) => a + (b ?? 0), 0);
    this.time.delayedCall(700, () =>
      this.scene.start('Results', { levelId: this.level.id, tally: t, used: placed, total }),
    );
  }

  // Equipment

  private tryPlace(slotId: string, kind: EquipmentKind): void {
    if (!isSlotKind(kind)) return;
    const result = place(this.level, this.dep, this.phase, slotId, kind);
    if (!result.ok) {
      sound.play('deny');
      return this.say(REJECT[result.reason]);
    }
    sound.play('place');
    if (this.sim) syncEquipment(this.sim);
    this.map.syncEquipment(this.dep, this.orient);
    if (remaining(this.level, this.dep, kind) === 0) this.selected = null;
    this.refreshToolbar();
  }

  private releaseGps(src: PollutionSource): void {
    if (this.phase !== 'investigate' && this.phase !== 'deploy')
      return this.say('GPS bottles are for scouting before the flow.');
    if (remaining(this.level, this.dep, 'gps', this.used) <= 0)
      return this.say('No GPS bottles left.');
    this.used.gps = (this.used.gps ?? 0) + 1;
    const track = scout(this.level, src.id, this.level.seed * 31 + this.used.gps);
    this.map.addTrack(track);
    sound.play('gps');
    const where =
      track.outcome === 'ocean'
        ? 'It reached the ocean.'
        : track.outcome === 'snagged'
          ? 'It got stuck on the bank.'
          : 'It was still travelling when the battery ran out.';
    const stops =
      track.stops.length > 0 ? ` It was held up ${track.stops.length} time(s) on the way.` : '';
    this.say(`Bottle released from ${src.label}. ${where}${stops}`, 5000);
    this.refreshToolbar();
  }

  private useCleanup(x: number, y: number): boolean {
    if (!this.sim || this.phase !== 'flow') {
      this.say('Cleanup crews work during the flow.');
      return true;
    }
    const slot = this.map.slotAt(x, y);
    const hotspot = this.map.hotspotAt(x, y);
    let removed: number | null;
    let at: { x: number; y: number };
    if (slot && (this.dep[slot.id] === 'trap' || this.dep[slot.id] === 'filter')) {
      removed = cleanup(this.sim, { kind: 'container', slotId: slot.id });
      at = this.map.containerPosition(slot.id);
    } else if (hotspot) {
      removed = cleanup(this.sim, { kind: 'hotspot', hotspotId: hotspot.id });
      at = this.map.hotspotCenter(hotspot);
    } else {
      return false;
    }
    if (removed === null) {
      sound.play('deny');
      this.say('No cleanup crews left.');
    } else {
      sound.play('cleanup');
      this.map.showCrew(at.x, at.y);
      this.say(
        removed > 0
          ? `Crew hauled away ${removed} pieces of litter.`
          : 'Nothing to clear there yet.',
      );
      this.used = this.sim.used;
      if (remaining(this.level, this.dep, 'cleanup', this.used) <= 0) this.selected = null;
    }
    this.refreshToolbar();
    return true;
  }

  private bindInput(): void {
    this.input.on(
      'pointerdown',
      (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
        sound.unlock();
        if (this.briefing) return this.closeBriefing();
        if (over.length > 0 || p.y > this.scale.height - TOOLBAR_HEIGHT) return;
        const x = p.worldX;
        const y = p.worldY;
        if (this.selected === 'cleanup' && this.useCleanup(x, y)) return;
        const slot = this.map.slotAt(x, y);
        if (slot && this.dep[slot.id] && this.phase === 'deploy') {
          this.startDrag(this.dep[slot.id]!, slot.id, p);
          return;
        }
        if (
          slot &&
          this.selected &&
          isSlotKind(this.selected) &&
          (this.phase === 'deploy' || this.phase === 'flow')
        ) {
          return this.tryPlace(slot.id, this.selected);
        }
        if (slot && this.dep[slot.id] && this.phase === 'flow')
          return this.say(REJECT['wrong-phase']);
        const src = this.map.sourceAt(x, y);
        if (src && this.selected === 'gps') return this.releaseGps(src);
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
        if (!moved) this.select(d.kind);
        else if (target) this.tryPlace(target.id, d.kind);
        else this.say(REJECT['no-slot']);
      } else if (!moved) {
        // a click (not a drag) on a placed boom flips it
        if (rotateBoom(this.dep, this.orient, this.phase, d.from)) {
          sound.play('click');
          this.say('Boom turned around.');
        }
      } else if (target && target.id !== d.from) {
        const r = move(this.level, this.dep, this.phase, d.from, target.id);
        if (!r.ok) this.say(REJECT[r.reason]);
        else sound.play('place');
      } else if (!target) {
        remove(this.dep, this.phase, d.from);
        delete this.orient[d.from];
        sound.play('pickup');
        this.say(`${NAMES[d.kind]} back in your kit.`);
      }
      this.map.syncEquipment(this.dep, this.orient);
      this.refreshToolbar();
    });

    const kb = this.input.keyboard;
    ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX'].forEach((key, i) =>
      kb?.on(`keydown-${key}`, () => {
        const kind = [...this.cards.keys()][i];
        if (kind) this.select(kind);
      }),
    );
    kb?.on('keydown-ENTER', () => this.onMainButton());
    kb?.on('keydown-F', () => (this.map.showFlowArrows = !this.map.showFlowArrows));
    kb?.on('keydown-G', () => (this.map.showTrails = !this.map.showTrails));
    kb?.on('keydown-P', () => this.togglePause());
    kb?.on('keydown-SPACE', () => this.togglePause());
    kb?.on('keydown-X', () => this.toggleSpeed());
    kb?.on('keydown-R', () => this.scene.restart({ levelId: this.level.id }));
    kb?.on('keydown-M', () => this.say(sound.toggleMute() ? 'Sound off' : 'Sound on'));
    kb?.on('keydown-ESC', () => {
      if (this.phase === 'flow') this.togglePause();
      else this.selected = null;
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      kb?.removeAllListeners();
      for (const evt of ['pointerdown', 'pointermove', 'pointerup']) this.input.off(evt);
    });
  }

  private canUse(kind: EquipmentKind): string | null {
    if (remaining(this.level, this.dep, kind, this.used) <= 0) return 'None left.';
    if (kind === 'gps' && this.phase !== 'investigate' && this.phase !== 'deploy')
      return 'GPS bottles are for scouting before the flow.';
    if (kind === 'cleanup' && this.phase !== 'flow') return 'Cleanup crews work during the flow.';
    if (isSlotKind(kind) && this.phase === 'investigate')
      return 'Scout first, then press PLAN DEPLOYMENT.';
    if (this.phase === 'results') return 'The level is over.';
    return null;
  }

  private select(kind: EquipmentKind): void {
    const problem = this.canUse(kind);
    if (problem) {
      sound.play('deny');
      return this.say(problem);
    }
    this.selected = this.selected === kind ? null : kind;
    sound.play('click');
    if (this.selected) this.say(`${NAMES[kind]}: ${HELP[kind]}`, 3500);
    this.refreshToolbar();
  }

  private startDrag(kind: EquipmentKind, from: string | null, p: Phaser.Input.Pointer): void {
    const problem = from === null ? this.canUse(kind) : null;
    if (problem) {
      sound.play('deny');
      return this.say(problem);
    }
    if (!isSlotKind(kind)) return this.select(kind);
    const ghost = this.add
      .image(p.worldX, p.worldY, kind)
      .setScale(PIXEL * 1.2)
      .setAlpha(0.8)
      .setDepth(60);
    this.drag = { kind, from, ghost, startX: p.worldX, startY: p.worldY };
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

  // Briefing

  private showBriefing(): void {
    const { width, height } = this.scale;
    const panel = this.add.container(width / 2, (height - TOOLBAR_HEIGHT) / 2).setDepth(80);
    const kit = [...this.cards.keys()]
      .map((k) => `${NAMES[k]} ×${this.level.inventory[k]}`)
      .join('   ');
    const lines = [
      `LEVEL ${this.level.number}: ${this.level.name.toUpperCase()}`,
      '',
      this.level.intro,
      '',
      ...this.level.teaches.map((t) => `•  ${t}`),
      '',
      `Your kit: ${kit}`,
      `Goal: keep at least ${Math.round(this.level.target * 100)}% of the litter out of the ocean.`,
      this.forecastSummary(),
      '',
      'Click or press ENTER to start scouting',
    ];
    const text = this.add
      .text(0, 0, lines.join('\n'), {
        ...TEXT_STYLES.body,
        align: 'center',
        lineSpacing: 6,
        wordWrap: { width: 760 },
      })
      .setOrigin(0.5);
    const bg = this.add
      .rectangle(0, 0, text.width + 60, text.height + 50, PALETTE.cream, 0.97)
      .setStrokeStyle(3, PALETTE.ink);
    panel.add([bg, text]);
    this.briefing = panel;
  }

  private closeBriefing(): void {
    this.briefing?.destroy();
    this.briefing = null;
    sound.play('click');
    if (this.selected === 'gps')
      this.say(
        'Pick a neighbourhood to release a GPS research bottle and see where its litter goes.',
        6000,
      );
    else
      this.say(
        'Click a neighbourhood to inspect it. Press F to show which way the water flows.',
        5000,
      );
  }

  private forecastSummary(): string {
    if (this.level.weather.length === 0) return 'Forecast: dry all day.';
    const parts = this.level.weather.map(
      (w) => `${INTENSITY_LABEL[w.intensity].toLowerCase()} at ${clock(w.at)}`,
    );
    return `Forecast: ${parts.join(', then ')}.`;
  }

  // HUD

  private buildTopBar(): void {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, 64, PALETTE.ink, 0.8).setOrigin(0).setDepth(40);
    this.header = this.add.text(16, 8, '', TEXT_STYLES.bodyLight).setDepth(41);
    this.status = this.add.text(16, 36, '', TEXT_STYLES.smallLight).setDepth(41);
    this.weatherText = this.add.text(width - 560, 8, '', TEXT_STYLES.smallLight).setDepth(41);
    const barX = width - 430;
    this.add.rectangle(barX, 44, 300, 14, 0x000000, 0.5).setOrigin(0, 0.5).setDepth(41);
    this.progressFill = this.add
      .rectangle(barX, 44, 0, 14, PALETTE.accent)
      .setOrigin(0, 0.5)
      .setDepth(42);
    const tx = barX + 300 * this.level.target;
    this.add.rectangle(tx, 44, 3, 22, 0xffffff).setDepth(43);
    this.add
      .text(tx + 4, 30, `goal ${Math.round(this.level.target * 100)}%`, {
        ...TEXT_STYLES.label,
        fontSize: '12px',
      })
      .setDepth(43);
    new Button(this, width - 52, 32, 84, 40, 'HOME', () => this.scene.start('Title'), PALETTE.ink);
    this.toast = this.add
      .text(width / 2, height - TOOLBAR_HEIGHT - 28, '', {
        ...TEXT_STYLES.smallLight,
        align: 'center',
        wordWrap: { width: 900 },
      })
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
      .text(width / 2, (height - TOOLBAR_HEIGHT) / 2, 'PAUSED\nP or Space to resume', {
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

    const kinds = EQUIPMENT_ORDER.filter((k) => (this.level.inventory[k] ?? 0) > 0);
    const cardW = kinds.length > 4 ? 110 : 150;
    kinds.forEach((kind, i) => {
      const x = 12 + i * (cardW + 4);
      const bg = this.add
        .rectangle(x, y, cardW, 80, PALETTE.creamDark)
        .setOrigin(0, 0.5)
        .setDepth(50)
        .setStrokeStyle(2, PALETTE.ink)
        .setInteractive({ useHandCursor: true });
      this.add
        .image(x + 22, y - 12, kind)
        .setScale(PIXEL * 1.2)
        .setDepth(51)
        .setRotation(kind === 'trap' ? Math.PI / 2 : 0);
      const text = this.add
        .text(x + 6, y + 6, '', { ...TEXT_STYLES.small, fontSize: '14px' })
        .setDepth(51);
      bg.on('pointerdown', (p: Phaser.Input.Pointer) => {
        sound.unlock();
        this.startDrag(kind, null, p);
      });
      this.cards.set(kind, { bg, text, key: String(i + 1) });
    });

    this.mainButton = new Button(
      this,
      width - 125,
      y,
      220,
      64,
      '',
      () => this.onMainButton(),
      PALETTE.warn,
    );
    this.pauseButton = new Button(this, width - 300, y, 96, 52, 'PAUSE', () => this.togglePause());
    this.speedButton = new Button(this, width - 415, y, 110, 52, 'SPEED ×1', () =>
      this.toggleSpeed(),
    );
    new Button(
      this,
      width - 525,
      y,
      96,
      52,
      'RESTART',
      () => this.scene.restart({ levelId: this.level.id }),
      PALETTE.ink,
    );
  }

  private refreshToolbar(): void {
    for (const [kind, card] of this.cards) {
      const left = remaining(this.level, this.dep, kind, this.used);
      card.text.setText(`[${card.key}] ${NAMES[kind]}\n×${left} left`);
      const usable = left > 0 && this.canUse(kind) === null;
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
    const t = this.sim?.time ?? 0;
    const now = this.sim ? INTENSITY_LABEL[this.sim.conditions] : 'Dry';
    const next = forecast(this.level, t);
    const ahead =
      next && next.inSeconds > 0
        ? `   ·   ${INTENSITY_LABEL[next.intensity]} in ${Math.ceil(next.inSeconds)}s`
        : '';
    this.weatherText.setText(this.sim ? `Weather: ${now}${ahead}` : this.forecastSummary());
    if (this.sim) {
      const tl = tally(this.sim.items);
      const left = Math.max(0, this.level.durationSeconds - this.sim.time);
      this.status.setText(
        `Kept from the ocean: ${Math.round(performance(tl) * 100)}%    Reached the ocean: ${tl.escaped}    Time left: ${Math.ceil(left)}s`,
      );
      this.progressFill.width = 300 * performance(tl);
    } else {
      this.status.setText(
        this.phase === 'investigate'
          ? 'Scout the watershed: inspect neighbourhoods and release GPS bottles.'
          : 'Place your equipment, then release the flow.',
      );
      this.progressFill.width = 0;
    }
    if (this.time.now > this.toastUntil) this.toast.setVisible(false);
  }

  private say(message: string, ms = 2400): void {
    this.toast.setText(message).setVisible(true);
    this.toastUntil = this.time.now + ms;
  }

  // Qualitative info only, so players reason about it rather than calculate.
  private showInspect(src: PollutionSource): void {
    const amount = src.rate >= 0.55 ? 'High' : src.rate >= 0.4 ? 'Medium' : 'Low';
    const rain =
      src.runoffResponse >= 0.85
        ? 'a lot (paved)'
        : src.runoffResponse >= 0.55
          ? 'somewhat'
          : 'a little';
    const seg = this.level.segments.find((s) => s.id === src.entry.segmentId);
    const frac = seg ? src.entry.s / segmentLength(seg) : 0;
    const where =
      seg?.downstream === null && frac > 0.6
        ? 'close to the ocean'
        : frac < 0.33
          ? 'upstream'
          : 'mid-stream';
    this.inspect
      .setText(
        `${src.label}\nLitter: ${amount}\nRain makes it worse: ${rain}\nDrains into the water ${where}`,
      )
      .setPosition(Math.min(src.pos.x + 40, this.scale.width - 320), Math.max(src.pos.y - 30, 70))
      .setVisible(true);
  }
}

function clock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}
