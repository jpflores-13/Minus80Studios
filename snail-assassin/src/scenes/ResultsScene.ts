import Phaser from 'phaser';
import { getCharacter } from '../characters';
import { PALETTE, PIXEL } from '../config/gameConfig';
import { TUNING } from '../config/tuning';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

export interface ResultsData {
  won: boolean;
  characterId: string;
  captured: number;
  seconds: number;
  venomSpent: number;
}

/** Sequence A of the ending format: hunt results. The science reveal follows in Milestone 6. */
export class ResultsScene extends Phaser.Scene {
  constructor() {
    super('Results');
  }

  create(data: ResultsData): void {
    const c = getCharacter(data.characterId);
    const { height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.navy);
    this.cameras.main.fadeIn(500);

    addCenteredText(
      this,
      height * 0.24,
      data.won ? 'HUNT COMPLETE' : 'THE REEF WINS THIS TIME',
      TEXT_STYLES.title,
    );
    addCenteredText(
      this,
      height * 0.34,
      data.won ? 'Nature does it better.' : 'Patience is a predator’s first weapon.',
      TEXT_STYLES.warm,
    );

    this.add.image(this.scale.width / 2, height * 0.47, `snail-${c.id}`).setScale(PIXEL * 1.5);
    const mins = Math.floor(data.seconds / 60);
    const secs = String(Math.floor(data.seconds % 60)).padStart(2, '0');
    addCenteredText(
      this,
      height * 0.62,
      [
        `${c.name}  ·  ${c.species}`,
        `Fish captured  ${data.captured}/${TUNING.hunt.objectiveCaptures}     Time  ${mins}:${secs}     Venom spent  ${Math.round(data.venomSpent)}`,
      ].join('\n'),
      { ...TEXT_STYLES.body, align: 'center', lineSpacing: 10 },
    );
    addCenteredText(this, height * 0.82, 'ENTER  hunt again    ·    T  title', TEXT_STYLES.hint);

    const kb = this.input.keyboard;
    kb?.once('keydown-ENTER', () => this.scene.start('Hunt', { characterId: c.id }));
    kb?.once('keydown-T', () => this.scene.start('Title'));
  }
}
