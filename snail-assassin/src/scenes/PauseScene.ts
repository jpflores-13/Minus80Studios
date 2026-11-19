import Phaser from 'phaser';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

/** Overlay shown while the hunt is paused. Esc resumes, R restarts, T returns to title. */
export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create(data: { characterId: string }): void {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x000000, 0.6).setOrigin(0);
    addCenteredText(this, height * 0.4, 'PAUSED', TEXT_STYLES.title);
    addCenteredText(
      this,
      height * 0.55,
      'Esc  resume    ·    R  restart    ·    T  title',
      TEXT_STYLES.body,
    );

    const kb = this.input.keyboard;
    const close = (next?: () => void) => {
      kb?.removeAllListeners();
      this.scene.stop();
      next?.();
    };
    kb?.on('keydown-ESC', () => close(() => this.scene.resume('Hunt')));
    kb?.on('keydown-R', () =>
      close(() => this.scene.get('Hunt').scene.restart({ characterId: data.characterId })),
    );
    kb?.on('keydown-T', () => close(() => this.scene.get('Hunt').scene.start('Title')));
    this.input.once('pointerdown', () => close(() => this.scene.resume('Hunt')));
  }
}
