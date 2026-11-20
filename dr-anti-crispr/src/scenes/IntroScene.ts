import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import { OPENING_LINES } from '../content/science';
import { announce } from '../ui/announce';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

// The opening: the doctor drops toward a cell surface, the inside comes into view, machines
// appear, and the four lines play. Tap to speed through; it only plays once unless chosen.
export class IntroScene extends Phaser.Scene {
  constructor() {
    super('Intro');
  }

  create(data: { replay?: boolean }): void {
    if (progress().seenIntro && !data.replay) return void this.scene.start('Title');
    const { width, height } = this.scale;
    const reduced = progress().reducedEffects;
    this.cameras.main.setBackgroundColor(PALETTE.night);
    // the bacterial surface: a long curved membrane
    const g = this.add.graphics();
    g.fillStyle(0x3d2a6e, 1).fillEllipse(width / 2, height + 300, width * 2.4, 1000);
    for (let x = -100; x < width + 100; x += 18)
      g.fillStyle(0x8a6cc4, 1).fillCircle(x, height - 200 + Math.pow((x - width / 2) / 60, 2), 6);
    const doc = this.add.image(width / 2, -100, 'doc-4-0').setScale(5);
    const lines = OPENING_LINES.map((l, i) =>
      addCenteredText(this, 200 + i * 70, l, {
        ...TEXT_STYLES.title,
        fontSize: '36px',
        color: i === 3 ? PALETTE.textGold : PALETTE.text,
      }).setAlpha(0),
    );
    const machines = ['cutter-0', 'stalker-0', 'cutter-1'].map((k, i) =>
      this.add
        .image(160 + i * 200, height * 0.62, k)
        .setScale(4)
        .setAlpha(0),
    );
    const t = (delay: number, fn: () => void) =>
      this.time.delayedCall(reduced ? delay / 3 : delay, fn);
    this.tweens.add({
      targets: doc,
      y: height * 0.45,
      duration: reduced ? 300 : 1600,
      ease: 'Sine.easeOut',
    });
    OPENING_LINES.forEach((l, i) =>
      t(1400 + i * 1100, () => {
        lines[i]?.setAlpha(1);
        sound.play(i === 3 ? 'power' : 'warn');
        announce(l);
        if (i === 1)
          for (const m of machines) this.tweens.add({ targets: m, alpha: 1, duration: 500 });
      }),
    );
    const done = () => {
      saveProgress({ seenIntro: true });
      this.scene.start('Title');
    };
    t(1400 + OPENING_LINES.length * 1100 + 900, done);
    this.input.once('pointerup', done);
    this.input.keyboard?.once('keydown', done);
    addCenteredText(this, height - 40, 'Tap or press any key to skip', TEXT_STYLES.hint);
  }
}
