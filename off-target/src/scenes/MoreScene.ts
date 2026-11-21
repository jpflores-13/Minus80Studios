import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { toggleFullscreen } from '../ui/fullscreen';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

// The secondary stuff off the title screen, so the primary menu stays short enough to fit on
// screen: the machine glossary, display options, and the hub. The science reveal (DID YOU
// KNOW?) stays on the title screen itself, it's not secondary.
export class MoreScene extends Phaser.Scene {
  constructor() {
    super('More');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.night).fadeIn(200);
    addCenteredText(this, 110, 'MORE', TEXT_STYLES.title);
    new Menu(
      this,
      [
        { label: () => 'THE MACHINES', action: () => this.scene.start('Machines') },
        ...(this.sys.game.device.fullscreen.available
          ? [
              {
                label: () => (this.scale.isFullscreen ? 'EXIT FULL SCREEN' : 'FULL SCREEN'),
                action: () => toggleFullscreen(this),
              },
            ]
          : []),
        { label: () => 'MORE -80 STUDIOS GAMES', action: () => (window.location.href = '../') },
      ],
      width / 2,
      240,
      440,
      62,
      () => this.scene.start('Title'),
    );
    addCenteredText(this, height - 26, 'Esc to go back', TEXT_STYLES.hint);
    sound.playSong('title');
  }
}
