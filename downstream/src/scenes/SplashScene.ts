import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

// Studio splash. Any key or click skips it.
export class SplashScene extends Phaser.Scene {
  constructor() {
    super('Splash');
  }

  create(): void {
    const { height } = this.scale;
    this.cameras.main.setBackgroundColor(0x10241a);
    const mark = addCenteredText(this, height * 0.44, '-80', {
      ...TEXT_STYLES.display,
      fontSize: '140px',
      color: '#f4ead2',
    }).setAlpha(0);
    const studio = addCenteredText(this, height * 0.62, 'S T U D I O S', {
      ...TEXT_STYLES.bodyLight,
      color: '#cfe0cf',
    }).setAlpha(0);
    this.tweens.add({ targets: [mark, studio], alpha: 1, duration: 900, ease: 'Sine.easeOut' });

    let done = false;
    const next = () => {
      if (done) return;
      done = true;
      sound.unlock();
      this.cameras.main.fadeOut(400);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Title'));
    };
    this.time.delayedCall(2600, next);
    this.input.keyboard?.once('keydown', next);
    this.input.once('pointerdown', next);
  }
}
