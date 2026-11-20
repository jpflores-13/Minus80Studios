import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import { announce } from '../ui/announce';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

// Dusk over a wetland, then down into the soil. Four lines, a tiny pink star, a worm, gone.
// Short and skippable; it plays once unless chosen again.
const LINES = [
  'Some creatures see the world.',
  'Some hear it.',
  'And some...',
  '...feel absolutely everything.',
];

export class IntroScene extends Phaser.Scene {
  constructor() {
    super('Intro');
  }

  create(data: { replay?: boolean }): void {
    if (progress().seenIntro && !data.replay) return void this.scene.start('Title');
    const { width, height } = this.scale;
    const reduced = progress().reducedEffects;
    const world = this.add.container(0, 0);
    const g = this.add.graphics();
    // dusk sky, reeds and water, then soil all the way down
    g.fillGradientStyle(0x3a2f4a, 0x3a2f4a, 0xd98d98, 0xd98d98, 1).fillRect(
      0,
      0,
      width,
      height * 0.6,
    );
    g.fillStyle(PALETTE.teal, 1).fillRect(0, height * 0.6, width, 40);
    g.fillStyle(PALETTE.green, 1);
    for (let x = 0; x < width; x += 22)
      g.fillRect(x, height * 0.6 - 40 - (x % 3) * 10, 4, 40 + (x % 3) * 10);
    g.fillGradientStyle(PALETTE.soil, PALETTE.soil, PALETTE.charcoal, PALETTE.charcoal, 1).fillRect(
      0,
      height * 0.6 + 40,
      width,
      height * 1.6,
    );
    world.add(g);
    const lines = LINES.map((l, i) =>
      addCenteredText(this, height * 0.3 + i * 64, l, {
        ...TEXT_STYLES.title,
        fontSize: '40px',
      }).setAlpha(0),
    );
    const mole = this.add
      .image(width / 2 - 40, height * 0.78, 'mole-0')
      .setScale(6)
      .setAlpha(0);
    const worm = this.add.graphics().setAlpha(0);
    worm
      .lineStyle(10, PALETTE.coral, 1)
      .beginPath()
      .moveTo(width / 2 + 140, height * 0.78);
    for (let i = 1; i <= 6; i++)
      worm.lineTo(width / 2 + 140 + i * 18, height * 0.78 + Math.sin(i) * 8);
    worm.strokePath();
    const title = addCenteredText(this, height * 0.42, 'STARSTRUCK.', {
      ...TEXT_STYLES.display,
      fontSize: '96px',
    }).setAlpha(0);
    const tag = addCenteredText(this, height * 0.55, 'It’s not what you see. It’s what you feel.', {
      ...TEXT_STYLES.hud,
      color: PALETTE.textRose,
    }).setAlpha(0);

    const t = (ms: number, fn: () => void) => this.time.delayedCall(reduced ? ms / 2 : ms, fn);
    this.tweens.add({
      targets: world,
      y: -height * 1.2,
      duration: reduced ? 600 : 2600,
      ease: 'Sine.easeInOut',
    });
    LINES.forEach((l, i) =>
      t(1600 + i * 1000, () => {
        lines[i]?.setAlpha(1);
        announce(l);
      }),
    );
    t(5800, () => {
      for (const x of lines) x.setAlpha(0);
      mole.setAlpha(1);
      worm.setAlpha(1);
      sound.play('touchSoft');
    });
    t(6600, () => {
      this.tweens.add({ targets: mole, x: width / 2 + 120, duration: 140 });
      sound.play('bite');
      worm.setAlpha(0);
    });
    t(7400, () => {
      mole.setAlpha(0);
      title.setAlpha(1);
      tag.setAlpha(1);
      announce('Starstruck. It’s not what you see. It’s what you feel.');
    });
    const done = () => {
      saveProgress({ seenIntro: true });
      this.scene.start('Title');
    };
    t(9600, done);
    this.input.once('pointerup', done);
    this.input.keyboard?.once('keydown', done);
    addCenteredText(this, height - 30, 'Tap or press any key to skip', TEXT_STYLES.hint);
  }
}
