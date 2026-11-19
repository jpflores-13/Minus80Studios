import Phaser from 'phaser';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    const { height } = this.scale;
    addCenteredText(this, height * 0.38, 'SNAIL ASSASSIN', TEXT_STYLES.title);
    addCenteredText(this, height * 0.5, 'A Minus 80 Studio prototype', TEXT_STYLES.body);
    addCenteredText(this, height * 0.7, 'Press SPACE / ENTER or tap to dive', TEXT_STYLES.hint);

    const start = () => this.scene.start('Play');
    this.input.keyboard?.once('keydown-SPACE', start);
    this.input.keyboard?.once('keydown-ENTER', start);
    this.input.once('pointerdown', start);
  }
}
