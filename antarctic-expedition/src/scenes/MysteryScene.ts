import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress, resolveMystery } from '../config/progress';
import { MYSTERIES, type Interpretation, type Mystery } from '../content/mysteries';
import { isUnlocked, interpret } from '../systems/mysteries';
import { announce } from '../ui/announce';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

const CHOICE_LABEL: Record<Interpretation, string> = {
  supported: 'SUPPORTED',
  insufficient: 'POSSIBLE, BUT INSUFFICIENT EVIDENCE',
  notSupported: 'NOT SUPPORTED',
};

/** Scientific mysteries: interpret the evidence collected so far. Calibration matters more
 * than confidence — honest uncertainty is a legitimate, correct answer for some of these. */
export class MysteryScene extends Phaser.Scene {
  private body!: Phaser.GameObjects.Text;
  private choiceMenu: Menu | undefined = undefined;
  private bodyTop = 150;
  private bodyAvailableHeight = 0;

  constructor() {
    super('Mystery');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.midnight).fadeIn(200);
    addCenteredText(this, 56, 'SCIENTIFIC MYSTERIES', TEXT_STYLES.title);

    this.body = this.add.text(width / 2 + 60, this.bodyTop, '', {
      ...TEXT_STYLES.body,
      wordWrap: { width: width / 2 - 120 },
    });
    // Room for the body text before it would run into the "Esc to go back" hint — questions and
    // explanations vary a lot in length (the leopard seal mystery's is much longer than most).
    this.bodyAvailableHeight = height - 50 - this.bodyTop;

    const journal = progress().journal;
    new Menu(
      this,
      MYSTERIES.map((m) => {
        const unlocked = isUnlocked(m, journal);
        const solved = progress().mysteriesSolved.includes(m.id);
        return {
          label: () => (unlocked ? `${solved ? '✓ ' : ''}${m.title}` : '??? LOCKED'),
          ...(unlocked ? {} : { help: `Requires documenting: ${m.requiredEvidence.join(', ')}` }),
          action: () => this.open(m, unlocked),
        };
      }),
      width / 2 - 260,
      150,
      420,
      46,
      () => this.scene.start('Title'),
    );
    addCenteredText(this, height - 34, 'Esc to go back', TEXT_STYLES.hint);
  }

  private open(mystery: Mystery, unlocked: boolean): void {
    this.choiceMenu?.destroy();
    this.choiceMenu = undefined;
    this.body.setScale(1);
    if (!unlocked) {
      this.body.setText(`Requires documenting: ${mystery.requiredEvidence.join(', ')}`);
      return;
    }
    this.body.setText(mystery.question);
    const { width } = this.scale;
    // Stacked off the question's real measured height, not a guessed constant, so a longer
    // question (there's real variation across the six mysteries) pushes the choices down
    // instead of the two overlapping.
    const menuY = Math.max(320, this.bodyTop + this.body.height + 40);
    this.choiceMenu = new Menu(
      this,
      (['supported', 'insufficient', 'notSupported'] as Interpretation[]).map((choice) => ({
        label: () => CHOICE_LABEL[choice],
        action: () => this.choose(mystery, choice),
      })),
      width / 2 + 60 + (width / 2 - 120) / 2,
      menuY,
      width / 2 - 140,
      54,
    );
  }

  private choose(mystery: Mystery, choice: Interpretation): void {
    sound.unlock();
    const outcome = interpret(mystery, choice);
    sound.play(outcome.calibrated ? 'win' : 'discover');
    resolveMystery(mystery.id);
    this.choiceMenu?.destroy();
    this.choiceMenu = undefined;
    this.body.setScale(1);
    this.body.setText(
      `${mystery.question}\n\nYour call: ${CHOICE_LABEL[choice]}\n\n${outcome.explanation}`,
    );
    // Last resort, not the main fix: the question plus its full explanation can run long
    // (the leopard seal mystery's especially). Scale the whole block down rather than let it
    // run into the "Esc to go back" hint at the bottom of the screen.
    if (this.body.height > this.bodyAvailableHeight) {
      this.body.setScale(this.bodyAvailableHeight / this.body.height);
    }
    announce(outcome.explanation);
  }
}
