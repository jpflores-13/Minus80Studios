import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { SCALES, type ScaleId } from '../content/organisms';
import { Menu } from '../ui/Menu';
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
}

export class OneDropResultsScene extends Phaser.Scene {
  constructor() {
    super('OneDropResults');
  }

  create(data: ResultsData): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.midnight).fadeIn(200);
    const info = SCALES[data.scaleId];

    addCenteredText(this, 110, data.won ? 'SAMPLE DOCUMENTED' : 'TIME EXPIRED', {
      ...TEXT_STYLES.title,
      color: data.won ? PALETTE.textMint : PALETTE.textCoral,
    });
    addCenteredText(this, 150, info.name, TEXT_STYLES.hint);

    const stars = '★'.repeat(data.stars) + '☆'.repeat(3 - data.stars);
    addCenteredText(this, 200, stars, {
      ...TEXT_STYLES.title,
      color: PALETTE.textGold,
      fontSize: '36px',
    });

    const lines = [
      `Score: ${data.score}`,
      `Documented: ${data.captured} / ${data.objective}`,
      `Identification accuracy: ${Math.round(data.accuracy * 100)}%`,
      `Uncertain particles documented honestly: ${data.unknownsDocumented}`,
      `Best combo: x${data.bestCombo}`,
    ];
    addCenteredText(this, 260, lines.join('\n'), { ...TEXT_STYLES.body, align: 'center' });

    if (data.unknownsDocumented > 0) {
      addCenteredText(
        this,
        400,
        'Marking something "unknown" instead of guessing is good science. It is never a mistake.',
        { ...TEXT_STYLES.hint, align: 'center', wordWrap: { width: width - 200 } },
      );
    }

    new Menu(
      this,
      [
        {
          label: () => 'PLAY AGAIN',
          action: () => this.scene.start('OneDrop', { scaleId: data.scaleId }),
        },
        { label: () => 'CHOOSE A SCALE', action: () => this.scene.start('ScaleSelect') },
        { label: () => 'TITLE', action: () => this.scene.start('Title') },
      ],
      width / 2,
      460,
      460,
      62,
      () => this.scene.start('ScaleSelect'),
    );
    addCenteredText(this, height - 34, 'Esc to go back', TEXT_STYLES.hint);
    sound.playSong('title');
  }
}
