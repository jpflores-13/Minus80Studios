import Phaser from 'phaser';
import { SCALE_ORDER, SCALES } from '../content/organisms';
import { PALETTE } from '../config/gameConfig';
import { bestFor } from '../config/progress';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

export class ScaleSelectScene extends Phaser.Scene {
  constructor() {
    super('ScaleSelect');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.midnight).fadeIn(200);
    addCenteredText(this, 110, 'CHOOSE A SCALE', TEXT_STYLES.title);
    addCenteredText(
      this,
      156,
      'Each scale uses a different instrument and a different ONE DROP field.',
      TEXT_STYLES.hint,
    );
    new Menu(
      this,
      SCALE_ORDER.map((id) => {
        const info = SCALES[id];
        const best = bestFor(`one-drop-${id}`);
        return {
          label: () =>
            `${info.name.toUpperCase()} — ${info.instrument}${best ? ` (best ${best.score})` : ''}`,
          help: `Specimens around ${info.approxSize}.`,
          action: () =>
            id === 'molecular'
              ? this.scene.start('Reconstruct')
              : this.scene.start('OneDrop', { scaleId: id }),
        };
      }),
      width / 2,
      210,
      760,
      58,
      () => this.scene.start('Title'),
    );
    addCenteredText(this, height - 34, 'Esc to go back', TEXT_STYLES.hint);
  }
}
