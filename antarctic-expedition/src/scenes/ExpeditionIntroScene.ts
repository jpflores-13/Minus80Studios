import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { CAMPAIGN } from '../content/campaign';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

/** The narrative beat shown before each campaign expedition. */
export class ExpeditionIntroScene extends Phaser.Scene {
  constructor() {
    super('ExpeditionIntro');
  }

  create(data: { index: number }): void {
    const expedition = CAMPAIGN[data.index];
    if (!expedition) {
      this.scene.start('CampaignEnding');
      return;
    }
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.midnight).fadeIn(300);

    addCenteredText(
      this,
      120,
      `EXPEDITION ${expedition.number} OF ${CAMPAIGN.length}`,
      TEXT_STYLES.hint,
    );
    addCenteredText(this, 170, expedition.title.toUpperCase(), {
      ...TEXT_STYLES.title,
      color: PALETTE.textGold,
    });
    addCenteredText(this, 280, expedition.narrative, {
      ...TEXT_STYLES.body,
      align: 'center',
      wordWrap: { width: width - 300 },
    });

    new Menu(
      this,
      [
        { label: () => 'BEGIN', action: () => this.begin(expedition, data.index) },
        { label: () => 'BACK TO TITLE', action: () => this.scene.start('Title') },
      ],
      width / 2,
      height - 140,
      360,
      58,
    );
    sound.playSong('title');
  }

  private begin(expedition: (typeof CAMPAIGN)[number], index: number): void {
    if (expedition.kind === 'dive') {
      this.scene.start('Dive', {
        id: expedition.id,
        name: expedition.title,
        nextScale: expedition.diveNextScale ?? 'drop',
        campaignIndex: index,
      });
    } else if (expedition.kind === 'oneDrop') {
      this.scene.start('OneDrop', { scaleId: expedition.scaleId ?? 'drop', campaignIndex: index });
    } else {
      this.scene.start('Reconstruct', { campaignIndex: index });
    }
  }
}
