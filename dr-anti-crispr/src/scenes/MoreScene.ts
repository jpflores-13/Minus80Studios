import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { BESTIARY_ORDER } from '../content/bestiary';
import { PALETTE } from '../config/gameConfig';
import { progress } from '../config/progress';
import { toggleFullscreen } from '../ui/fullscreen';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

// The secondary stuff off the title screen, so the primary menu stays short enough to fit on
// screen: the enemy glossary, display options, and the hub. The science reveal (DID YOU KNOW?)
// stays on the title screen itself, it's not secondary.
export class MoreScene extends Phaser.Scene {
  constructor() {
    super('More');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.night).fadeIn(200);
    addCenteredText(this, 160, 'MORE', TEXT_STYLES.title);
    new Menu(
      this,
      [
        {
          label: () => `ENEMY INTEL (${progress().encountered.length}/${BESTIARY_ORDER.length})`,
          action: () => this.scene.start('Bestiary'),
        },
        ...(this.sys.game.device.fullscreen.available
          ? [{ label: () => 'FULL SCREEN', action: () => toggleFullscreen(this) }]
          : []),
        { label: () => 'MORE -80 STUDIOS GAMES', action: () => (window.location.href = '../') },
      ],
      width / 2,
      320,
      560,
      78,
      () => this.scene.start('Title'),
    );
    addCenteredText(this, height - 36, 'Esc to go back', TEXT_STYLES.hint);
    sound.playSong('title');
  }
}
