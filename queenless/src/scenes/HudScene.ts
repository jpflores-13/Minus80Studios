import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { colonyHealth } from '../systems/colony';
import { Button } from '../ui/Button';
import { TEXT_STYLES } from '../ui/text';
import { touchInput, type LevelScene } from './LevelScene';

// Food, brood health, nest cleanliness, time, and the Buzz Pulse button. Drawn at screen
// resolution on top of the zoomed level.
export class HudScene extends Phaser.Scene {
  private level!: LevelScene;
  private g!: Phaser.GameObjects.Graphics;
  private statusText!: Phaser.GameObjects.Text;
  private pulseBtn: Button | null = null;
  private stick: { id: number; x: number; y: number } | null = null;

  constructor() {
    super('Hud');
  }

  create(data: { level: LevelScene }): void {
    this.level = data.level;
    const { width, height } = this.scale;
    this.g = this.add.graphics().setDepth(40);
    this.statusText = this.add
      .text(width / 2, 16, '', { ...TEXT_STYLES.hud, fontSize: '18px', align: 'center' })
      .setOrigin(0.5, 0)
      .setDepth(41);
    this.add.text(20, 50, 'FOOD', { ...TEXT_STYLES.hud, fontSize: '13px', color: PALETTE.textDim });
    this.add.text(20, 82, 'BROOD', {
      ...TEXT_STYLES.hud,
      fontSize: '13px',
      color: PALETTE.textDim,
    });
    this.add.text(20, 114, 'NEST', {
      ...TEXT_STYLES.hud,
      fontSize: '13px',
      color: PALETTE.textDim,
    });

    if (this.sys.game.device.input.touch) this.buildTouch();
    const pause = new Button(this, width - 50, height - 50, 70, 56, '❚❚', () => this.level.pause());
    pause.bg.setDepth(60);
    pause.label.setDepth(61);
  }

  private buildTouch(): void {
    const { width, height } = this.scale;
    this.input.addPointer(3);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.x < width * 0.5 && !this.stick) this.stick = { id: p.id, x: p.x, y: p.y };
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.stick || p.id !== this.stick.id) return;
      const dx = p.x - this.stick.x;
      const dy = p.y - this.stick.y;
      const d = Math.hypot(dx, dy);
      touchInput.dx = d > 8 ? dx / Math.max(50, d) : 0;
      touchInput.dy = d > 8 ? dy / Math.max(50, d) : 0;
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
    this.pulseBtn = new Button(
      this,
      width - 150,
      height - 150,
      180,
      110,
      'PULSE',
      () => (touchInput.pulse = true),
      PALETTE.earthLight,
    );
  }

  override update(): void {
    const c = this.level.colony;
    const g = this.g;
    g.clear();
    const bars: [number, number, number][] = [
      [50, Math.min(100, c.foodReserves) / 100, PALETTE.honey],
      [82, c.broodHealth / 100, PALETTE.rose],
      [114, c.nestCleanliness / 100, PALETTE.moss],
    ];
    for (const [y, frac, color] of bars) {
      g.fillStyle(0x1a120a, 1).fillRect(90, y, 220, 18);
      g.fillStyle(color, 1).fillRect(90, y, 220 * Phaser.Math.Clamp(frac, 0, 1), 18);
      g.lineStyle(2, PALETTE.honey, 0.6).strokeRect(90, y, 220, 18);
    }
    const level = this.level.level;
    const timeLeft = level ? Math.max(0, level.colony.durationSeconds - c.time) : null;
    this.statusText.setText(
      level
        ? `${level.name.toUpperCase()}   ·   ${Math.ceil(timeLeft ?? 0)}s   ·   health ${Math.round(colonyHealth(c))}`
        : `QUEENLESS MODE   ·   survived ${Math.floor(c.time)}s   ·   health ${Math.round(colonyHealth(c))}`,
    );
    if (this.pulseBtn) {
      this.pulseBtn.setVisible(this.level.pulseEnabled);
      const ready = this.level.pulseCooldown <= 0;
      this.pulseBtn.setText(ready ? 'PULSE' : `${Math.ceil(this.level.pulseCooldown)}s`);
      this.pulseBtn.setEnabled(ready);
    }
  }
}
