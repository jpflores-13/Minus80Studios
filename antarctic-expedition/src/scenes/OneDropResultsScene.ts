import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { clearExpedition } from '../config/progress';
import { SCALES, type ScaleId } from '../content/organisms';
import { Menu, type MenuItem } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

interface ResultsData {
  scaleId: ScaleId;
  won: boolean;
  score: number;
  captured: number;
  objective: number;
  accuracy: number;
  unknownsDocumented: number;
  bestCombo: number;
  stars: number;
  campaignIndex?: number;
}

export class OneDropResultsScene extends Phaser.Scene {
  constructor() {
    super('OneDropResults');
  }

  create(data: ResultsData): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.midnight).fadeIn(200);
    const info = SCALES[data.scaleId];

    // Each block is stacked off the measured height of the one before it, not a guessed fixed
    // offset, so the largeText accessibility setting (which scales every font up) can't make a
    // longer title or stats block run into the block below it.
    let y = 110;
    const titleText = this.add
      .text(width / 2, y, data.won ? 'SAMPLE DOCUMENTED' : 'TIME EXPIRED', {
        ...TEXT_STYLES.title,
        color: data.won ? PALETTE.textMint : PALETTE.textCoral,
      })
      .setOrigin(0.5, 0);
    y += titleText.height + 14;
    const subtitle = this.add.text(width / 2, y, info.name, TEXT_STYLES.hint).setOrigin(0.5, 0);
    y += subtitle.height + 20;

    const stars = '★'.repeat(data.stars) + '☆'.repeat(3 - data.stars);
    const starsText = this.add
      .text(width / 2, y, stars, {
        ...TEXT_STYLES.title,
        color: PALETTE.textGold,
        fontSize: '36px',
      })
      .setOrigin(0.5, 0);
    y += starsText.height + 24;

    const lines = [
      `Score: ${data.score}`,
      `Documented: ${data.captured} / ${data.objective}`,
      `Identification accuracy: ${Math.round(data.accuracy * 100)}%`,
      `Uncertain particles documented honestly: ${data.unknownsDocumented}`,
      `Best combo: x${data.bestCombo}`,
    ];
    const statsText = this.add
      .text(width / 2, y, lines.join('\n'), { ...TEXT_STYLES.body, align: 'center' })
      .setOrigin(0.5, 0);
    y += statsText.height + 30;

    if (data.unknownsDocumented > 0) {
      const note = this.add
        .text(
          width / 2,
          y,
          'Marking something "unknown" instead of guessing is good science. It is never a mistake.',
          { ...TEXT_STYLES.hint, align: 'center', wordWrap: { width: width - 200 } },
        )
        .setOrigin(0.5, 0);
      y += note.height + 20;
    }

    const items: MenuItem[] = [];
    if (data.campaignIndex !== undefined) {
      if (data.won) {
        clearExpedition(data.campaignIndex);
        items.push({
          label: () => 'CONTINUE EXPEDITION',
          action: () => this.scene.start('ExpeditionIntro', { index: data.campaignIndex! + 1 }),
        });
      } else {
        items.push({
          label: () => 'RETRY EXPEDITION',
          action: () => this.scene.start('ExpeditionIntro', { index: data.campaignIndex! }),
        });
      }
    } else {
      items.push({
        label: () => 'PLAY AGAIN',
        action: () => this.scene.start('OneDrop', { scaleId: data.scaleId }),
      });
      items.push({ label: () => 'CHOOSE A SCALE', action: () => this.scene.start('ScaleSelect') });
    }
    items.push({ label: () => 'TITLE', action: () => this.scene.start('Title') });

    const menuY = Math.min(Math.max(460, y), height - 200);
    new Menu(this, items, width / 2, menuY, 460, 62, () => this.scene.start('ScaleSelect'));
    addCenteredText(this, height - 34, 'Esc to go back', TEXT_STYLES.hint);
    sound.playSong('title');
  }
}
