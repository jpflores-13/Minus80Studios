import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.rectangle(0, height * 0.3, width, height * 0.4, PALETTE.water).setOrigin(0);
    addCenteredText(this, height * 0.42, 'DOWNSTREAM!', TEXT_STYLES.title);
    addCenteredText(this, height * 0.55, 'A Minus 80 Studio prototype', TEXT_STYLES.body);
    addCenteredText(this, height * 0.8, 'Press SPACE / ENTER or tap to start', TEXT_STYLES.hint);

    const start = () => this.scene.start('Play');
    this.input.keyboard?.once('keydown-SPACE', start);
    this.input.keyboard?.once('keydown-ENTER', start);
    this.input.once('pointerdown', start);
  }
}
