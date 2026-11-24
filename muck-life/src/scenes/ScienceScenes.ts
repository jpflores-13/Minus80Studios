import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress } from '../config/progress';
import { MEASURED } from '../config/tuning';
import {
  ALL_CITATIONS,
  BASIS_LABEL,
  COMPARISON,
  FIELD_SITE,
  NOT_AFFILIATED,
  PROFILE_PENDING,
  SCIENTISTS,
  SIMPLIFICATIONS,
  TOPICS,
} from '../content/science';
import { baseConfig, matureRhizome, NO_FEATURES } from '../levels/builders';
import { Heatmap, RootRenderer, drawSediment, VIEW_LABEL, type ViewMode } from '../render/marsh';
import { runGrowthVsDiel } from '../systems/experiments';
import { releaseFactor } from '../systems/plant';
import { Session, WORLD } from '../systems/session';
import { clockLabel } from '../systems/daynight';
import { snapshotValue } from '../systems/oxygen';
import { announce } from '../ui/announce';
import { Button } from '../ui/Button';
import { Grid } from '../ui/Grid';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

function page(scene: Phaser.Scene, title: string, back: string): void {
  scene.cameras.main.setBackgroundColor(PALETTE.mud);
  addCenteredText(scene, 44, title, { ...TEXT_STYLES.title, fontSize: '36px' });
  new Button(scene, 100, 690, 160, 40, 'BACK (ESC)', () => scene.scene.start(back));
}

function openLink(url: string): void {
  window.open(url, '_blank', 'noopener');
}

// ---------------------------------------------------------------------------------------------

export class ExploreScene extends Phaser.Scene {
  constructor() {
    super('Explore');
  }

  create(): void {
    page(this, 'EXPLORE THE SCIENCE', 'Title');
    const items = [
      {
        label: '◆ ROOT EXPLORER',
        help: 'Compare rhizomes, adventitious roots, and lateral roots.',
        action: () => this.scene.start('Lab', { mode: 'roots' }),
      },
      {
        label: '◆ OXYGEN HEATMAP',
        help: 'Watch release follow tissue age: growing vs mature tissue.',
        action: () => this.scene.start('Lab', { mode: 'heatmap' }),
      },
      {
        label: '◆ DAY VERSUS NIGHT',
        help: 'How big are day–night swings next to growth?',
        action: () => this.scene.start('Lab', { mode: 'daynight' }),
      },
      {
        label: '◆ TIME-LAPSE LAB',
        help: 'Scrub through 20 simulated days of root growth.',
        action: () => this.scene.start('Lab', { mode: 'timelapse' }),
      },
      ...TOPICS.map((t, i) => ({
        label: t.title.toUpperCase(),
        help: t.paragraphs[0]!.text.slice(0, 120) + '…',
        action: () => this.scene.start('Topic', { index: i }),
      })),
      {
        label: '★ WHAT WE SIMPLIFIED',
        help: 'Where the game departs from the real science.',
        action: () => this.scene.start('Simplified'),
      },
      { label: '★ MEET THE SCIENTISTS', action: () => this.scene.start('Scientists') },
      { label: '★ REFERENCES', action: () => this.scene.start('References') },
    ];
    new Grid(
      this,
      items,
      { x: 40, y: 90, cols: 3, cellW: 390, cellH: 52, gapX: 15, gapY: 10 },
      () => this.scene.start('Title'),
    );
  }
}

export class TopicScene extends Phaser.Scene {
  constructor() {
    super('Topic');
  }

  create(data: { index: number }): void {
    const i = data.index;
    const t = TOPICS[i]!;
    page(this, t.title.toUpperCase(), 'Explore');
    let y = 110;
    for (const p of t.paragraphs) {
      this.add.text(110, y, BASIS_LABEL[p.basis], {
        ...TEXT_STYLES.label,
        fontSize: '14px',
        color:
          p.basis === 'game'
            ? PALETTE.textCoral
            : p.basis === 'speculation'
              ? PALETTE.textAmber
              : PALETTE.textCyan,
      });
      const body = this.add.text(110, y + 24, p.text, {
        ...TEXT_STYLES.body,
        wordWrap: { width: 1060 },
      });
      y += body.height + 56;
    }
    this.add
      .text(
        640,
        640,
        `Topic ${i + 1} of ${TOPICS.length} · ← → for more topics · Source: Stein & Cardon 2026 unless marked general background`,
        TEXT_STYLES.hint,
      )
      .setOrigin(0.5);
    new Button(this, 1180, 690, 160, 40, 'NEXT ▶', () =>
      this.scene.restart({ index: (i + 1) % TOPICS.length }),
    );
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === ' ')
        this.scene.restart({ index: (i + 1) % TOPICS.length });
      if (e.key === 'ArrowLeft' || e.key === 'a')
        this.scene.restart({ index: (i - 1 + TOPICS.length) % TOPICS.length });
      if (e.key === 'Escape') this.scene.start('Explore');
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.input.keyboard?.removeAllListeners(),
    );
    announce(
      `${t.title}. ${t.paragraphs.map((p) => `${BASIS_LABEL[p.basis]}: ${p.text}`).join(' ')}`,
    );
  }
}

export class SimplifiedScene extends Phaser.Scene {
  constructor() {
    super('Simplified');
  }

  create(): void {
    page(this, 'WHAT WE SIMPLIFIED', 'Explore');
    this.add.text(90, 90, SIMPLIFICATIONS.map((s) => `• ${s}`).join('\n'), {
      ...TEXT_STYLES.small,
      lineSpacing: 8,
      wordWrap: { width: 1100 },
    });
    this.add.text(
      90,
      560,
      'In Explore, every paragraph is tagged: MEASURED IN THE STUDY, FROM THE PAPER, AUTHORS’ HYPOTHESIS, GENERAL BACKGROUND, or GAME SIMPLIFICATION.',
      { ...TEXT_STYLES.hint, wordWrap: { width: 1100 } },
    );
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('Explore'));
    announce('What we simplified. ' + SIMPLIFICATIONS.join(' '));
  }
}

export class ReferencesScene extends Phaser.Scene {
  constructor() {
    super('References');
  }

  create(): void {
    page(this, 'REFERENCES', 'Explore');
    let y = 100;
    ALL_CITATIONS.forEach((c, i) => {
      const t = this.add.text(
        90,
        y,
        `${i + 1}. ${c.text}${c.note ? `\n   ${c.note}` : ''}\n   ${c.url}`,
        { ...TEXT_STYLES.small, wordWrap: { width: 1100 } },
      );
      t.setInteractive({ useHandCursor: true }).on('pointerup', () => openLink(c.url));
      y += t.height + 18;
    });
    this.add.text(
      90,
      y + 4,
      'Click a reference to open it. Keys 1–5 open the matching link.',
      TEXT_STYLES.hint,
    );
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= ALL_CITATIONS.length) openLink(ALL_CITATIONS[n - 1]!.url);
      if (e.key === 'Escape') this.scene.start('Explore');
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.input.keyboard?.removeAllListeners(),
    );
    announce('References. ' + ALL_CITATIONS.map((c) => c.text).join(' '));
  }
}

// ---------------------------------------------------------------------------------------------

export class ScientistsScene extends Phaser.Scene {
  constructor() {
    super('Scientists');
  }

  create(): void {
    page(this, 'MEET THE SCIENTISTS', 'Title');
    SCIENTISTS.forEach((s, i) => {
      const x = 40 + i * 410;
      const g = this.add.graphics();
      g.fillStyle(PALETTE.panel, 1);
      g.fillRoundedRect(x, 90, 390, 370, 14);
      g.lineStyle(2, PALETTE.amber, 0.8);
      g.strokeRoundedRect(x, 90, 390, 370, 14);
      // Portrait placeholder: no photo until approved.
      g.fillStyle(PALETTE.sediment, 1);
      g.fillCircle(x + 50, 140, 30);
      this.add.text(x + 50, 140, '?', { ...TEXT_STYLES.title, fontSize: '28px' }).setOrigin(0.5);
      this.add.text(x + 94, 112, s.name, { ...TEXT_STYLES.hud, wordWrap: { width: 280 } });
      this.add.text(x + 20, 182, s.role, {
        ...TEXT_STYLES.small,
        color: PALETTE.textAmber,
        wordWrap: { width: 350 },
      });
      this.add.text(x + 20, 250, s.facts.map((f) => `• ${f}`).join('\n'), {
        ...TEXT_STYLES.small,
        fontSize: '15px',
        wordWrap: { width: 350 },
      });
      this.add.text(x + 20, 430, `Source: ${s.source}`, {
        ...TEXT_STYLES.hint,
        fontSize: '12px',
        wordWrap: { width: 350 },
      });
    });
    this.add.text(
      60,
      478,
      `RESEARCH METHODS  Plants and sediment were collected from a Parker River marsh (Plum Island estuary, MA) and grown in thin rhizoboxes with hand-made oxygen-sensitive planar optodes on one clear wall. Fluorescence images every ${MEASURED.imageIntervalMin[0]}–${MEASURED.imageIntervalMin[1]} min tracked oxygen as roots and rhizomes grew, while leaf gas exchange was measured alongside. Regions of interest compared pools over time. ${FIELD_SITE}`,
      { ...TEXT_STYLES.small, fontSize: '15px', wordWrap: { width: 1160 } },
    );
    this.add.text(60, 600, `${PROFILE_PENDING}\n${NOT_AFFILIATED}`, {
      ...TEXT_STYLES.hint,
      color: PALETTE.textDim,
      wordWrap: { width: 1160 },
    });
    new Button(this, 1130, 690, 260, 40, 'READ THE PAPER (1)', () =>
      openLink(ALL_CITATIONS[0]!.url),
    );
    new Button(this, 840, 690, 280, 40, 'MBL NEWS STORY (2)', () =>
      openLink(ALL_CITATIONS[1]!.url),
    );
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      if (e.key === '1') openLink(ALL_CITATIONS[0]!.url);
      if (e.key === '2') openLink(ALL_CITATIONS[1]!.url);
      if (e.key === 'Escape') this.scene.start('Title');
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.input.keyboard?.removeAllListeners(),
    );
    announce(
      'Meet the scientists. ' +
        SCIENTISTS.map((s) => `${s.name}, ${s.role}. ${s.facts.join(' ')}`).join(' ') +
        ' ' +
        NOT_AFFILIATED,
    );
  }
}

export class CreditsScene extends Phaser.Scene {
  constructor() {
    super('Credits');
  }

  create(): void {
    page(this, 'CREDITS', 'More');
    const lines = [
      'MUCK LIFE · a Minus 80 Studios game',
      '',
      'INSPIRED BY',
      'Stein, I. R., & Cardon, Z. G. (2026). New Phytologist 252(5), 1832–1842. doi:10.1111/nph.71593',
      'Optodes for the original study made by hand by Suzanne Thomas (MBL).',
      'Marine Biological Laboratory news story by Camille Ledoux (19 Nov 2026).',
      '',
      NOT_AFFILIATED,
      '',
      'Code, design, writing, placeholder art and synthesized audio: Minus 80 Studios.',
      'All visuals are drawn procedurally; all sound is synthesized live with Web Audio. No third-party art or audio.',
      'Built with Phaser 4, TypeScript and Vite.',
      '',
      '© 2026 Minus 80 Studios. All rights reserved.',
    ];
    this.add
      .text(640, 100, lines.join('\n'), {
        ...TEXT_STYLES.small,
        align: 'center',
        lineSpacing: 6,
        wordWrap: { width: 1100 },
      })
      .setOrigin(0.5, 0);
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('More'));
    announce(lines.join(' '));
  }
}

// ---------------------------------------------------------------------------------------------

type LabMode = 'roots' | 'heatmap' | 'daynight' | 'timelapse';

/** Four interactive mini-labs that reuse the game's own simulation. */
export class LabScene extends Phaser.Scene {
  private mode: LabMode = 'roots';
  private session: Session | null = null;
  private heat: Heatmap | null = null;
  private roots: RootRenderer | null = null;
  private frames: { simHour: number; field: Uint8Array }[] = [];
  private scrub = 0;
  private playing = true;
  private info!: Phaser.GameObjects.Text;
  private view: ViewMode = 'combined';
  private g!: Phaser.GameObjects.Graphics;
  private selected = 0;

  constructor() {
    super('Lab');
  }

  init(data: { mode: LabMode }): void {
    this.mode = data.mode;
    this.session = null;
    this.heat = null;
    this.roots = null;
    this.frames = [];
    this.scrub = 0;
    this.playing = true;
    this.selected = 0;
    this.view = 'combined';
    this.curveLabel = null;
  }

  create(): void {
    const titles: Record<LabMode, string> = {
      roots: 'ROOT EXPLORER',
      heatmap: 'OXYGEN HEATMAP',
      daynight: 'DAY VERSUS NIGHT',
      timelapse: 'TIME-LAPSE LABORATORY',
    };
    this.cameras.main.setBackgroundColor(PALETTE.mud);
    if (this.mode !== 'daynight') {
      drawSediment(this, 5);
      this.session = this.buildSession();
      this.heat = new Heatmap(this, this.session.field, 'heat-lab');
      this.roots = new RootRenderer(this);
    }
    this.g = this.add.graphics().setDepth(10);
    const band = this.add.graphics().setDepth(19);
    band.fillStyle(PALETTE.ink, 0.88);
    band.fillRect(0, 0, WORLD.width, 176);
    addCenteredText(this, 30, titles[this.mode], {
      ...TEXT_STYLES.title,
      fontSize: '32px',
    }).setDepth(20);
    this.info = this.add
      .text(40, 64, '', { ...TEXT_STYLES.small, wordWrap: { width: 1200 } })
      .setDepth(20);
    new Button(this, 100, 690, 160, 40, 'BACK (ESC)', () =>
      this.scene.start('Explore'),
    ).bg.setDepth(50);
    if (this.mode === 'timelapse') this.precompute();
    if (this.mode === 'daynight') this.drawDayNight();
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => this.key(e.key));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.input.keyboard?.removeAllListeners(),
    );
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.mode === 'timelapse' && p.y > 640 && p.x > 220) {
        this.scrub = Phaser.Math.Clamp((p.x - 240) / 1000, 0, 1);
        this.playing = false;
      }
      if (this.mode === 'roots' && p.y > 180 && p.y < 660)
        this.select(p.x < 427 ? 0 : p.x < 853 ? 1 : 2);
    });
    this.describe();
  }

  private buildSession(): Session {
    const lab = this.mode;
    return new Session({
      ...baseConfig(),
      id: `lab-${lab}`,
      title: 'Lab',
      duration: Infinity,
      hoursPerSecond: lab === 'heatmap' ? 5 : 3,
      warmupHours: lab === 'roots' ? 230 : 4,
      growth: {
        growthBoost: 1.8,
        lateralDelayHours: 90,
        adventitiousDelayHours: 40,
        rhizomeMaxLength: 700,
      },
      setup: (plant, rng, t0) => {
        const { seg, nodes } = matureRhizome(plant, 120, 520, 232, t0 - 600);
        nodes.forEach((n, k) => plant.scheduleRoots(seg.id, n.x, n.y, t0 + k * 18, 1));
        plant.addRhizome(520, 236, 1, t0 + 2);
        void rng;
      },
      distractorRate: 0,
      features: NO_FEATURES,
      seed: 31,
    });
  }

  private key(k: string): void {
    sound.unlock();
    if (k === 'Escape') return void this.scene.start('Explore');
    if (this.mode === 'timelapse') {
      if (k === 'ArrowRight' || k === 'd') this.scrub = Math.min(1, this.scrub + 0.02);
      if (k === 'ArrowLeft' || k === 'a') this.scrub = Math.max(0, this.scrub - 0.02);
      if (k === ' ' || k === 'Enter') this.playing = !this.playing;
      if (k.startsWith('Arrow')) this.playing = false;
    }
    if (this.mode === 'roots') {
      if (k === 'ArrowRight' || k === 'd') this.select((this.selected + 1) % 3);
      if (k === 'ArrowLeft' || k === 'a') this.select((this.selected + 2) % 3);
    }
    if (this.mode === 'heatmap' && (k === 'v' || k === 'V' || k === ' ')) {
      const order: ViewMode[] = ['combined', 'imaging', 'natural'];
      this.view = order[(order.indexOf(this.view) + 1) % 3]!;
      this.describe();
    }
  }

  private select(i: number): void {
    this.selected = i;
    sound.play('click');
    this.describe();
  }

  private describe(): void {
    const organ = (['rhizome', 'adventitious', 'lateral'] as const)[this.selected]!;
    const topic = TOPICS.find((t) => t.id === (organ === 'rhizome' ? 'rhizomes' : organ))!;
    const d = MEASURED.poolDurationHours[organ];
    const text: Record<LabMode, string> = {
      roots:
        `${topic.title.toUpperCase()} (← → or tap to compare). ${topic.paragraphs.map((p) => p.text).join(' ')}\n` +
        `Pool duration in the study: ${d.mean} ± ${d.se} h. The highlighted tissue is drawn in amber below.`,
      heatmap:
        `Release follows tissue age: young tissue leaks oxygen, mature tissue goes quiet. The curves (bottom right) are the game’s simplified release rules, ` +
        `shaped so pools last near the study’s means (rhizome 78 h, adventitious 95 h, lateral 502 h). Space / V: view (${VIEW_LABEL[this.view]}).`,
      daynight:
        'Measured in the study: growth-associated pools regularly reached 25–30% saturation (up to ~35%), while the day–night swing averaged ~3% (up to ~5%). ' +
        'Below, the game’s model runs the same comparison on one root and its laterals.',
      timelapse:
        'A simulated 20-day image series. ← → scrub (or tap the bar), Space play/pause. Watch pools appear with growth, fade as tissue matures, and lateral plumes linger.',
    };
    this.info.setText(text[this.mode]);
    announce(text[this.mode]);
  }

  private precompute(): void {
    const s = this.session!;
    const frames: { simHour: number; field: Uint8Array }[] = [];
    for (let h = 0; h < 480; h += 0.25) {
      s.update(0.25 / s.cfg.hoursPerSecond);
      if (Math.round(s.simHour * 4) % 12 === 0)
        frames.push({ simHour: s.simHour, field: s.field.snapshot() });
    }
    this.frames = frames;
  }

  private drawDayNight(): void {
    const r = runGrowthVsDiel();
    const g = this.g;
    const x0 = 120;
    const y0 = 600;
    const w = 1040;
    const h = 340;
    const tr = r.lateralTrace;
    if (tr.t.length < 2) return;
    const t0 = tr.t[0]!;
    const span = tr.t[tr.t.length - 1]! - t0;
    // Night shading.
    for (let t = Math.floor(t0); t < t0 + span; t += 1) {
      const hr = t % 24;
      if (hr < MEASURED.lightOnHour || hr >= MEASURED.lightOffHour) {
        g.fillStyle(0x0d1322, 0.8);
        g.fillRect(x0 + ((t - t0) / span) * w, y0 - h, w / span + 1, h);
      }
    }
    const max = 40;
    g.lineStyle(1, PALETTE.cream, 0.5);
    g.strokeRect(x0, y0 - h, w, h);
    for (let v = 0; v <= max; v += 10)
      this.add
        .text(x0 - 8, y0 - (v / max) * h - 8, `${v}%`, { ...TEXT_STYLES.hint, fontSize: '13px' })
        .setOrigin(1, 0)
        .setDepth(11);
    // Growth-associated level (measured range) for scale.
    g.fillStyle(PALETTE.mint, 0.15);
    g.fillRect(
      x0,
      y0 - (COMPARISON.growthHigh / max) * h,
      w,
      ((COMPARISON.growthHigh - COMPARISON.growthLow) / max) * h,
    );
    g.lineStyle(3, PALETTE.cyan, 1);
    g.beginPath();
    tr.t.forEach((t, i) => {
      const px = x0 + ((t - t0) / span) * w;
      const py = y0 - (Math.min(max, tr.v[i]!) / max) * h;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    });
    g.strokePath();
    this.add
      .text(
        x0,
        y0 + 12,
        `Cyan: simulated oxygen around lateral roots over ${Math.round(span / 24)} days (dark bands = night). Green band: the 25–35% range measured as new roots grew.\n` +
          `Simulated: new root raises O₂ by ${r.growthRise.toFixed(0)}%; day–night swing ${r.dielRange.toFixed(1)}%; lowest night reading ${r.nightMinimum.toFixed(0)}%. The pool never switches off at night.`,
        { ...TEXT_STYLES.small, wordWrap: { width: 1060 } },
      )
      .setDepth(11);
  }

  override update(_t: number, delta: number): void {
    const dt = Math.min(0.05, delta / 1000);
    const s = this.session;
    if (!s || !this.heat || !this.roots) return;
    const map = progress().colormap;
    const g = this.g;
    g.clear();
    if (this.mode === 'timelapse') {
      if (this.playing) this.scrub = (this.scrub + dt / 20) % 1;
      const f = this.frames[Math.round(this.scrub * (this.frames.length - 1))];
      if (!f) return;
      this.heat.draw(map, 'combined', s.imaging, (i) => snapshotValue(f.field, i));
      this.roots.draw(s.plant, f.simHour, 1, f.simHour);
      g.fillStyle(PALETTE.ink, 0.9);
      g.fillRect(220, 650, 1040, 30);
      g.fillStyle(PALETTE.amber, 1);
      g.fillRect(240, 660, 1000 * this.scrub, 10);
      g.lineStyle(1, PALETTE.cream, 0.6);
      g.strokeRect(240, 660, 1000, 10);
      this.info.setText(
        `${clockLabel(f.simHour)} · ${this.playing ? 'playing' : 'paused'}\nA simulated 20-day image series. ← → scrub (or tap the bar), Space play/pause.`,
      );
      return;
    }
    if (this.mode === 'heatmap') s.update(dt);
    this.heat.draw(map, this.mode === 'roots' ? 'combined' : this.view, s.imaging);
    this.roots.draw(s.plant, s.simHour, this.view === 'imaging' ? 0.3 : 1);
    if (this.mode === 'roots') {
      const organ = (['rhizome', 'adventitious', 'lateral'] as const)[this.selected]!;
      g.lineStyle(3, PALETTE.amber, 0.9);
      for (const seg of s.plant.segments.filter((x) => x.organ === organ)) {
        g.beginPath();
        seg.points.forEach((p, i) => (i === 0 ? g.moveTo(p.x, p.y) : g.lineTo(p.x, p.y)));
        g.strokePath();
      }
    }
    if (this.mode === 'heatmap') this.drawCurves(g);
  }

  /** Release-vs-tissue-age curves for the three organ types. */
  private drawCurves(g: Phaser.GameObjects.Graphics): void {
    const x0 = 860;
    const y0 = 640;
    const w = 380;
    const h = 120;
    g.fillStyle(PALETTE.ink, 0.85);
    g.fillRect(x0 - 10, y0 - h - 30, w + 20, h + 46);
    const maxAge = 700;
    const colors = { rhizome: PALETTE.amber, adventitious: PALETTE.cream, lateral: PALETTE.mint };
    for (const organ of ['rhizome', 'adventitious', 'lateral'] as const) {
      g.lineStyle(2, colors[organ], 1);
      g.beginPath();
      for (let a = 0; a <= maxAge; a += 5) {
        const px = x0 + (a / maxAge) * w;
        const py = y0 - (Math.min(1.5, releaseFactor(organ, a)) / 1.5) * h;
        if (a === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.strokePath();
    }
    if (!this.curveLabel) {
      this.curveLabel = this.add
        .text(
          x0,
          y0 - h - 26,
          'Simulated release vs tissue age (0–700 h)\namber rhizome · cream adventitious · mint lateral',
          { ...TEXT_STYLES.hint, fontSize: '12px' },
        )
        .setDepth(12);
    }
  }

  private curveLabel: Phaser.GameObjects.Text | null = null;
}
