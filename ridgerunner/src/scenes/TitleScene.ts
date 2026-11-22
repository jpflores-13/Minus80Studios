import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { progress } from '../config/progress';
import { LEVELS } from '../levels';
import { drawBackdrop, halo } from '../render/backdrop';
import { Button } from '../ui/Button';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

function clearedCount(): number {
  return LEVELS.filter((l) => progress().best[l.id]).length;
}

export class TitleScene extends Phaser.Scene {
  private haloFx!: Phaser.GameObjects.Graphics;
  private moss!: Phaser.GameObjects.Image;

  constructor() {
    super('Title');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.forest).fadeIn(300);
    drawBackdrop(this);
    this.haloFx = this.add.graphics().setDepth(-1);
    this.moss = this.add
      .image(width * 0.18, height * 0.6, 'moss-0')
      .setScale(6)
      .setDepth(0);
    if (!progress().reducedEffects)
      this.tweens.add({
        targets: this.moss,
        y: '+=10',
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    // Always visible, not just a menu item further down: a one-click way back to the studio.
    new Button(this, 104, 34, 150, 34, '-80 STUDIOS', () => (window.location.href = '../'));
    addCenteredText(this, 120, 'RIDGERUNNER', { ...TEXT_STYLES.display, fontSize: '80px' });
    addCenteredText(this, 190, 'Follow the water. Cross the divide.', {
      ...TEXT_STYLES.hud,
      color: PALETTE.textDim,
    });
    const cleared = clearedCount();
    const next = LEVELS[Math.min(cleared, LEVELS.length - 1)] ?? LEVELS[0]!;
    new Menu(
      this,
      [
        {
          label: () => (cleared > 0 ? `CONTINUE: ${next.name.toUpperCase()}` : 'PLAY'),
          action: () =>
            progress().seenIntro
              ? this.scene.start('Level', { levelId: next.id })
              : this.scene.start('Intro'),
        },
        { label: () => 'LEVELS', action: () => this.scene.start('LevelSelect') },
        {
          label: () =>
            `BEYOND THE DIVIDE${progress().best['beyond'] ? `  (best ${progress().best['beyond']!.score})` : ''}`,
          action: () => this.scene.start('Level', { beyond: true }),
        },
        { label: () => 'SETTINGS & ACCESSIBILITY', action: () => this.scene.start('Settings') },
        { label: () => 'DID YOU KNOW?', action: () => this.scene.start('Ending') },
        { label: () => 'MORE -80 STUDIOS GAMES', action: () => (window.location.href = '../') },
      ],
      width / 2 + 120,
      330,
      520,
      68,
    );
    addCenteredText(this, height - 30, 'A Minus 80 Studios game', TEXT_STYLES.hint);
  }

  override update(time: number): void {
    this.haloFx.clear();
    const pulse = progress().reducedEffects ? 0 : Math.sin(time / 260) * 6;
    halo(this.haloFx, this.moss.x, this.moss.y, 86 + pulse, PALETTE.gold);
  }
}
