import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import { TUNING } from '../config/tuning';
import { MAPPING, PAGES } from '../content/reveal';
import { getLevel } from '../levels';
import { RoadView } from '../render/RoadView';
import { checkpoint, startRun, stepRun, type Layout, type Run } from '../systems/run';
import { announce } from '../ui/announce';
import { Button } from '../ui/Button';
import { SCI } from '../ui/scienceArt';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

// The ending. A running city fades into the science view of the very same simulation (same
// positions, same machines), then a few short pages explain what was underneath.
const LAYOUT: Layout = {
  depots: [],
  checkpoints: [
    checkpoint(3, 1),
    checkpoint(14, -1),
    checkpoint(17, -1),
    checkpoint(18, 1),
    checkpoint(21, 1),
    checkpoint(32, -1),
  ],
};

export class RevealScene extends Phaser.Scene {
  private run!: Run;
  private city!: RoadView;
  private science!: RoadView;
  private acc = 0;
  private stage = 0;
  private page = -1;
  private overlay: Phaser.GameObjects.GameObject[] = [];
  private caption!: Phaser.GameObjects.Text;

  constructor() {
    super('Reveal');
  }

  create(): void {
    const level = getLevel('level-3');
    this.run = startRun(level, LAYOUT, 2024);
    for (let t = 0; t < 12; t += TUNING.step) stepRun(this.run, TUNING.step);
    this.acc = 0;
    this.stage = 0;
    this.page = -1;
    this.overlay = [];
    this.cameras.main.setBackgroundColor(PALETTE.sky);
    const opts = { x0: 70, x1: 1210, roadY: 470, maxRise: 300, top: 110, bottom: 640 };
    this.city = new RoadView(this, level, 'city', opts);
    this.science = new RoadView(this, level, 'science', opts);
    this.science.root.setAlpha(0);
    this.caption = addCenteredText(this, 60, '', {
      ...TEXT_STYLES.title,
      fontSize: '40px',
    }).setDepth(30);

    const reduced = progress().reducedEffects;
    const say = (text: string, color: string) => {
      this.caption.setText(text).setColor(color);
      announce(text);
    };
    say('You weren’t just building a city.', PALETTE.text);
    this.time.delayedCall(3500, () => {
      this.cameras.main.setBackgroundColor(SCI.bg);
      const fade = reduced ? 0 : 3500;
      this.tweens.add({ targets: this.city.root, alpha: 0, duration: fade });
      this.tweens.add({ targets: this.science.root, alpha: 1, duration: fade });
      this.time.delayedCall(fade + 400, () => {
        say('You were organizing a genome.', SCI.text);
        this.stage = 1;
        this.time.delayedCall(3200, () => this.nextPage());
      });
    });

    this.input.on('pointerup', () => this.skip());
    const kb = this.input.keyboard;
    kb?.on('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') this.finish();
      else if (e.key === 'ArrowLeft') this.prevPage();
      else this.skip();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => kb?.removeAllListeners());
  }

  override update(_t: number, delta: number): void {
    this.acc += Math.min(delta, 100) / 1000;
    while (this.acc >= TUNING.step) {
      this.acc -= TUNING.step;
      stepRun(this.run, TUNING.step);
    }
    const state = {
      layout: LAYOUT,
      run: this.run,
      cityParams: this.run.cityParams,
      cursor: null,
      parcels: [],
      flashes: new Map<string, number>(),
    };
    if (this.city.root.alpha > 0) this.city.draw(state);
    this.science.draw(state);
  }

  private skip(): void {
    if (this.stage === 0) return;
    if (this.page > PAGES.length) return this.finish();
    this.nextPage();
  }

  private prevPage(): void {
    if (this.page > 0) {
      this.page -= 2;
      this.nextPage();
    }
  }

  /** Page 0 is the city → cell mapping; then the science pages; then the closing card. */
  private nextPage(): void {
    sound.unlock();
    if (this.page > PAGES.length) return;
    this.page++;
    for (const o of this.overlay) o.destroy();
    this.overlay = [];
    this.caption.setText('');
    const { width, height } = this.scale;
    const shade = this.add.rectangle(0, 0, width, height, SCI.bg, 0.86).setOrigin(0).setDepth(40);
    this.overlay.push(shade);
    const text = (y: number, s: string, style: Phaser.Types.GameObjects.Text.TextStyle) => {
      const t = addCenteredText(this, y, s, style).setDepth(41);
      this.overlay.push(t);
      return t;
    };
    const body = {
      ...TEXT_STYLES.body,
      color: SCI.text,
      align: 'center',
      wordWrap: { width: 980 },
      lineSpacing: 6,
    };

    if (this.page === 0) {
      text(70, 'Same positions. Same rules. Different names.', {
        ...TEXT_STYLES.title,
        fontSize: '36px',
        color: SCI.text,
      });
      MAPPING.forEach(([city, cell], i) => {
        const y = 140 + i * 42;
        const l = this.add
          .text(width / 2 - 30, y, city, { ...TEXT_STYLES.body, color: '#f0d69a' })
          .setOrigin(1, 0.5)
          .setDepth(41);
        const a = this.add
          .text(width / 2, y, '→', { ...TEXT_STYLES.body, color: SCI.textDim })
          .setOrigin(0.5)
          .setDepth(41);
        const r = this.add
          .text(width / 2 + 30, y, cell, { ...TEXT_STYLES.body, color: '#9fe3d8' })
          .setOrigin(0, 0.5)
          .setDepth(41);
        this.overlay.push(l, a, r);
      });
      announce(
        `Same positions, same rules, different names. ${MAPPING.map(([a, b]) => `${a} are ${b}`).join('. ')}.`,
      );
    } else if (this.page <= PAGES.length) {
      const p = PAGES[this.page - 1];
      if (!p) return;
      text(80, p.title, { ...TEXT_STYLES.title, fontSize: '38px', color: SCI.text });
      text(height / 2 + 10, p.body.join('\n\n'), body);
      announce(`${p.title}. ${p.body.join(' ')}`);
    }
    if (this.page === PAGES.length + 1) {
      // closing card
      for (const o of this.overlay.slice(1)) o.destroy();
      this.overlay = [shade];
      text(height / 2 - 120, 'The game ends here. The discovery doesn’t.', {
        ...TEXT_STYLES.title,
        fontSize: '38px',
        color: SCI.text,
      });
      text(height / 2 - 50, 'Science Mode, City Planner and Blueprint are now unlocked.', {
        ...body,
        color: SCI.textDim,
      });
      text(height - 40, '-80  ·  Minus 80 Studios', { ...TEXT_STYLES.small, color: SCI.textDim });
      saveProgress({ revealed: true });
      const done = new Button(
        this,
        width / 2,
        height / 2 + 70,
        320,
        56,
        'CONTINUE ▸',
        () => this.finish(),
        PALETTE.goldDark,
      );
      done.bg.setDepth(42);
      done.label.setDepth(43);
      this.overlay.push(done.bg, done.label);
      announce(
        'The game ends here. The discovery doesn’t. Science Mode, City Planner and Blueprint are now unlocked. Press Enter to continue.',
      );
      sound.play('win');
      return;
    }
    text(
      height - 34,
      `${this.page + 1} / ${PAGES.length + 1}   ·   ENTER or tap: next   ·   ← back   ·   ESC skip`,
      {
        ...TEXT_STYLES.small,
        fontSize: '15px',
        color: SCI.textDim,
      },
    );
  }

  private finish(): void {
    saveProgress({ revealed: true });
    this.scene.start('Modes');
  }
}
