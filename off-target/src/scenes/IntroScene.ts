import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import { announce } from '../ui/announce';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

// The opening: meet CHOP, GUIDE, GENE and ACE, then straight into Stage 1.
const CARDS: { sprite: string; scale: number; name: string; line: string }[] = [
  { sprite: 'chop-0', scale: 6, name: 'CHOP', line: 'A big machine that cuts where it is told.' },
  { sprite: 'guide', scale: 10, name: 'GUIDE', line: 'Tells CHOP where to go.' },
  { sprite: 'gene', scale: 7, name: 'GENE', line: 'Today, GUIDE has picked the wrong one.' },
  { sprite: 'ace-idle', scale: 12, name: 'ACE', line: 'Small. Fast. Able to stop CHOP.' },
];
const LINES = ['The wrong target.', 'One chance to stop the cut.', 'Every second counts.'];

export class IntroScene extends Phaser.Scene {
  private step = 0;
  private items: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('Intro');
  }

  create(): void {
    this.step = 0;
    this.items = [];
    this.cameras.main.setBackgroundColor(PALETTE.night);
    addCenteredText(
      this,
      this.scale.height - 30,
      'Enter, tap or A: next · Esc: skip',
      TEXT_STYLES.hint,
    );
    const advance = () => this.next();
    this.input.on('pointerup', advance);
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) =>
      e.key === 'Escape' ? this.done() : advance(),
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.input.keyboard?.removeAllListeners(),
    );
    this.next();
  }

  private next(): void {
    sound.unlock();
    for (const o of this.items) o.destroy();
    this.items = [];
    const { width, height } = this.scale;
    const reduced = progress().reducedEffects;
    if (this.step < CARDS.length) {
      const c = CARDS[this.step]!;
      const img = this.add.image(width / 2, height * 0.42, c.sprite).setScale(c.scale);
      const name = addCenteredText(this, height * 0.68, c.name, TEXT_STYLES.title);
      const line = addCenteredText(this, height * 0.77, c.line, TEXT_STYLES.body);
      this.items.push(img, name, line);
      if (!reduced)
        this.tweens.add({
          targets: img,
          y: img.y - 8,
          duration: 700,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      announce(`${c.name}. ${c.line}`);
      sound.play('click');
    } else if (this.step < CARDS.length + LINES.length) {
      const text = LINES[this.step - CARDS.length]!;
      const t = addCenteredText(this, height / 2, text, {
        ...TEXT_STYLES.title,
        fontSize: '56px',
        color: PALETTE.textGold,
      });
      this.items.push(t);
      if (!reduced) this.cameras.main.shake(120, 0.004);
      sound.play('warn');
      announce(text);
    } else {
      return this.done();
    }
    this.step++;
  }

  private done(): void {
    saveProgress({ seenIntro: true });
    this.scene.start('Stage', { stageId: 'stage-1' });
  }
}
