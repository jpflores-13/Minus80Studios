import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { CAMPAIGN } from '../content/campaign';
import { Menu } from '../ui/Menu';
import { TEXT_STYLES } from '../ui/text';

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

    // Each block is stacked off the measured height of the one before it, not a guessed fixed
    // offset — the narrative text varies a fair amount in length across the seven expeditions,
    // and at the largeText accessibility setting the longer ones could run up into the title
    // above with the old fixed y=280.
    let y = 120;
    const header = this.add
      .text(width / 2, y, `EXPEDITION ${expedition.number} OF ${CAMPAIGN.length}`, {
        ...TEXT_STYLES.hint,
      })
      .setOrigin(0.5, 0);
    y += header.height + 16;
    const title = this.add
      .text(width / 2, y, expedition.title.toUpperCase(), {
        ...TEXT_STYLES.title,
        color: PALETTE.textGold,
      })
      .setOrigin(0.5, 0);
    y += title.height + 30;
    const narrative = this.add
      .text(width / 2, y, expedition.narrative, {
        ...TEXT_STYLES.body,
        align: 'center',
        wordWrap: { width: width - 300 },
      })
      .setOrigin(0.5, 0);
    y += narrative.height + 30;

    new Menu(
      this,
      [
        { label: () => 'BEGIN', action: () => this.begin(expedition, data.index) },
        { label: () => 'BACK TO TITLE', action: () => this.scene.start('Title') },
      ],
      width / 2,
      Math.max(height - 140, y),
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
