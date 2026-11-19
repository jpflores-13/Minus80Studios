import Phaser from 'phaser';
import { PALETTE, PIXEL } from '../config/gameConfig';
import { LEVELS } from '../levels';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.grass);
    this.add.rectangle(0, height * 0.28, width, height * 0.36, PALETTE.water).setOrigin(0);
    for (let x = 30; x < width; x += 90)
      this.add.image(x, height * 0.2, 'tree').setScale(PIXEL * 1.4);
    for (let x = 60; x < width; x += 140)
      this.add.image(x, height * 0.74, 'house').setScale(PIXEL * 1.4);

    addCenteredText(this, height * 0.42, 'DOWNSTREAM!', TEXT_STYLES.display);
    addCenteredText(this, height * 0.56, 'Everything flows somewhere.', TEXT_STYLES.bodyLight);
    const first = LEVELS[0]!;
    addCenteredText(
      this,
      height * 0.88,
      `Press ENTER / SPACE or click to start · Level ${first.number}: ${first.name}`,
      {
        ...TEXT_STYLES.bodyLight,
        backgroundColor: '#2d2a26aa',
        padding: { x: 12, y: 6 },
      },
    );
    addCenteredText(this, height * 0.96, 'A -80 Studio prototype', TEXT_STYLES.smallLight);

    const start = () => this.scene.start('Level', { levelId: first.id });
    this.input.keyboard?.once('keydown-SPACE', start);
    this.input.keyboard?.once('keydown-ENTER', start);
    this.input.once('pointerdown', start);
  }
}
