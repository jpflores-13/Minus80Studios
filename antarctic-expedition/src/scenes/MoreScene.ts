import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { progress } from '../config/progress';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

/** Secondary modes and settings, kept off the title screen so that menu stays short. */
export class MoreScene extends Phaser.Scene {
  constructor() {
    super('More');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.midnight).fadeIn(200);
    addCenteredText(this, 100, 'MORE', TEXT_STYLES.title);
    new Menu(
      this,
      [
        { label: () => 'RECONSTRUCT (ARCADE)', action: () => this.scene.start('Reconstruct') },
        {
          label: () => `ENDLESS EXPEDITION (best ${progress().bestEndless})`,
          action: () => this.scene.start('Endless'),
        },
        { label: () => 'DISCOVERY JOURNAL', action: () => this.scene.start('Journal') },
        { label: () => 'SCIENTIFIC MYSTERIES', action: () => this.scene.start('Mystery') },
        { label: () => 'SETTINGS & ACCESSIBILITY', action: () => this.scene.start('Settings') },
        { label: () => 'MORE -80 STUDIOS GAMES', action: () => (window.location.href = '../') },
      ],
      width / 2,
      180,
      560,
      62,
      () => this.scene.start('Title'),
    );
    addCenteredText(this, height - 34, 'Esc to go back', TEXT_STYLES.hint);
  }
}
