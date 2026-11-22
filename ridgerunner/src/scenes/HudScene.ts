import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { Button } from '../ui/Button';
import { TEXT_STYLES } from '../ui/text';
import { touchInput, type LevelScene } from './LevelScene';

export class HudScene extends Phaser.Scene {
  private level!: LevelScene;
  private g!: Phaser.GameObjects.Graphics;
  private stats!: Phaser.GameObjects.Text;
  private stick: { id: number; x: number; y: number } | null = null;

  constructor() {
    super('Hud');
  }

  create(data: { level: LevelScene }): void {
    this.level = data.level;
    const { width, height } = this.scale;
    this.g = this.add.graphics();
    this.stats = this.add
      .text(width - 20, 16, '', { ...TEXT_STYLES.hud, align: 'right' })
      .setOrigin(1, 0);
    this.add.text(20, 50, 'MOISTURE', {
      ...TEXT_STYLES.hud,
      fontSize: '14px',
      color: PALETTE.textDim,
    });

    if (this.sys.game.device.input.touch) this.buildTouch(width, height);
    const pause = new Button(this, width - 50, height - 50, 70, 56, '❚❚', () => this.level.pause());
    pause.bg.setDepth(60);
    pause.label.setDepth(61);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      Object.assign(touchInput, { dx: 0, dy: 0 }),
    );
  }

  private buildTouch(width: number, height: number): void {
    this.input.addPointer(2);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.x < width / 2 && p.y < height - 100 && !this.stick)
        this.stick = { id: p.id, x: p.x, y: p.y };
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
  }

  override update(): void {
    const s = this.level.state;
    const g = this.g;
    g.clear();
    const frac = s.moisture / 100;
    g.fillStyle(0x1c2a22, 1).fillRect(20, 20, 260, 20);
    g.fillStyle(frac > 0.3 ? PALETTE.stream : PALETTE.terracotta, 1).fillRect(
      20,
      20,
      260 * frac,
      20,
    );
    g.lineStyle(2, PALETTE.gold, 1).strokeRect(20, 20, 260, 20);

    const left = Math.max(0, Math.ceil(s.level.timeLimit - s.time));
    this.stats.setText(
      `${left}s left\nStreams ${Math.round(s.distanceStream)}px  Overland ${Math.round(s.distanceOverland)}px\nCrossings ${s.watershedCrossings}`,
    );
  }
}
