import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress } from '../config/progress';
import { toggleFullscreen } from '../ui/fullscreen';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

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
    const best = progress().best['level-1'];
    new Menu(
      this,
      [
        {
          label: () => `PLAY: HELLO, DARKNESS${best ? `  ${'★'.repeat(best.stars)}` : ''}`,
          action: () => this.scene.start('Level', { levelId: 'level-1' }),
        },
        { label: () => 'SETTINGS & ACCESSIBILITY', action: () => this.scene.start('Settings') },
        {
          label: () => 'WATCH THE OPENING',
          action: () => this.scene.start('Intro', { replay: true }),
        },
        ...(this.sys.game.device.fullscreen.available
          ? [{ label: () => 'FULL SCREEN', action: () => toggleFullscreen(this) }]
          : []),
      ],
      width / 2 + 120,
      330,
      520,
      70,
    );
    addCenteredText(
      this,
      height - 30,
      'Prototype: Level 1 · A Minus 80 Studios game',
      TEXT_STYLES.hint,
    );
    sound.playSong('title');
  }
}
