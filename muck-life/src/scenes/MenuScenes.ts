import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import {
  emptyRushRecord,
  progress,
  saveProgress,
  TIMER_LABEL,
  type Colormap,
  type DifficultySetting,
  type TimerSetting,
} from '../config/progress';
import { campaignLevel, CAMPAIGN_LENGTH, CAMPAIGN_META } from '../levels/campaign';
import { RUSH_MODES } from '../levels/rush';
import { COLORMAP_LABEL } from '../render/colormap';
import { drawRushLogo } from '../render/logo';
import { legendGradient } from '../render/marsh';
import { objectiveLabel } from '../systems/session';
import { announce } from '../ui/announce';
import { Button } from '../ui/Button';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

function backdrop(scene: Phaser.Scene, title: string): void {
  const { width, height } = scene.scale;
  scene.cameras.main.setBackgroundColor(PALETTE.mud);
  if (!progress().reducedMotion) scene.cameras.main.fadeIn(180);
  const g = scene.add.graphics();
  g.fillStyle(PALETTE.sediment, 0.35);
  g.fillRect(0, height - 140, width, 140);
  for (let i = 0; i < 70; i++) {
    g.fillStyle(PALETTE.root, 0.06 + (i % 4) * 0.02);
    g.fillCircle((i * 151) % width, (i * 71) % height, 1 + (i % 3));
  }
  addCenteredText(scene, 56, title, TEXT_STYLES.title);
}

const onOff = (v: boolean) => (v ? 'ON' : 'OFF');

// ---------------------------------------------------------------------------------------------

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelect');
  }

  create(): void {
    backdrop(this, 'LEVEL SELECT');
    const p = progress();
    const reachable = Math.min(CAMPAIGN_LENGTH - 1, p.campaignCleared);
    new Menu(
      this,
      [
        ...CAMPAIGN_META.map((m) => ({
          label: () => {
            const best = p.best[campaignLevel(m.index).id];
            const stars = best ? ` · ${'★'.repeat(best.stars)}${'☆'.repeat(3 - best.stars)}` : '';
            return `${m.index + 1}. ${m.name.toUpperCase()}${stars}`;
          },
          help:
            m.index > reachable ? 'Reach this level in the campaign first.' : (m.briefing[0] ?? ''),
          enabled: () => m.index <= reachable,
          action: () => this.scene.start('LevelIntro', { index: m.index }),
        })),
        { label: () => 'BACK', action: () => this.scene.start('Title') },
      ],
      640,
      120,
      620,
      58,
      () => this.scene.start('Title'),
    );
  }
}

// ---------------------------------------------------------------------------------------------

export class LevelIntroScene extends Phaser.Scene {
  constructor() {
    super('LevelIntro');
  }

  create(data: { index: number }): void {
    const meta = CAMPAIGN_META[data.index]!;
    const cfg = campaignLevel(data.index);
    backdrop(this, `LEVEL ${meta.index + 1}: ${meta.name.toUpperCase()}`);
    const p = progress();
    const secs =
      p.timer === 'untimed'
        ? 'untimed'
        : `${Math.round(cfg.duration * (p.timer === 'relaxed' ? 1.5 : p.timer === 'extended' ? 2 : 1))} seconds`;
    this.add
      .text(640, 120, meta.briefing.join('\n\n'), {
        ...TEXT_STYLES.body,
        align: 'center',
        wordWrap: { width: 900 },
      })
      .setOrigin(0.5, 0);
    const obj = cfg.objectives.map((o) => `○ ${objectiveLabel(o)}`).join('\n');
    this.add
      .text(640, 380, `OBJECTIVES (${secs})\n${obj}`, {
        ...TEXT_STYLES.body,
        color: PALETTE.textAmber,
        align: 'center',
        lineSpacing: 8,
      })
      .setOrigin(0.5, 0);
    const controls =
      'Tap / click a pool to document it · Arrows or WASD move the reticle, Space documents, Tab jumps between signals · ' +
      'V view · Q scan · T threshold · L time-lapse · O region of interest · C chemistry · Esc / P pause · R restart';
    this.add
      .text(640, 560, controls, { ...TEXT_STYLES.hint, align: 'center', wordWrap: { width: 1000 } })
      .setOrigin(0.5, 0);
    const start = () => this.scene.start('Play', { kind: 'campaign', index: data.index });
    new Button(this, 640, 650, 300, 54, 'START (SPACE)', start).setFocus(true);
    new Button(this, 110, 680, 160, 40, 'BACK (ESC)', () => this.scene.start('Title'));
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      sound.unlock();
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'e') start();
      if (e.key === 'Escape') this.scene.start('Title');
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.input.keyboard?.removeAllListeners(),
    );
    announce(
      `Level ${meta.index + 1}, ${meta.name}. ${meta.briefing.join(' ')} Objectives: ${cfg.objectives.map(objectiveLabel).join('. ')}. Press Space to start.`,
    );
    sound.playSong('title');
  }
}

// ---------------------------------------------------------------------------------------------

export class RushSelectScene extends Phaser.Scene {
  private seed = 0;
  private seedText!: Phaser.GameObjects.Text;
  private typed = '';

  constructor() {
    super('RushSelect');
  }

  create(): void {
    backdrop(this, '');
    drawRushLogo(this, 640, 64, 1);
    this.seed = Math.floor(Math.random() * 90000) + 10000;
    this.typed = '';
    const rec = progress().rush;
    const fmt = (id: string) => {
      const r = rec[id] ?? emptyRushRecord();
      return r.runs === 0
        ? 'No runs yet.'
        : `Best ${r.bestScore.toLocaleString('en-US')} · accuracy ${Math.round(r.bestAccuracy * 100)}% · combo ×${r.longestCombo} · ${r.mostObservations} observations`;
    };
    new Menu(
      this,
      [
        ...RUSH_MODES.map((m) => ({
          label: () => m.name,
          help: `${m.help}\n${fmt(m.id)}`,
          action: () => this.scene.start('Play', { kind: 'rush', mode: m.id, seed: this.seed }),
        })),
        {
          label: () => 'NEW RANDOM SEED',
          help: 'Same seed, same growth pattern: share a seed to race a friend. Type digits to enter one.',
          action: () => this.setSeed(Math.floor(Math.random() * 90000) + 10000),
        },
        { label: () => 'BACK', action: () => this.scene.start('Title') },
      ],
      640,
      150,
      520,
      62,
      () => this.scene.start('Title'),
    );
    this.seedText = addCenteredText(this, 600, '', { ...TEXT_STYLES.hud, color: PALETTE.textCyan });
    this.setSeed(this.seed);
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        this.typed = (this.typed + e.key).slice(-6);
        this.setSeed(Number(this.typed));
      } else if (e.key === 'Backspace') {
        this.typed = this.typed.slice(0, -1);
        this.setSeed(Number(this.typed || '0'));
      }
    });
    sound.playSong('rush');
  }

  private setSeed(n: number): void {
    this.seed = n;
    this.seedText.setText(`SEED ${n}`);
    announce(`Seed ${n}`);
  }
}

// ---------------------------------------------------------------------------------------------

interface PauseData {
  returnTo: string;
  returnData: Record<string, unknown>;
  canFinish?: boolean;
}

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create(data: PauseData): void {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, PALETTE.ink, 0.85).setOrigin(0);
    addCenteredText(this, 150, 'PAUSED', TEXT_STYLES.title);
    const resume = () => {
      this.scene.resume(data.returnTo);
      this.scene.stop();
    };
    const items = [
      { label: () => 'RESUME (ESC)', action: resume },
      {
        label: () => 'RESTART (R)',
        action: () => {
          this.scene.stop(data.returnTo);
          this.scene.stop();
          this.scene.start(data.returnTo, data.returnData);
        },
      },
      ...(data.canFinish
        ? [
            {
              label: () => 'FINISH & SEE RESULTS',
              action: () => {
                const play = this.scene.get(data.returnTo) as unknown as { finishNow?: () => void };
                play.finishNow?.();
                resume();
              },
            },
          ]
        : []),
      {
        label: () => `SOUND: ${onOff(!progress().muted)} (M)`,
        action: () => void sound.toggleMute(),
      },
      {
        label: () => 'QUIT TO TITLE',
        action: () => {
          this.scene.stop(data.returnTo);
          this.scene.start('Title');
        },
      },
    ];
    new Menu(this, items, width / 2, 240, 440, 70, resume);
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') resume();
      if (e.key === 'r' || e.key === 'R') items[1]!.action();
      if (e.key === 'm' || e.key === 'M') sound.toggleMute();
    });
    announce('Paused.');
  }
}

// ---------------------------------------------------------------------------------------------

const TIMERS: TimerSetting[] = ['standard', 'relaxed', 'extended', 'untimed'];
const DIFFS: DifficultySetting[] = ['gentle', 'standard', 'spicy'];
const MAPS: Colormap[] = ['optode', 'viridis', 'gray'];
const next = <T>(list: T[], v: T): T => list[(list.indexOf(v) + 1) % list.length]!;
const step = (v: number) => (v >= 1 ? 0 : Math.round((v + 0.1) * 10) / 10);

export class SettingsScene extends Phaser.Scene {
  private legend?: Phaser.GameObjects.Graphics;

  constructor() {
    super('Settings');
  }

  create(): void {
    backdrop(this, 'SETTINGS & ACCESSIBILITY');
    const p = progress;
    const drawLegend = () => {
      this.legend?.destroy();
      this.legend = legendGradient(this, 1010, 300, 220, 18, p().colormap);
    };
    const left = [
      { label: () => `ALL SOUND: ${onOff(!p().muted)}`, action: () => void sound.toggleMute() },
      {
        label: () => `EFFECTS VOLUME: ${Math.round(p().sfxVolume * 100)}%`,
        action: () => {
          saveProgress({ sfxVolume: step(p().sfxVolume) });
          sound.applyVolume();
          sound.play('capture');
        },
      },
      {
        label: () => `MUSIC VOLUME: ${Math.round(p().musicVolume * 100)}%`,
        action: () => {
          saveProgress({ musicVolume: step(p().musicVolume) });
          sound.applyVolume();
        },
      },
      {
        label: () => `MARSH AMBIENCE: ${onOff(p().ambience)}`,
        action: () => {
          saveProgress({ ambience: !p().ambience });
          sound.applyVolume();
        },
      },
      {
        label: () => `MOTION: ${p().reducedMotion ? 'REDUCED' : 'FULL'}`,
        help: 'Reduced: no camera moves, shakes, fades, swaying or drifting text.',
        action: () => saveProgress({ reducedMotion: !p().reducedMotion }),
      },
      {
        label: () => `LARGE TEXT: ${onOff(p().largeText)}`,
        action: () => {
          saveProgress({ largeText: !p().largeText });
          this.scene.restart();
        },
      },
      {
        label: () => `HEATMAP: ${COLORMAP_LABEL[p().colormap]}`,
        help: 'All three scales brighten steadily with oxygen, so they also read without colour.',
        action: () => {
          saveProgress({ colormap: next(MAPS, p().colormap) });
          drawLegend();
        },
      },
      {
        label: () => `SIGNAL OUTLINES: ${onOff(p().outlines)}`,
        help: 'Dashed rings around every oxygen region and a check mark on documented ones, independent of colour.',
        action: () => saveProgress({ outlines: !p().outlines }),
      },
      {
        label: () => `TIMER: ${TIMER_LABEL[p().timer]}`,
        help: 'Relaxed and extended give more time; untimed levels end a few seconds after the objectives are met.',
        action: () => saveProgress({ timer: next(TIMERS, p().timer) }),
      },
      {
        label: () => `DIFFICULTY: ${p().difficulty.toUpperCase()}`,
        help: 'Gentle: half the imaging artefacts and a more forgiving Endless Muck. Spicy: more artefacts.',
        action: () => saveProgress({ difficulty: next(DIFFS, p().difficulty) }),
      },
      {
        label: () => `LARGE TARGETS: ${onOff(p().largeTargets)}`,
        help: 'A bigger hit area around every oxygen pool.',
        action: () => saveProgress({ largeTargets: !p().largeTargets }),
      },
      { label: () => 'BACK', action: () => this.scene.start('Title') },
    ];
    new Menu(this, left, 520, 110, 600, 46, () => this.scene.start('Title'));
    this.add.text(1010, 270, 'Heatmap preview', TEXT_STYLES.hint);
    this.add.text(1010, 324, '0%                    40% O₂', {
      ...TEXT_STYLES.hint,
      fontSize: '13px',
    });
    drawLegend();
    this.add.text(
      900,
      380,
      'CONTROLS\nTap/click: document\nArrows/WASD: move reticle\nSpace/Enter/E: document\nTab/N: next signal\nV/1: view mode\nQ/F: optode scan\nT/G: threshold\nL/K: time-lapse\nO/I: ROI window\nC/X: chemistry\nEsc/P: pause · R: restart\nM: mute · Gamepad: stick + A',
      { ...TEXT_STYLES.small, color: PALETTE.textDim, lineSpacing: 2 },
    );
  }
}

// ---------------------------------------------------------------------------------------------

export class MoreScene extends Phaser.Scene {
  constructor() {
    super('More');
  }

  create(): void {
    backdrop(this, 'MORE');
    new Menu(
      this,
      [
        {
          label: () => 'RECORDS',
          help: 'Best scores, accuracy, combos, and observations.',
          action: () => this.scene.start('Records'),
        },
        {
          label: () => 'THE DISCOVERY (ENDING)',
          help: 'The scientific ending. Free to watch any time, whatever your score.',
          action: () => this.scene.start('Ending'),
        },
        {
          label: () => 'WATCH THE OPENING',
          action: () => this.scene.start('Opening', { toTitle: true }),
        },
        { label: () => 'CREDITS', action: () => this.scene.start('Credits') },
        { label: () => 'BACK', action: () => this.scene.start('Title') },
      ],
      640,
      180,
      520,
      72,
      () => this.scene.start('Title'),
    );
  }
}

export class RecordsScene extends Phaser.Scene {
  constructor() {
    super('Records');
  }

  create(): void {
    backdrop(this, 'RECORDS');
    const p = progress();
    const lvl = CAMPAIGN_META.map((m) => {
      const b = p.best[campaignLevel(m.index).id];
      return `${m.index + 1}. ${m.name.padEnd(22)} ${b ? `${b.score.toLocaleString('en-US').padStart(7)}  ${'★'.repeat(b.stars)}${'☆'.repeat(3 - b.stars)}  ${b.title}` : '-'}`;
    }).join('\n');
    const rush = RUSH_MODES.map((m) => {
      const r = p.rush[m.id] ?? emptyRushRecord();
      return `${m.name}\n  best ${r.bestScore.toLocaleString('en-US')} · acc ${Math.round(r.bestAccuracy * 100)}% · combo ×${r.longestCombo} · ${r.mostObservations} obs · efficiency ${Math.round(r.bestEfficiency * 100)}% · ${r.runs} runs`;
    }).join('\n');
    this.add.text(80, 110, `CAMPAIGN\n${lvl}`, {
      ...TEXT_STYLES.small,
      fontFamily: 'ui-monospace, Menlo, monospace',
      lineSpacing: 6,
    });
    this.add.text(80, 360, `O₂ RUSH\n${rush}`, { ...TEXT_STYLES.small, lineSpacing: 4 });
    new Button(this, 640, 680, 240, 46, 'BACK (ESC)', () => this.scene.start('More')).setFocus(
      true,
    );
    this.input.keyboard?.once('keydown', () => this.scene.start('More'));
    announce('Records. ' + lvl.replace(/\n/g, '. '));
  }
}
