import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { active, links, timeLeft } from '../systems/folder';
import { announce } from '../ui/announce';
import { Button } from '../ui/Button';
import { addCenteredText, TEXT_STYLES } from '../ui/text';
import { touch, type JobScene } from './JobScene';

// The HUD: objective, suspicion, the Folder's state, prompts, the briefing and touch controls.
export class HudScene extends Phaser.Scene {
  private job!: JobScene;
  private g!: Phaser.GameObjects.Graphics;
  private objective!: Phaser.GameObjects.Text;
  private folderText!: Phaser.GameObjects.Text;
  private suspicionText!: Phaser.GameObjects.Text;
  private prompt!: Phaser.GameObjects.Text;
  private brief: Phaser.GameObjects.GameObject[] = [];
  private page = 0;
  private stick: { id: number; x: number; y: number } | null = null;

  constructor() {
    super('Hud');
  }

  create(data: { job: JobScene }): void {
    this.job = data.job;
    const { width, height } = this.scale;
    this.g = this.add.graphics();
    this.objective = this.add.text(20, 14, '', { ...TEXT_STYLES.hud, fontSize: '22px' });
    this.suspicionText = this.add.text(20, 50, '', {
      ...TEXT_STYLES.small,
      fontSize: '15px',
      color: PALETTE.textDim,
    });
    this.folderText = this.add
      .text(width - 20, 14, '', { ...TEXT_STYLES.hud, fontSize: '20px', align: 'right' })
      .setOrigin(1, 0);
    this.prompt = this.add
      .text(width / 2, height - 44, '', {
        ...TEXT_STYLES.body,
        fontSize: '20px',
        align: 'center',
        backgroundColor: '#14232bdd',
        padding: { x: 14, y: 6 },
        wordWrap: { width: 900 },
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.job.events.on('prompt', (t: string) => this.showPrompt(t));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.job.events.off('prompt');
      Object.assign(touch, { dx: 0, dy: 0, sprint: false, fold: false });
    });
    if (this.sys.game.device.input.touch) this.buildTouch();
    const pause = new Button(this, width - 50, height - 50, 70, 56, '❚❚', () => this.job.pause());
    pause.bg.setDepth(60);
    pause.label.setDepth(61);
    this.showBriefing();
  }

  // ---------- the briefing: a retro mission card ----------

  private showBriefing(): void {
    for (const o of this.brief) o.destroy();
    const { width, height } = this.scale;
    const lines = this.job.m.job.briefing;
    const shade = this.add
      .rectangle(0, 0, width, height, PALETTE.navy, 0.92)
      .setOrigin(0)
      .setDepth(80)
      .setInteractive();
    const tag = addCenteredText(
      this,
      150,
      `JOB ${String(this.job.m.job.number).padStart(2, '0')}`,
      { ...TEXT_STYLES.hud, color: PALETTE.textGold },
    ).setDepth(81);
    const title = addCenteredText(this, 200, this.job.m.job.name.toUpperCase(), {
      ...TEXT_STYLES.title,
      fontSize: '48px',
    }).setDepth(81);
    const body = addCenteredText(this, 340, lines[this.page] ?? '', {
      ...TEXT_STYLES.body,
      align: 'center',
      wordWrap: { width: 820 },
      lineSpacing: 6,
    }).setDepth(81);
    const hint = addCenteredText(
      this,
      470,
      `${this.page + 1} / ${lines.length}   ·   Enter, tap or A: next   ·   Esc: start now`,
      TEXT_STYLES.hint,
    ).setDepth(81);
    this.brief = [shade, tag, title, body, hint];
    announce(
      `${this.page === 0 ? `Job ${this.job.m.job.number}, ${this.job.m.job.name}. ` : ''}${lines[this.page] ?? ''}`,
    );
    const next = () => {
      sound.unlock();
      sound.play('click');
      if (this.page >= lines.length - 1) return this.endBriefing();
      this.page++;
      this.showBriefing();
    };
    shade.once('pointerup', next);
    this.input.keyboard?.once('keydown', (e: KeyboardEvent) =>
      e.key === 'Escape' ? this.endBriefing() : next(),
    );
  }

  private endBriefing(): void {
    for (const o of this.brief) o.destroy();
    this.brief = [];
    this.job.briefing = false;
    this.showPrompt(
      'Sneak to the wooden service corridor (top left), then press SPACE to deploy the Folder.',
    );
    announce('Go. Arrow keys or WASD to move, Shift to run, Space for the Folder.');
  }

  private showPrompt(text: string): void {
    this.prompt.setText(text).setAlpha(1);
    this.tweens.killTweensOf(this.prompt);
    this.tweens.add({ targets: this.prompt, alpha: 0, delay: 5500, duration: 600 });
  }

  private buildTouch(): void {
    const { width, height } = this.scale;
    this.input.addPointer(2);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.x < width / 2 && !this.stick && !this.job.briefing)
        this.stick = { id: p.id, x: p.x, y: p.y };
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.stick || p.id !== this.stick.id) return;
      const dx = p.x - this.stick.x;
      const dy = p.y - this.stick.y;
      const d = Math.hypot(dx, dy);
      touch.dx = d > 8 ? dx / Math.max(60, d) : 0;
      touch.dy = d > 8 ? dy / Math.max(60, d) : 0;
    });
    const end = (p: Phaser.Input.Pointer) => {
      if (this.stick && p.id === this.stick.id) {
        this.stick = null;
        touch.dx = 0;
        touch.dy = 0;
      }
    };
    this.input.on('pointerup', end);
    this.input.on('pointerupoutside', end);
    new Button(
      this,
      width - 160,
      height - 170,
      200,
      120,
      'FOLDER',
      () => (touch.fold = true),
      0x2a5a4a,
    );
    const run = new Button(
      this,
      width - 360,
      height - 120,
      150,
      90,
      'RUN',
      () => undefined,
      PALETTE.accent,
    );
    run.bg.on('pointerdown', () => (touch.sprint = true));
    run.bg.on('pointerup', () => (touch.sprint = false));
    run.bg.on('pointerout', () => (touch.sprint = false));
  }

  override update(): void {
    const m = this.job.m;
    const g = this.g;
    g.clear();
    this.objective.setText(
      m.hasDiamond ? `GET TO THE VAN!  ${Math.ceil(m.escapeLeft)}s` : 'STEAL THE DIAMOND',
    );
    this.objective.setColor(m.hasDiamond && m.escapeLeft < 10 ? PALETTE.textRed : PALETTE.text);
    // suspicion: a bar with words, never colour alone
    g.fillStyle(PALETTE.ink, 0.8).fillRect(20, 74, 260, 14);
    g.fillStyle(m.suspicion > 0.5 ? PALETTE.terracotta : PALETTE.gold, 1).fillRect(
      20,
      74,
      260 * m.suspicion,
      14,
    );
    g.lineStyle(2, PALETTE.cream, 0.8).strokeRect(20, 74, 260, 14);
    this.suspicionText.setText(
      m.suspicion <= 0.02 ? 'UNSEEN' : m.suspicion < 0.5 ? 'SUSPICIOUS…' : 'THEY’RE ONTO YOU!',
    );
    const f = m.folds;
    const state = active(f).length
      ? links(f).length
        ? `CONNECTED  ${Math.ceil(timeLeft(f))}s`
        : `REELING IN…  ${Math.ceil(timeLeft(f))}s`
      : f.cooldown > 0
        ? `RECHARGING ${Math.ceil(f.cooldown)}s`
        : f.charges > 0
          ? 'READY (SPACE)'
          : 'EMPTY';
    this.folderText.setText(
      `FOLDER  ${'◆'.repeat(f.charges)}${'◇'.repeat(Math.max(0, f.spec.charges - f.charges))}\n${state}`,
    );
  }
}
