import Phaser from 'phaser';
import { ATLAS } from '../characters/atlas';
import { PIXEL } from '../config/gameConfig';
import { Reef } from '../entities/Reef';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

export class TitleScene extends Phaser.Scene {
  private reef!: Reef;

  constructor() {
    super('Title');
  }

  create(): void {
    const { width, height } = this.scale;
    this.reef = new Reef(this, 2026);
    this.add.rectangle(0, 0, width, height, 0x06192b, 0.72).setOrigin(0);
    this.cameras.main.fadeIn(800);

    addCenteredText(this, height * 0.3, 'SNAIL ASSASSIN', TEXT_STYLES.display);
    addCenteredText(
      this,
      height * 0.42,
      'Nature’s slowest assassins. Evolution’s most sophisticated arsenal.',
      TEXT_STYLES.warm,
    );
    this.add.image(width / 2, height * 0.56, `snail-${ATLAS.id}`).setScale(PIXEL * 1.5);
    addCenteredText(
      this,
      height * 0.68,
      `Hunt as ${ATLAS.name}, ${ATLAS.title}  ·  ${ATLAS.species}`,
      TEXT_STYLES.body,
    );
    addCenteredText(this, height * 0.82, 'Press ENTER / SPACE or click to begin', TEXT_STYLES.hint);
    addCenteredText(this, height * 0.95, 'A Minus 80 Studio prototype', TEXT_STYLES.hint);

    const start = () => this.scene.start('Hunt', { characterId: ATLAS.id });
    this.input.keyboard?.once('keydown-SPACE', start);
    this.input.keyboard?.once('keydown-ENTER', start);
    this.input.once('pointerdown', start);
  }

  override update(time: number, delta: number): void {
    this.reef.update(time, delta / 1000);
  }
}
