import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { ACHIEVEMENT_ORDER } from '../content/achievements';
import { PALETTE } from '../config/gameConfig';
import { progress } from '../config/progress';
import { LEVELS } from '../levels';
import { toggleFullscreen } from '../ui/fullscreen';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';
import { clearedCount } from './LevelSelectScene';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.charcoal).fadeIn(300);
    this.add
      .image(width / 2, height, 'tile-soil')
      .setScale(60, 8)
      .setAlpha(0.6);
    const mole = this.add
      .image(width * 0.2, height * 0.62, 'mole-0')
      .setScale(7)
      .setRotation(-0.3);
    if (!progress().reducedEffects)
      this.tweens.add({
        targets: mole,
        angle: -10,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    addCenteredText(this, 140, 'STARSTRUCK.', { ...TEXT_STYLES.display, fontSize: '96px' });
    addCenteredText(this, 220, 'It’s not what you see. It’s what you feel.', {
      ...TEXT_STYLES.hud,
      color: PALETTE.textRose,
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
            `ACHIEVEMENTS (${progress().achievements.length}/${ACHIEVEMENT_ORDER.length})`,
          action: () => this.scene.start('Achievements'),
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
      70,
    );
    addCenteredText(this, height - 30, 'A Minus 80 Studios game', TEXT_STYLES.hint);
    sound.playSong('title');
  }
}
