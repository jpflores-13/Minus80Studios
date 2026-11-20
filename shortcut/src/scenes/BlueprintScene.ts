import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import { TUNING } from '../config/tuning';
import { term, type View } from '../content/terms';
import {
  BLUEPRINT_TOWN,
  BLUEPRINTS,
  PLAYER_SEED,
  SECONDS,
  TARGET_SEED,
  type Blueprint,
  type Knob,
} from '../levels/blueprints';
import { drawHeatmap, drawHistogram } from '../render/charts';
import { RoadView } from '../render/RoadView';
import {
  contactMap,
  difference,
  lengthDistribution,
  similarity,
  type ContactMap,
} from '../systems/contacts';
import { checkpoint, measure, type Layout, type Overrides } from '../systems/run';
import { announce } from '../ui/announce';
import { FocusButton, FocusList, Stepper, type Focusable } from '../ui/Controls';
import { SCI } from '../ui/scienceArt';
import { TEXT_STYLES } from '../ui/text';

const MAP = 200;

// Blueprint: a target connectivity map made by a hidden city. Rebuild a city whose map matches.
export class BlueprintScene extends Phaser.Scene {
  private bp!: Blueprint;
  private index = 0;
  private v: View = 'city';
  private road!: RoadView;
  private layout: Layout = { depots: [], checkpoints: [] };
  private overrides: Overrides = {};
  private target!: ContactMap;
  private targetLengths: number[] = [];
  private results: Phaser.GameObjects.GameObject[] = [];
  private cursor = 15;
  private tool: 'depot' | 'checkpoint' = 'depot';
  private clue = 0;
  private info!: Phaser.GameObjects.Text;
  private focus = new FocusList();
  private toolButtons: FocusButton[] = [];

  constructor() {
    super('Blueprint');
  }

  create(data: { index?: number }): void {
    this.index = data.index ?? 0;
    this.bp = BLUEPRINTS[this.index] ?? (BLUEPRINTS[0] as Blueprint);
    this.v = progress().scienceMode ? 'science' : 'city';
    this.layout = cloneLayout(this.bp.start.layout);
    this.overrides = {
      ...this.bp.start.overrides,
      engine: { ...this.bp.start.overrides.engine },
    };
    this.results = [];
    this.cursor = 15;
    this.tool =
      this.bp.tools.depots > 0 && this.layout.depots.length === 0 ? 'depot' : 'checkpoint';
    this.clue = 0;
    this.focus = new FocusList();
    this.toolButtons = [];

    const hidden = measure(
      BLUEPRINT_TOWN,
      this.bp.hidden.layout,
      TARGET_SEED,
      SECONDS,
      this.bp.hidden.overrides,
    );
    this.target = contactMap(hidden.engine);
    this.targetLengths = lengthDistribution(hidden.engine);

    const dark = this.v === 'science';
    const ink = dark ? SCI.text : PALETTE.text;
    const { width } = this.scale;
    this.cameras.main.setBackgroundColor(dark ? SCI.bg : PALETTE.sky);
    this.add
      .rectangle(0, 0, width, 84, dark ? SCI.panel : PALETTE.cream)
      .setOrigin(0)
      .setDepth(20);
    this.add
      .text(24, 10, `BLUEPRINT ${this.index + 1}/${BLUEPRINTS.length} · ${this.bp.name}`, {
        ...TEXT_STYLES.title,
        fontSize: '28px',
        color: ink,
      })
      .setDepth(21);
    this.info = this.add
      .text(24, 50, this.bp.brief, {
        ...TEXT_STYLES.small,
        fontSize: '15px',
        color: ink,
        wordWrap: { width: 1230 },
      })
      .setDepth(21);

    this.road = new RoadView(this, BLUEPRINT_TOWN, this.v, {
      x0: 70,
      x1: 1210,
      roadY: 250,
      maxRise: 130,
      top: 92,
      bottom: 300,
    });
    const zone = this.add.zone(70, 92, 1140, 210).setOrigin(0).setInteractive().setDepth(15);
    zone.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!p.wasTouch) this.cursor = this.road.binAt(p.worldX);
    });
    zone.on('pointerup', (p: Phaser.Input.Pointer) => {
      this.cursor = this.road.binAt(p.worldX);
      this.actAt(this.cursor);
    });

    drawHeatmap(this, this.target, 70, 350, MAP, {
      title: 'Target',
      note: 'made by the hidden city',
      dark,
    });

    this.buildControls();
    this.simulate(false);
    const kb = this.input.keyboard;
    kb?.on('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') return this.scene.start('Modes');
      if (this.focus.handle(e)) return;
      const k = e.key.toLowerCase();
      if (k === 's') this.simulate(true);
      else if (k === 'c') this.nextClue();
      else if (k === '1') this.setTool('depot');
      else if (k === '2') this.setTool('checkpoint');
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => kb?.removeAllListeners());
    announce(
      `Blueprint ${this.index + 1}: ${this.bp.name}. ${this.bp.brief} Tab moves between the road and the controls. S simulates, C gives a clue.`,
    );
  }

  private buildControls(): void {
    const dark = this.v === 'science';
    const row1 = 618;
    const row2 = 678;
    const btn = (
      x: number,
      y: number,
      w: number,
      label: () => string,
      fn: () => void,
      color?: number,
      help = '',
    ) => {
      const b = new FocusButton(this, x + w / 2, y, w, 48, label, fn, color, help);
      this.focus.add(b);
      return b;
    };
    const road: Focusable = {
      describe: () => `Road. ${this.describeBin()}`,
      activate: () => this.actAt(this.cursor),
      adjust: (dir, big) => {
        this.cursor = Phaser.Math.Clamp(
          this.cursor + dir * (big ? 5 : 1),
          0,
          BLUEPRINT_TOWN.bins - 1,
        );
        announce(this.describeBin());
      },
      setFocus: () => undefined,
    };
    this.focus.add(road);
    let x = 20;
    if (this.bp.tools.depots > 0) {
      this.toolButtons.push(
        btn(
          x,
          row1,
          210,
          () =>
            `${this.tool === 'depot' ? '▸ ' : ''}${term('depot', this.v).toUpperCase()} (${this.bp.tools.depots - this.layout.depots.length})`,
          () => this.setTool('depot'),
        ),
      );
      x += 220;
    }
    if (this.bp.tools.checkpoints > 0) {
      this.toolButtons.push(
        btn(
          x,
          row1,
          240,
          () =>
            `${this.tool === 'checkpoint' ? '▸ ' : ''}${term('checkpoint', this.v).toUpperCase()} (${this.bp.tools.checkpoints - this.layout.checkpoints.length})`,
          () => this.setTool('checkpoint'),
        ),
      );
      x += 250;
    }
    const knobs: Record<Knob, [string, () => string, (d: -1 | 1) => void]> = {
      lifetime: [
        'Lifetime (s)',
        () => String(this.engine().lifetimeMean ?? 20),
        (d) =>
          (this.engine().lifetimeMean = clamp((this.engine().lifetimeMean ?? 20) + d * 4, 4, 120)),
      ],
      fleet: [
        `${term('fleet', this.v)}`,
        () => String(this.engine().fleet ?? 4),
        (d) => (this.engine().fleet = clamp((this.engine().fleet ?? 4) + d, 1, 10)),
      ],
      reliability: [
        `${term('checkpoint', this.v)} hold`,
        () => `${Math.round((this.overrides.reliability ?? TUNING.checkpointReliability) * 100)}%`,
        (d) =>
          (this.overrides.reliability = clamp(
            (this.overrides.reliability ?? TUNING.checkpointReliability) + d * 0.1,
            0,
            1,
          )),
      ],
    };
    let kx = 20;
    for (const k of this.bp.knobs) {
      const [label, value, change] = knobs[k];
      const s = new Stepper(this, kx, row2, 250, label, value, (d) => change(d), '', dark);
      this.focus.add(s);
      kx += 260;
    }
    btn(
      Math.max(x, kx > 20 ? 800 : x),
      row1,
      200,
      () => 'SIMULATE (S)',
      () => this.simulate(true),
      PALETTE.goldDark,
      'Run the city and compare its map with the target.',
    );
    btn(
      1030,
      row1,
      230,
      () => 'CLUE (C)',
      () => this.nextClue(),
    );
    btn(
      800,
      row2,
      150,
      () => '◀ PREV',
      () => this.scene.restart({ index: (this.index - 1 + BLUEPRINTS.length) % BLUEPRINTS.length }),
    );
    btn(
      960,
      row2,
      150,
      () => 'NEXT ▶',
      () => this.scene.restart({ index: (this.index + 1) % BLUEPRINTS.length }),
    );
    btn(
      1120,
      row2,
      140,
      () => 'MENU',
      () => this.scene.start('Modes'),
    );
    this.focus.focus(0);
  }

  private engine() {
    this.overrides.engine ??= {};
    return this.overrides.engine;
  }

  private setTool(tool: 'depot' | 'checkpoint'): void {
    this.tool = tool;
    for (const b of this.toolButtons) b.refresh();
  }

  private describeBin(): string {
    const bin = this.cursor;
    const parts = [`${term('address', this.v)} ${bin + 1} of ${BLUEPRINT_TOWN.bins}`];
    if (this.layout.depots.includes(bin)) parts.push(term('depot', this.v));
    const cp = this.layout.checkpoints.find((c) => c.bin === bin);
    if (cp)
      parts.push(`${term('checkpoint', this.v)} facing ${cp.facing === 1 ? 'right' : 'left'}`);
    return parts.join(', ') + '.';
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
    } else if (this.tool === 'depot' && this.layout.depots.length < this.bp.tools.depots) {
      this.layout.depots.push(bin);
      sound.play('place');
    } else if (this.layout.checkpoints.length < this.bp.tools.checkpoints) {
      this.layout.checkpoints.push(checkpoint(bin, 1));
      sound.play('place');
    } else if (this.layout.depots.length < this.bp.tools.depots) {
      this.layout.depots.push(bin);
      sound.play('place');
    } else {
      sound.play('deny');
      announce('Nothing left to place. Tap something to turn it or pick it up.');
      return;
    }
    for (const b of this.toolButtons) b.refresh();
    announce(this.describeBin());
  }

  private nextClue(): void {
    const c = this.bp.clues[this.clue];
    if (!c) return;
    this.clue = Math.min(this.clue + 1, this.bp.clues.length - 1);
    this.info.setText(`Clue: ${c}`);
    announce(`Clue: ${c}`);
  }

  private simulate(speak: boolean): void {
    for (const o of this.results) o.destroy();
    this.results = [];
    const dark = this.v === 'science';
    const run = measure(BLUEPRINT_TOWN, this.layout, PLAYER_SEED, SECONDS, this.overrides);
    const mine = contactMap(run.engine);
    const score = this.layout.depots.length ? similarity(this.target, mine) : 0;
    this.results.push(
      drawHeatmap(this, mine, 330, 350, MAP, { title: 'Your city', dark }),
      drawHeatmap(this, difference(this.target, mine), 590, 350, MAP, {
        title: 'Difference',
        note: 'orange = you have more, blue = less',
        scale: 'diverging',
        dark,
      }),
      drawHistogram(
        this,
        lengthDistribution(run.engine),
        860,
        400,
        380,
        90,
        'Lengths: bars = yours, line = target',
        this.targetLengths,
        dark,
      ),
    );
    const solved = score >= this.bp.pass;
    if (solved) {
      const best = progress().blueprints;
      saveProgress({
        blueprints: { ...best, [this.bp.id]: Math.max(score, best[this.bp.id] ?? 0) },
      });
    }
    const verdict = this.add
      .text(
        1050,
        540,
        `Similarity ${score} / 100\n${solved ? 'Matched ✓' : `Need ${this.bp.pass}`}`,
        {
          ...TEXT_STYLES.body,
          align: 'center',
          fontStyle: 'bold',
          color: dark ? SCI.text : PALETTE.text,
        },
      )
      .setOrigin(0.5);
    this.results.push(verdict);
    if (solved) this.info.setText(this.bp.lesson);
    if (speak) {
      sound.play(solved ? 'win' : 'click');
      announce(
        `Similarity ${score} out of 100. ${solved ? `Matched. ${this.bp.lesson}` : `You need ${this.bp.pass}.`}`,
      );
    }
  }

  override update(): void {
    // keep equipment and the cursor current between simulations
    this.road.draw({
      layout: this.layout,
      run: null,
      cityParams: TUNING.city,
      cursor: this.cursor,
      parcels: [],
      flashes: new Map(),
    });
  }
}

function clamp(x: number, a: number, b: number): number {
  return Math.round(Math.min(b, Math.max(a, x)) * 100) / 100;
}

function cloneLayout(l: Layout): Layout {
  return { depots: [...l.depots], checkpoints: l.checkpoints.map((c) => ({ ...c })) };
}
