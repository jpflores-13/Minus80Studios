import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress } from '../config/progress';
import { LEVELS } from '../levels';
import { toggleFullscreen } from '../ui/fullscreen';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

/** How many levels have a saved best score, used to gate the next one and the title's label. */
export function clearedCount(): number {
  return LEVELS.filter((l) => progress().best[l.id]).length;
}

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.night).fadeIn(300);
    const bee = this.add
      .image(width * 0.18, height * 0.6, 'bee-0')
      .setScale(6)
      .setTint(0xe8b84b);
    if (!progress().reducedEffects)
      this.tweens.add({
        targets: bee,
        angle: -8,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    addCenteredText(this, 120, 'QUEENLESS', { ...TEXT_STYLES.display, fontSize: '80px' });
    addCenteredText(this, 196, 'One colony. No queen. Every bee matters.', {
      ...TEXT_STYLES.hud,
      color: PALETTE.textMoss,
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
          label: () => {
            const best = progress().bestQueenless;
            return `QUEENLESS MODE${best.score ? `  (best ${best.score}, ${best.seconds}s)` : ''}`;
          },
          help: 'Endless. No queen from the start, and it only gets harder from there.',
          action: () => this.scene.start('Level', { queenlessMode: true }),
        },
        { label: () => 'SETTINGS & ACCESSIBILITY', action: () => this.scene.start('Settings') },
        {
          label: () => 'WATCH THE OPENING',
          action: () => this.scene.start('Intro', { replay: true }),
        },
        { label: () => 'DID YOU KNOW?', action: () => this.scene.start('Ending') },
        ...(this.sys.game.device.fullscreen.available
          ? [{ label: () => 'FULL SCREEN', action: () => toggleFullscreen(this) }]
          : []),
        { label: () => 'MORE -80 STUDIOS GAMES', action: () => (window.location.href = '../') },
      ],
      width / 2 + 120,
      330,
      520,
      62,
    );
    addCenteredText(this, height - 30, 'A Minus 80 Studios game', TEXT_STYLES.hint);
    sound.playSong('title');
  }
}
