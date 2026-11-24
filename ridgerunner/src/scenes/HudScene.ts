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
  private tailLabel!: Phaser.GameObjects.Text;

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

    // the tail raise is only worth showing on levels that have predators
    this.tailLabel = this.add
      .text(20, 76, '', { ...TEXT_STYLES.hud, fontSize: '14px', color: PALETTE.textDim })
      .setVisible(this.level.state.land.dens.length > 0);
    if (this.sys.game.device.input.touch) this.buildTouch(width, height);
    const pause = new Button(this, width - 50, height - 50, 70, 56, '❚❚', () => this.level.pause());
    pause.bg.setDepth(60);
    pause.label.setDepth(61);
    this.showIntro();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      Object.assign(touchInput, { dx: 0, dy: 0, defend: false }),
    );
  }

  /**
   * The level's intro lines and controls, on screen. They used to go only to the
   * screen-reader announcement, so a sighted player never saw them (including how the
   * predators and the tail raise work). Non-blocking: play carries on underneath, and after a
   * short grace period any key or tap closes it.
   */
  private showIntro(): void {
    const level = this.level.state.level;
    const hasPredators = this.level.state.land.dens.length > 0;
    const x = 20;
    const y = 104;
    const w = 520;
    const controls =
      'Move: arrow keys, WASD, or drag.' +
      (hasPredators ? '  Raise tail: SPACE or E (or TAIL).' : '');
    const bg = this.add.graphics().setDepth(70);
    const title = this.add
      .text(x + 16, y + 12, level.name.toUpperCase(), { ...TEXT_STYLES.hud, fontSize: '19px' })
      .setDepth(71);
    const body = this.add
      .text(x + 16, title.y + title.height + 8, level.intro.join('\n\n'), {
        ...TEXT_STYLES.hud,
        fontSize: '15px',
        wordWrap: { width: w - 32 },
        lineSpacing: 3,
      })
      .setDepth(71);
    const foot = this.add
      .text(x + 16, body.y + body.height + 10, `${controls}\nPress any key or tap to close.`, {
        ...TEXT_STYLES.hud,
        fontSize: '13px',
        color: PALETTE.textDim,
        wordWrap: { width: w - 32 },
      })
      .setDepth(71);
    const h = foot.y + foot.height + 12 - y;
    bg.fillStyle(PALETTE.ink, 0.85).fillRoundedRect(x, y, w, h, 10);
    bg.lineStyle(2, PALETTE.gold, 0.7).strokeRoundedRect(x, y, w, h, 10);
    const items = [bg, title, body, foot];

    const shownAt = this.time.now;
    let closed = false;
    const kb = this.input.keyboard;
    const close = () => {
      if (closed) return;
      closed = true;
      kb?.off('keydown', onSkip);
      this.input.off('pointerdown', onSkip);
      this.tweens.add({
        targets: items,
        alpha: 0,
        duration: 300,
        onComplete: () => items.forEach((o) => o.destroy()),
      });
    };
    const onSkip = () => {
      if (this.time.now - shownAt > 1200) close();
    };
    kb?.on('keydown', onSkip);
    this.input.on('pointerdown', onSkip);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      kb?.off('keydown', onSkip);
      this.input.off('pointerdown', onSkip);
    });
    this.time.delayedCall(hasPredators ? 12000 : 8000, close);
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
    if (this.level.state.land.dens.length > 0) {
      const tail = new Button(this, width - 150, height - 60, 120, 76, 'TAIL', () => {
        touchInput.defend = true;
      });
      tail.bg.setDepth(60);
      tail.label.setDepth(61);
    }
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

    if (this.tailLabel.visible) {
      const cd = s.defence.cooldown;
      this.tailLabel.setText(
        s.defence.timer > 0
          ? 'TAIL RAISED'
          : cd > 0
            ? `TAIL  recovering ${cd.toFixed(1)}s`
            : 'TAIL  ready (SPACE / E)',
      );
      this.tailLabel.setColor(cd > 0 ? PALETTE.textDim : PALETTE.textGold);
    }

    const left = Math.max(0, Math.ceil(s.level.timeLimit - s.time));
    this.stats.setText(
      `${left}s left\nStreams ${Math.round(s.distanceStream)}px  Overland ${Math.round(s.distanceOverland)}px\nCrossings ${s.watershedCrossings}`,
    );
  }
}
