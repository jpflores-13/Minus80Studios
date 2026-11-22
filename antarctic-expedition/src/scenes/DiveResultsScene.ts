import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { SCALES, type ScaleId } from '../content/organisms';
import type { PhotoResult } from '../systems/dive';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

interface DiveResultsData {
  name: string;
  photos: PhotoResult[];
  totalScore: number;
  speciesCount: number;
  disturbanceEvents: number;
  sampleCollected: boolean;
  nextScale: ScaleId;
}

export class DiveResultsScene extends Phaser.Scene {
  constructor() {
    super('DiveResults');
  }

  create(data: DiveResultsData): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.midnight).fadeIn(200);

    addCenteredText(this, 100, 'EXPEDITION LOG', TEXT_STYLES.title);
    addCenteredText(this, 140, data.name, TEXT_STYLES.hint);

    const lines = [
      `Photos taken: ${data.photos.length}`,
      `Species documented: ${data.speciesCount}`,
      `Total photo score: ${data.totalScore}`,
      `Wildlife disturbance events: ${data.disturbanceEvents}`,
      data.sampleCollected
        ? `Water sample collected — the ${SCALES[data.nextScale].name} is next.`
        : 'No water sample collected this expedition.',
    ];
    addCenteredText(this, 220, lines.join('\n'), { ...TEXT_STYLES.body, align: 'center' });

    if (data.disturbanceEvents > 0) {
      addCenteredText(
        this,
        340,
        'A fast, close approach startles wildlife and ruins the shot. Slow down near animals for the best photographs.',
        { ...TEXT_STYLES.hint, align: 'center', wordWrap: { width: width - 200 } },
      );
    }

    const items = [
      {
        label: () => 'DIVE AGAIN',
        action: () => this.scene.start('Dive', { nextScale: data.nextScale }),
      },
    ];
    if (data.sampleCollected) {
      items.push({
        label: () => `EXAMINE THE SAMPLE (ONE DROP)`,
        action: () => this.scene.start('OneDrop', { scaleId: data.nextScale }),
      });
    }
    items.push({ label: () => 'TITLE', action: () => this.scene.start('Title') });

    new Menu(this, items, width / 2, 420, 520, 62, () => this.scene.start('Title'));
    addCenteredText(this, height - 34, 'Esc to go back', TEXT_STYLES.hint);
    sound.playSong('title');
  }
}
