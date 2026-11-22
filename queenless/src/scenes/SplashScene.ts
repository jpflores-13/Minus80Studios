import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

// Studio splash. Any key or tap skips it.
export class SplashScene extends Phaser.Scene {
  constructor() {
    super('Splash');
  }

  create(): void {
    const { height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.night);
    const mark = addCenteredText(this, height * 0.44, '-80', {
      ...TEXT_STYLES.display,
      fontSize: '140px',
      color: '#f6ead0',
    }).setAlpha(0);
    const studio = addCenteredText(this, height * 0.62, 'S T U D I O S', {
      ...TEXT_STYLES.hud,
      color: PALETTE.textGold,
    }).setAlpha(0);
    this.tweens.add({ targets: [mark, studio], alpha: 1, duration: 900 });
    let done = false;
    const next = () => {
      if (done) return;
      done = true;
      sound.unlock();
      this.cameras.main.fadeOut(400);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Intro'));
    };
    this.time.delayedCall(2600, next);
    this.input.keyboard?.once('keydown', next);
    this.input.once('pointerdown', next);
  }
}
