import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

export class SplashScene extends Phaser.Scene {
  constructor() {
    super('Splash');
  }

  create(): void {
    const { height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.charcoal);
    addCenteredText(this, height / 2 - 20, '-80', { ...TEXT_STYLES.display, fontSize: '96px' });
    addCenteredText(this, height / 2 + 50, 'S T U D I O S', TEXT_STYLES.hud);
    this.time.delayedCall(900, () => this.scene.start('Intro'));
    this.input.once('pointerup', () => this.scene.start('Intro'));
  }
}
