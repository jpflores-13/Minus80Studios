import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import { makeArt, makeThief } from '../render/art';
import { CREW } from '../content/crew';
import { announce } from '../ui/announce';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

// An underground workshop. A thief, a strange device, a few lines, and the title.
const LINES = [
  'They said the building was impossible to break into.',
  'Too many guards.',
  'Too many locked doors.',
  'Too much distance.',
];

export class IntroScene extends Phaser.Scene {
  constructor() {
    super('Intro');
  }

  create(data: { replay?: boolean }): void {
    if (progress().seenIntro && !data.replay) return void this.scene.start('Title');
    makeArt(this);
    const { width, height } = this.scale;
    const reduced = progress().reducedEffects;
    this.cameras.main.setBackgroundColor(PALETTE.ink);
    // a workbench under a single lamp
    const g = this.add.graphics();
    g.fillStyle(0x2a2218, 1).fillRect(width * 0.25, height * 0.62, width * 0.5, 30);
    g.fillStyle(PALETTE.gold, 0.08).fillTriangle(
      width / 2,
      0,
      width * 0.25,
      height * 0.62,
      width * 0.75,
      height * 0.62,
    );
    this.add
      .image(width * 0.38, height * 0.56, makeThief(this, CREW.ghost))
      .setScale(4)
      .setRotation(-Math.PI / 2);
    const device = this.add
      .image(width * 0.6, height * 0.58, 'device')
      .setScale(4)
      .setAlpha(0.3);
    const lines = LINES.map((l, i) =>
      addCenteredText(this, 90 + i * 58, l, {
        ...TEXT_STYLES.title,
        fontSize: i === 0 ? '30px' : '34px',
      }).setAlpha(0),
    );
    const changed = addCenteredText(this, height * 0.78, 'So we changed the distance.', {
      ...TEXT_STYLES.title,
      fontSize: '40px',
      color: PALETTE.textMint,
    }).setAlpha(0);
    const title = addCenteredText(this, height * 0.38, 'HEIST.', {
      ...TEXT_STYLES.display,
      fontSize: '120px',
      color: PALETTE.textGold,
    }).setAlpha(0);
    const tag = addCenteredText(this, height * 0.52, 'Distance is your greatest weapon.', {
      ...TEXT_STYLES.hud,
      color: PALETTE.text,
    }).setAlpha(0);
    const t = (ms: number, fn: () => void) => this.time.delayedCall(reduced ? ms / 2 : ms, fn);
    LINES.forEach((l, i) =>
      t(600 + i * 1300, () => {
        lines[i]?.setAlpha(1);
        announce(l);
        sound.play('click');
      }),
    );
    t(6000, () => {
      device.setAlpha(1);
      changed.setAlpha(1);
      sound.play('deploy');
      announce('So we changed the distance.');
      if (!reduced) this.tweens.add({ targets: device, angle: 360, duration: 1400 });
    });
    t(8200, () => {
      this.children.each((c) => {
        if (c !== title && c !== tag)
          (c as unknown as { setAlpha?: (a: number) => void }).setAlpha?.(0.08);
      });
      title.setAlpha(1);
      tag.setAlpha(1);
      sound.play('link');
      announce('Heist. Distance is your greatest weapon.');
    });
    const done = () => {
      saveProgress({ seenIntro: true });
      this.scene.start('Title');
    };
    t(10400, done);
    this.input.once('pointerup', done);
    this.input.keyboard?.once('keydown', done);
    addCenteredText(this, height - 28, 'Tap or press any key to skip', TEXT_STYLES.hint);
  }
}
