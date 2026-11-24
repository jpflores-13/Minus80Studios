import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import {
  BASIS_LABEL,
  COMPARISON,
  DISCOVERIES,
  ENDING_CLOSE,
  ENDING_OPENER,
  FIELD_SITE,
  MBL_ARTICLE,
  METHODS_EXPLAINER,
  NOT_AFFILIATED,
  PRIMARY,
  SCIENTISTS,
} from '../content/science';
import { emit } from '../integration/yeti';
import { drawDiscoveryArt, drawRhizobox } from '../render/scienceArt';
import { runGrowthVsDiel } from '../systems/experiments';
import { announce } from '../ui/announce';
import { Button } from '../ui/Button';
import { TEXT_STYLES } from '../ui/text';

type Panel =
  | { kind: 'opener' }
  | { kind: 'discovery'; i: number }
  | { kind: 'compare' }
  | { kind: 'methods' }
  | { kind: 'people' }
  | { kind: 'close' };

const PANELS: Panel[] = [
  { kind: 'opener' },
  ...DISCOVERIES.map((_, i) => ({ kind: 'discovery' as const, i })),
  { kind: 'compare' },
  { kind: 'methods' },
  { kind: 'people' },
  { kind: 'close' },
];

/** The scientific discovery ending: ~60–120 s at a reading pace, paged by the player. */
export class EndingScene extends Phaser.Scene {
  private index = 0;
  private layer!: Phaser.GameObjects.Container;
  private art!: Phaser.GameObjects.Graphics;
  private t = 0;
  private sim!: ReturnType<typeof runGrowthVsDiel>;
  private progressText!: Phaser.GameObjects.Text;

  constructor() {
    super('Ending');
  }

  create(): void {
    this.index = 0;
    this.cameras.main.setBackgroundColor(PALETTE.mud);
    this.art = this.add.graphics().setDepth(1);
    this.layer = this.add.container(0, 0).setDepth(2);
    this.progressText = this.add.text(640, 700, '', TEXT_STYLES.hint).setOrigin(0.5, 1).setDepth(3);
    new Button(this, 1160, 680, 180, 44, 'NEXT ▶ (SPACE)', () => this.go(1)).bg.setDepth(50);
    new Button(this, 120, 680, 160, 44, '◀ BACK', () => this.go(-1)).bg.setDepth(50);
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      sound.unlock();
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight' || e.key === 'd') this.go(1);
      else if (e.key === 'ArrowLeft' || e.key === 'a') this.go(-1);
      else if (e.key === 'Escape') this.scene.start('Title');
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.input.keyboard?.removeAllListeners(),
    );
    sound.playSong('ending');
    this.sim = runGrowthVsDiel();
    const first = !progress().seenEnding;
    saveProgress({ seenEnding: true });
    if (first) emit({ type: 'discovery_unlocked', discoveryId: 'stein-cardon-2026' });
    this.show();
  }

  private go(d: number): void {
    const n = this.index + d;
    if (n < 0) return;
    if (n >= PANELS.length) return void this.scene.start('Title');
    sound.play('click');
    this.index = n;
    this.show();
  }

  override update(_t: number, delta: number): void {
    this.t += progress().reducedMotion ? 0 : delta / 1000;
    const p = PANELS[this.index]!;
    this.art.clear();
    if (p.kind === 'discovery') drawDiscoveryArt(this.art, DISCOVERIES[p.i]!.art, 300, 300, this.t);
    if (p.kind === 'opener') drawDiscoveryArt(this.art, 'growth', 640, 420, this.t);
    if (p.kind === 'methods') drawRhizobox(this.art, 60, 150);
  }

  private text(
    x: number,
    y: number,
    s: string,
    style: Phaser.Types.GameObjects.Text.TextStyle,
    w = 1100,
    origin = 0,
  ): Phaser.GameObjects.Text {
    const t = this.add.text(x, y, s, { ...style, wordWrap: { width: w } }).setOrigin(origin, 0);
    this.layer.add(t);
    return t;
  }

  private show(): void {
    this.layer.removeAll(true);
    const p = PANELS[this.index]!;
    this.progressText.setText(`${this.index + 1} / ${PANELS.length}`);
    let spoken = '';
    switch (p.kind) {
      case 'opener':
        this.text(640, 140, ENDING_OPENER, { ...TEXT_STYLES.title, align: 'center' }, 1000, 0.5);
        spoken = ENDING_OPENER;
        break;
      case 'discovery': {
        const d = DISCOVERIES[p.i]!;
        this.text(
          560,
          120,
          `DISCOVERY ${p.i + 1}`,
          { ...TEXT_STYLES.label, color: PALETTE.textAmber },
          640,
        );
        this.text(560, 150, d.title, TEXT_STYLES.title, 660);
        this.text(560, 260, d.body.replace(/\*/g, ''), TEXT_STYLES.body, 640);
        this.text(
          560,
          560,
          `● ${BASIS_LABEL[d.basis]} · Stein & Cardon 2026`,
          { ...TEXT_STYLES.hint, color: PALETTE.textCyan },
          640,
        );
        spoken = `Discovery ${p.i + 1}. ${d.title}. ${d.body.replace(/\*/g, '')}`;
        break;
      }
      case 'compare':
        spoken = this.drawCompare();
        break;
      case 'methods':
        this.text(
          520,
          70,
          'HOW THEY DID IT: RHIZOBOXES & PLANAR OPTODES',
          { ...TEXT_STYLES.hud, color: PALETTE.textAmber },
          720,
        );
        this.text(
          520,
          120,
          METHODS_EXPLAINER.map((m) => `• ${m}`).join('\n\n'),
          { ...TEXT_STYLES.small, lineSpacing: 3 },
          720,
        );
        this.text(
          60,
          520,
          'Illustration: our own sketch, not the study’s apparatus or figures.',
          TEXT_STYLES.hint,
          420,
        );
        spoken = METHODS_EXPLAINER.join(' ');
        break;
      case 'people': {
        this.text(
          640,
          60,
          'THE SCIENCE BEHIND THE MUCK',
          { ...TEXT_STYLES.title, fontSize: '34px' },
          1100,
          0.5,
        );
        const ppl = SCIENTISTS.map((s) => `${s.name}\n${s.role}`).join('\n\n');
        this.text(120, 130, ppl, { ...TEXT_STYLES.body, lineSpacing: 4 }, 1040);
        this.text(
          120,
          420,
          `${PRIMARY.text}\n${PRIMARY.url}\n\n${MBL_ARTICLE.text}\n\n${FIELD_SITE}`,
          TEXT_STYLES.small,
          1040,
        );
        this.text(
          120,
          600,
          NOT_AFFILIATED,
          { ...TEXT_STYLES.hint, color: PALETTE.textAmber },
          1040,
        );
        spoken = `${ppl}. ${PRIMARY.text}. ${NOT_AFFILIATED}`;
        break;
      }
      case 'close':
        this.text(640, 220, ENDING_CLOSE[0]!, { ...TEXT_STYLES.title, align: 'center' }, 1100, 0.5);
        this.text(
          640,
          330,
          ENDING_CLOSE[1]!,
          { ...TEXT_STYLES.hud, color: PALETTE.textDim },
          1100,
          0.5,
        );
        this.text(
          640,
          380,
          '-80',
          { ...TEXT_STYLES.display, fontFamily: 'Georgia, serif', fontSize: '80px' },
          1100,
          0.5,
        );
        this.text(
          640,
          490,
          ENDING_CLOSE[2]!,
          { ...TEXT_STYLES.title, color: PALETTE.textMint },
          1100,
          0.5,
        );
        spoken = ENDING_CLOSE.join(' ');
        sound.play('win');
        break;
    }
    announce(spoken);
  }

  /** Measured (paper) vs simulated (this game's model) growth and day–night changes. */
  private drawCompare(): string {
    this.text(
      640,
      50,
      'GROWTH vs. DAY AND NIGHT',
      { ...TEXT_STYLES.title, fontSize: '36px' },
      1100,
      0.5,
    );
    const g = this.add.graphics();
    this.layer.add(g);
    const base = 520;
    const scale = 9; // px per % saturation
    const bar = (
      x: number,
      lo: number,
      hi: number,
      color: number,
      label: string,
      value: string,
    ) => {
      g.fillStyle(color, 0.35);
      g.fillRect(x, base - hi * scale, 90, hi * scale);
      g.fillStyle(color, 1);
      g.fillRect(x, base - lo * scale, 90, lo * scale);
      this.text(x + 45, base + 10, label, { ...TEXT_STYLES.small, align: 'center' }, 180, 0.5);
      this.text(
        x + 45,
        base - hi * scale - 34,
        value,
        { ...TEXT_STYLES.label, align: 'center' },
        180,
        0.5,
      );
    };
    g.lineStyle(2, PALETTE.cream, 0.7);
    g.lineBetween(120, base, 1160, base);
    for (let v = 0; v <= 35; v += 5) {
      g.lineBetween(112, base - v * scale, 120, base - v * scale);
      this.text(
        104,
        base - v * scale - 9,
        `${v}%`,
        { ...TEXT_STYLES.hint, fontSize: '13px' },
        60,
        1,
      );
    }
    this.text(
      180,
      120,
      'MEASURED (Stein & Cardon 2026)',
      { ...TEXT_STYLES.label, color: PALETTE.textAmber },
      460,
    );
    bar(
      190,
      COMPARISON.growthLow,
      COMPARISON.growthHigh,
      PALETTE.mint,
      'New root or\nrhizome arrives',
      `${COMPARISON.growthLow}–${COMPARISON.growthHigh}%`,
    );
    bar(
      380,
      COMPARISON.dielMean,
      COMPARISON.dielUpper,
      PALETTE.cyan,
      'Day vs. night\nswing',
      `c. ${COMPARISON.dielMean}–${COMPARISON.dielUpper}%`,
    );
    this.text(
      700,
      120,
      'SIMULATED IN MUCK LIFE (not calibrated)',
      { ...TEXT_STYLES.label, color: PALETTE.textDim },
      460,
    );
    const gr = this.sim.growthRise;
    const dr = this.sim.dielRange;
    bar(720, gr, gr, PALETTE.root, 'New root\narrives', `${gr.toFixed(0)}%`);
    bar(910, dr, dr, 0x9c7b52, 'Day vs. night\nswing', `${dr.toFixed(1)}%`);
    this.text(
      640,
      600,
      'Measured values: % air saturation from planar optode images of four lab-grown plants. Simulated values come from the game’s simplified model, tuned to behave like the study. They are not predictions.',
      { ...TEXT_STYLES.hint, align: 'center' },
      1000,
      0.5,
    );
    return `Growth versus day and night. Measured: a new root or rhizome raised oxygen by ${COMPARISON.growthLow} to ${COMPARISON.growthHigh} percent saturation; the day-night swing was about ${COMPARISON.dielMean} to ${COMPARISON.dielUpper} percent. In the game's simulation: ${gr.toFixed(0)} percent versus ${dr.toFixed(1)} percent.`;
  }
}
