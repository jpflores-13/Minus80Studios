import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.midnight).fadeIn(300);
    const g = this.add.graphics();
    g.fillStyle(PALETTE.marine, 0.4);
    g.fillRect(0, height - 160, width, 160);
    for (let i = 0; i < 40; i++) {
      g.fillStyle(PALETTE.ice, 0.08 + (i % 5) * 0.015);
      g.fillCircle((i * 97) % width, (i * 53) % height, 1 + (i % 3));
    }
    addCenteredText(this, 150, 'ANTARCTIC EXPEDITION', {
      ...TEXT_STYLES.display,
      fontSize: '58px',
      color: PALETTE.textGold,
    });
    addCenteredText(this, 212, 'A research vessel in the Southern Ocean.', {
      ...TEXT_STYLES.hud,
      color: PALETTE.textDim,
    });
    new Menu(
      this,
      [
        {
          label: () => 'DIVE (ARCADE)',
          action: () => this.scene.start('Dive', { nextScale: 'drop' }),
        },
        { label: () => 'ONE DROP (ARCADE)', action: () => this.scene.start('ScaleSelect') },
        { label: () => 'SOUND ON / OFF', action: () => void sound.toggleMute() },
        { label: () => 'MORE -80 STUDIOS GAMES', action: () => (window.location.href = '../') },
      ],
      width / 2,
      330,
      560,
      70,
    );
    addCenteredText(
      this,
      height - 34,
      'Prototype: ONE DROP microscopy minigame · A Minus 80 Studios game',
      TEXT_STYLES.hint,
    );
    sound.playSong('title');
  }
}
