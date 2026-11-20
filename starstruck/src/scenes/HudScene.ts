import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { OBJECTS } from '../content/objects';
import { multiplier } from '../systems/game';
import { Button } from '../ui/Button';
import { TEXT_STYLES } from '../ui/text';
import { touchInput, type LevelScene } from './LevelScene';

// The heads-up display: energy, combo, score, objective, time, prompts and touch controls.
export class HudScene extends Phaser.Scene {
  private level!: LevelScene;
  private g!: Phaser.GameObjects.Graphics;
  private stats!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private stick: { id: number; x: number; y: number } | null = null;

  constructor() {
    super('Hud');
  }

  create(data: { level: LevelScene }): void {
    this.level = data.level;
    const { width, height } = this.scale;
    this.g = this.add.graphics();
    this.stats = this.add
      .text(width - 20, 16, '', { ...TEXT_STYLES.hud, fontSize: '20px', align: 'right' })
      .setOrigin(1, 0);
    this.add.text(20, 50, 'ENERGY', {
      ...TEXT_STYLES.hud,
      fontSize: '14px',
      color: PALETTE.textDim,
    });
    this.comboText = this.add
      .text(width / 2, 90, '', { ...TEXT_STYLES.title, fontSize: '40px', color: PALETTE.textAmber })
      .setOrigin(0.5)
      .setAlpha(0);
    this.promptText = this.add
      .text(width / 2, height - 40, '', {
        ...TEXT_STYLES.body,
        fontSize: '20px',
        align: 'center',
        backgroundColor: '#171c22cc',
        padding: { x: 12, y: 6 },
        wordWrap: { width: 900 },
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.level.events.on('eat', (e: { label: string | null; combo: number }) =>
      this.popCombo(e.label ?? (e.combo > 1 ? `×${multiplier(e.combo)}` : 'YUM!')),
    );
    this.level.events.on('wrong', () => this.popCombo('YUCK!', PALETTE.textRose));
    this.level.events.on('prompt', (t: string) => this.showPrompt(t));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.level.events.off('eat');
      this.level.events.off('wrong');
      this.level.events.off('prompt');
      Object.assign(touchInput, { dx: 0, dy: 0, focus: false, bite: false });
    });

    if (this.sys.game.device.input.touch) this.buildTouch();
    const pause = new Button(this, width - 50, height - 50, 70, 56, '❚❚', () => this.level.pause());
    pause.bg.setDepth(60);
    pause.label.setDepth(61);
  }

  private buildTouch(): void {
    const { width, height } = this.scale;
    this.input.addPointer(2);
    // left half: a floating stick wherever you put your thumb
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.x < width / 2 && !this.stick) this.stick = { id: p.id, x: p.x, y: p.y };
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.stick || p.id !== this.stick.id) return;
      const dx = p.x - this.stick.x;
      const dy = p.y - this.stick.y;
      const d = Math.hypot(dx, dy);
      touchInput.dx = d > 8 ? dx / Math.max(60, d) : 0;
      touchInput.dy = d > 8 ? dy / Math.max(60, d) : 0;
    });
    const end = (p: Phaser.Input.Pointer) => {
      if (this.stick && p.id === this.stick.id) {
        this.stick = null;
        touchInput.dx = 0;
        touchInput.dy = 0;
      }
    };
    this.input.on('pointerup', end);
    this.input.on('pointerupoutside', end);
    const bite = new Button(
      this,
      width - 150,
      height - 160,
      170,
      120,
      'BITE',
      () => (touchInput.bite = true),
      0x8a3a48,
    );
    const focus = new Button(
      this,
      width - 340,
      height - 120,
      150,
      100,
      'FOCUS',
      () => undefined,
      0x2a4a59,
    );
    focus.bg.on('pointerdown', () => (touchInput.focus = true));
    focus.bg.on('pointerup', () => (touchInput.focus = false));
    focus.bg.on('pointerout', () => (touchInput.focus = false));
    bite.bg.on('pointerdown', () => (touchInput.bite = true));
  }

  private popCombo(text: string, color: string = PALETTE.textAmber): void {
    this.comboText.setText(text).setColor(color).setAlpha(1).setScale(1.3);
    this.tweens.killTweensOf(this.comboText);
    this.tweens.add({ targets: this.comboText, scale: 1, duration: 200 });
    this.tweens.add({ targets: this.comboText, alpha: 0, delay: 900, duration: 400 });
  }

  private showPrompt(text: string): void {
    this.promptText.setText(text).setAlpha(1);
    this.tweens.killTweensOf(this.promptText);
    this.tweens.add({ targets: this.promptText, alpha: 0, delay: 5000, duration: 600 });
  }

  override update(): void {
    const s = this.level.state;
    const g = this.g;
    g.clear();
    // energy: a bar with the value written beside it
    const frac = s.energy / s.character.maxEnergy;
    g.fillStyle(0x2a211c, 1).fillRect(20, 20, 320, 22);
    g.fillStyle(frac > 0.35 ? PALETTE.amber : PALETTE.rose, 1).fillRect(20, 20, 320 * frac, 22);
    g.lineStyle(2, PALETTE.sand, 1).strokeRect(20, 20, 320, 22);
    const goal = s.level.objective;
    const left = Math.max(0, Math.ceil(s.level.timeLimit - s.time));
    this.stats.setText(
      `${OBJECTS[goal.material].name.toUpperCase()}S ${s.eaten[goal.material] ?? 0}/${goal.count}   ${left}s\nSCORE ${s.score}${s.combo > 1 ? `   COMBO ×${multiplier(s.combo)}` : ''}`,
    );
    // combo timer: a shrinking line under the bar
    if (s.combo > 0)
      g.fillStyle(PALETTE.coral, 1).fillRect(
        20,
        48 + 18,
        320 * Math.max(0, s.comboTimer / s.character.comboWindow),
        4,
      );
  }
}
