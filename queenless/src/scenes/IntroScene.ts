import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import { OPENING_LINES } from '../content/science';
import { prefersReducedMotion } from '../utils/accessibility';
import { announce } from '../ui/announce';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

// The opening: a few lines over a quiet nest, ending on "the queen is gone." Tap or any key
// skips ahead. Plays once unless replayed from the title.
export class IntroScene extends Phaser.Scene {
  constructor() {
    super('Intro');
  }

  create(data: { replay?: boolean }): void {
    if (progress().seenIntro && !data.replay) return void this.scene.start('Title');
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.night).fadeIn(300);
    const bee = this.add
      .image(width / 2, height * 0.3, 'bee-0')
      .setScale(6)
      .setTint(0xe8b84b);
    if (!prefersReducedMotion())
      this.tweens.add({
        targets: bee,
        y: height * 0.3 - 10,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    const lines = OPENING_LINES.map((l, i) =>
      addCenteredText(this, height * 0.52 + i * 56, l, {
        ...TEXT_STYLES.title,
        fontSize: '32px',
        color: i === OPENING_LINES.length - 1 ? PALETTE.textRed : PALETTE.text,
      }).setAlpha(0),
    );
    OPENING_LINES.forEach((l, i) =>
      this.time.delayedCall(900 + i * 1300, () => {
        lines[i]?.setAlpha(1);
        sound.play(i === OPENING_LINES.length - 1 ? 'queenLost' : 'click');
        announce(l);
      }),
    );
    const done = () => {
      saveProgress({ seenIntro: true });
      this.scene.start('Title');
    };
    this.time.delayedCall(900 + OPENING_LINES.length * 1300 + 900, done);
    this.input.once('pointerup', done);
    this.input.keyboard?.once('keydown', done);
    addCenteredText(this, height - 36, 'Tap or press any key to skip', TEXT_STYLES.hint);
    sound.playSong('title');
  }
}
