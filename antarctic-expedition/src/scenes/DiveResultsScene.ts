import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { clearExpedition } from '../config/progress';
import { SCALES, type ScaleId } from '../content/organisms';
import type { PhotoResult } from '../systems/dive';
import { Menu, type MenuItem } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

interface DiveResultsData {
  name: string;
  photos: PhotoResult[];
  totalScore: number;
  speciesCount: number;
  disturbanceEvents: number;
  sampleCollected: boolean;
  nextScale: ScaleId;
  campaignIndex?: number;
}

export class DiveResultsScene extends Phaser.Scene {
  constructor() {
    super('DiveResults');
  }

  create(data: DiveResultsData): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.midnight).fadeIn(200);

    // Stacked off each block's measured height, not a guessed fixed offset — see
    // OneDropResultsScene for the same fix and why (the largeText accessibility setting scales
    // every font up, which could otherwise push a block into the one below it).
    let y = 100;
    const titleText = this.add
      .text(width / 2, y, 'EXPEDITION LOG', TEXT_STYLES.title)
      .setOrigin(0.5, 0);
    y += titleText.height + 14;
    const subtitle = this.add.text(width / 2, y, data.name, TEXT_STYLES.hint).setOrigin(0.5, 0);
    y += subtitle.height + 30;

    const lines = [
      `Photos taken: ${data.photos.length}`,
      `Species documented: ${data.speciesCount}`,
      `Total photo score: ${data.totalScore}`,
      `Wildlife disturbance events: ${data.disturbanceEvents}`,
      data.sampleCollected
        ? `Water sample collected — the ${SCALES[data.nextScale].name} is next.`
        : 'No water sample collected this expedition.',
    ];
    const statsText = this.add
      .text(width / 2, y, lines.join('\n'), { ...TEXT_STYLES.body, align: 'center' })
      .setOrigin(0.5, 0);
    y += statsText.height + 30;

    if (data.disturbanceEvents > 0) {
      const note = this.add
        .text(
          width / 2,
          y,
          'A fast, close approach startles wildlife and ruins the shot. Slow down near animals for the best photographs.',
          { ...TEXT_STYLES.hint, align: 'center', wordWrap: { width: width - 200 } },
        )
        .setOrigin(0.5, 0);
      y += note.height + 20;
    }

    const items: MenuItem[] = [];
    if (data.campaignIndex !== undefined) {
      clearExpedition(data.campaignIndex);
      items.push({
        label: () => 'CONTINUE EXPEDITION',
        action: () => this.scene.start('ExpeditionIntro', { index: data.campaignIndex! + 1 }),
      });
    } else {
      items.push({
        label: () => 'DIVE AGAIN',
        action: () => this.scene.start('Dive', { nextScale: data.nextScale }),
      });
      if (data.sampleCollected) {
        items.push({
          label: () => `EXAMINE THE SAMPLE (ONE DROP)`,
          action: () => this.scene.start('OneDrop', { scaleId: data.nextScale }),
        });
      }
    }
    items.push({ label: () => 'TITLE', action: () => this.scene.start('Title') });

    const menuY = Math.min(Math.max(420, y), height - 200);
    new Menu(this, items, width / 2, menuY, 520, 62, () => this.scene.start('Title'));
    addCenteredText(this, height - 34, 'Esc to go back', TEXT_STYLES.hint);
    sound.playSong('title');
  }
}
