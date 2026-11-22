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

  constructor() {
    super('Mystery');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.midnight).fadeIn(200);
    addCenteredText(this, 56, 'SCIENTIFIC MYSTERIES', TEXT_STYLES.title);

    this.body = this.add.text(width / 2 + 60, 150, '', {
      ...TEXT_STYLES.body,
      wordWrap: { width: width / 2 - 120 },
    });

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
    if (!unlocked) {
      this.body.setText(`Requires documenting: ${mystery.requiredEvidence.join(', ')}`);
      return;
    }
    this.body.setText(mystery.question);
    const { width } = this.scale;
    this.choiceMenu = new Menu(
      this,
      (['supported', 'insufficient', 'notSupported'] as Interpretation[]).map((choice) => ({
        label: () => CHOICE_LABEL[choice],
        action: () => this.choose(mystery, choice),
      })),
      width / 2 + 60 + (width / 2 - 120) / 2,
      320,
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
    this.body.setText(
      `${mystery.question}\n\nYour call: ${CHOICE_LABEL[choice]}\n\n${outcome.explanation}`,
    );
    announce(outcome.explanation);
  }
}
