import Phaser from 'phaser';
import { getCharacter } from '../characters';
import { PALETTE, PIXEL } from '../config/gameConfig';
import { settings } from '../config/settings';
import { TUNING } from '../config/tuning';
import { DID_YOU_KNOW, randomQuickFact } from '../content/science';
import { Button } from '../ui/Button';
import { announce } from '../ui/announce';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

export interface ResultsData {
  won: boolean;
  characterId: string;
  captured: number;
  seconds: number;
  venomSpent: number;
  capturedSchools?: number[];
}

/** Sequence A of the ending: HUNT COMPLETE, with real run stats and captured prey. */
export class ResultsScene extends Phaser.Scene {
  constructor() {
    super('Results');
  }

  create(data: ResultsData): void {
    const c = getCharacter(data.characterId);
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.navy);
    this.cameras.main.fadeIn(500);

    addCenteredText(
      this,
      height * 0.16,
      data.won ? 'HUNT COMPLETE' : 'THE REEF WINS THIS TIME',
      TEXT_STYLES.title,
    );
    addCenteredText(
      this,
      height * 0.26,
      data.won ? 'Nature does it better.' : 'Patience is a predator’s first weapon.',
      TEXT_STYLES.warm,
    );

    this.add.image(width / 2, height * 0.4, `snail-${c.id}`).setScale(PIXEL * 1.6);
    (data.capturedSchools ?? []).forEach((school, i, all) => {
      const x = width / 2 + (i - (all.length - 1) / 2) * 60;
      const fish = this.add
        .image(x, height * 0.51, `fish-${school % 3}`)
        .setScale(PIXEL)
        .setAlpha(0);
      this.tweens.add({ targets: fish, alpha: 1, duration: 300, delay: 400 + i * 200 });
    });

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

    const fact = randomQuickFact(c.id, Math.floor(data.seconds * 1000) + data.captured);
    addCenteredText(this, height * 0.72, `${DID_YOU_KNOW} ${fact}`, {
      ...TEXT_STYLES.hint,
      wordWrap: { width: width - 200 },
      align: 'center',
    });

    new Button(
      this,
      70,
      36,
      110,
      40,
      'HOME  [T]',
      () => this.scene.start('Title'),
      c.palette.accent,
    );
    const seen = settings().seenDiscovery.includes(c.id);
    announce(
      `${data.won ? 'Hunt complete. Nature does it better.' : 'The reef wins this time.'} ` +
        `${c.name}. ${data.captured} of ${TUNING.hunt.objectiveCaptures} fish captured in ${mins} minutes ${secs} seconds. ` +
        (data.won
          ? 'Press Enter for the science, R to hunt again, C to choose another assassin, T for the title.'
          : 'Press Enter to try again, C to choose another assassin, T for the title.'),
    );
    const toScience = () => this.scene.start('Discovery', { characterId: c.id, mode: 'ending' });
    const again = () => this.scene.start('Hunt', { characterId: c.id });
    const choose = () => this.scene.start('Select', { mode: 'hunt', characterId: c.id });
    const y = height * 0.82;
    if (data.won) {
      new Button(
        this,
        width / 2 - 270,
        y,
        250,
        56,
        seen ? 'THE SCIENCE  [ENTER]' : 'CONTINUE  [ENTER]',
        toScience,
        c.palette.accent,
      );
      new Button(this, width / 2, y, 250, 56, 'HUNT AGAIN  [R]', again, c.palette.accent);
      new Button(
        this,
        width / 2 + 270,
        y,
        250,
        56,
        'CHOOSE ASSASSIN  [C]',
        choose,
        c.palette.accent,
      );
    } else {
      new Button(this, width / 2 - 140, y, 250, 56, 'TRY AGAIN  [ENTER]', again, c.palette.accent);
      new Button(
        this,
        width / 2 + 140,
        y,
        250,
        56,
        'CHOOSE ASSASSIN  [C]',
        choose,
        c.palette.accent,
      );
    }

    // Auto-continue into the science reveal on a first win (skippable there).
    if (data.won && !seen) this.time.delayedCall(4500, toScience);

    const kb = this.input.keyboard;
    kb?.once('keydown-ENTER', data.won ? toScience : again);
    kb?.once('keydown-R', again);
    kb?.once('keydown-C', choose);
    kb?.once('keydown-T', () => this.scene.start('Title'));
  }
}
