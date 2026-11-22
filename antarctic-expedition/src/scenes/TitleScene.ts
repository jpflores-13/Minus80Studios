import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress } from '../config/progress';
import { CAMPAIGN } from '../content/campaign';
import { Button } from '../ui/Button';
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
    // Always visible, not buried in MORE: a one-click way back to the rest of the studio.
    new Button(this, 104, 34, 150, 34, '-80 STUDIOS', () => (window.location.href = '../'));
    addCenteredText(this, 150, 'ANTARCTIC EXPEDITION', {
      ...TEXT_STYLES.display,
      fontSize: '58px',
      color: PALETTE.textGold,
    });
    addCenteredText(this, 206, 'A research vessel in the Southern Ocean.', {
      ...TEXT_STYLES.hud,
      color: PALETTE.textDim,
    });
    const cleared = progress().campaignCleared;
    const campaignLabel = () =>
      cleared === 0
        ? 'BEGIN THE EXPEDITION'
        : cleared >= CAMPAIGN.length
          ? 'REPLAY THE EXPEDITION'
          : `CONTINUE — EXPEDITION ${cleared + 1} OF ${CAMPAIGN.length}`;
    new Menu(
      this,
      [
        {
          label: campaignLabel,
          action: () =>
            this.scene.start('ExpeditionIntro', {
              index: cleared >= CAMPAIGN.length ? 0 : cleared,
            }),
        },
        {
          label: () => 'DIVE (ARCADE)',
          action: () => this.scene.start('Dive', { nextScale: 'drop' }),
        },
        { label: () => 'ONE DROP (ARCADE)', action: () => this.scene.start('ScaleSelect') },
        { label: () => 'MORE', action: () => this.scene.start('More') },
      ],
      width / 2,
      264,
      560,
      62,
    );
    addCenteredText(this, height - 22, 'A Minus 80 Studios game', TEXT_STYLES.hint);
    sound.playSong('title');
  }
}
