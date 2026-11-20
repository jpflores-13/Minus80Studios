import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { ENEMIES } from '../content/arsenal';
import { PALETTE } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import { OPENING_LINES, OPENING_THREATS } from '../content/science';
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
    // the roster: what the opening wave actually throws at you, named and described up front
    const roster = OPENING_THREATS.map(({ kind, line }, i) => {
      const x = width / 2 - width * 0.3 + i * (width * 0.3);
      const sprite = this.add
        .image(x, height * 0.6, `${kind}-0`)
        .setScale(4)
        .setAlpha(0);
      const name = this.add
        .text(x, height * 0.6 + 60, ENEMIES[kind].name.toUpperCase(), {
          ...TEXT_STYLES.label,
          color: PALETTE.textGold,
        })
        .setOrigin(0.5)
        .setAlpha(0);
      const blurb = this.add
        .text(x, height * 0.6 + 86, line, { ...TEXT_STYLES.small, wordWrap: { width: 220 } })
        .setOrigin(0.5)
        .setAlpha(0);
      return { sprite, name, blurb, line, label: ENEMIES[kind].name };
    });
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
      }),
    );
    const rosterStart = 1400 + OPENING_LINES.length * 1100 + 400;
    t(rosterStart, () => {
      announce('Here is what is coming for you.');
    });
    roster.forEach((r, i) =>
      t(rosterStart + 500 + i * 650, () => {
        for (const target of [r.sprite, r.name, r.blurb])
          this.tweens.add({ targets: target, alpha: 1, duration: 400 });
        sound.play('warn');
        announce(`${r.label}. ${r.line}`);
      }),
    );
    const done = () => {
      saveProgress({ seenIntro: true });
      this.scene.start('Title');
    };
    t(rosterStart + 500 + roster.length * 650 + 1400, done);
    this.input.once('pointerup', done);
    this.input.keyboard?.once('keydown', done);
    addCenteredText(this, height - 40, 'Tap or press any key to skip', TEXT_STYLES.hint);
  }
}
