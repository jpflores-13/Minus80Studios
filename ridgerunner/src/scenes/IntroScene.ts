import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import { drawBackdrop, halo } from '../render/backdrop';
import { announce } from '../ui/announce';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

const LINES = [
  'In the ancient forests of the Pacific Northwest, a little salamander follows the water.',
  'The streams feel familiar.',
  'But beyond the forest’s ridges, other streams are waiting to be discovered.',
];

export class IntroScene extends Phaser.Scene {
  private haloFx!: Phaser.GameObjects.Graphics;
  private moss!: Phaser.GameObjects.Image;

  constructor() {
    super('Intro');
  }

  create(data: { replay?: boolean }): void {
    if (progress().seenIntro && !data.replay) return void this.scene.start('Title');
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.forest).fadeIn(400);
    drawBackdrop(this);
    this.haloFx = this.add.graphics().setDepth(-1);
    this.moss = this.add
      .image(width * 0.3, height * 0.6, 'moss-0')
      .setScale(6)
      .setDepth(0);
    this.tweens.add({
      targets: this.moss,
      x: '+=40',
      duration: 2600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    const texts = LINES.map((l, i) =>
      addCenteredText(this, 160 + i * 70, l, {
        ...TEXT_STYLES.body,
        wordWrap: { width: 900 },
      }).setAlpha(0),
    );
    LINES.forEach((l, i) =>
      this.time.delayedCall(700 + i * 1600, () => {
        texts[i]?.setAlpha(1);
        announce(l);
      }),
    );
    const done = () => {
      saveProgress({ seenIntro: true });
      this.scene.start('Title');
    };
    this.time.delayedCall(700 + LINES.length * 1600 + 900, done);
    this.input.once('pointerup', done);
    this.input.keyboard?.once('keydown', done);
    addCenteredText(this, height - 40, 'Tap or press any key to skip', TEXT_STYLES.hint);
  }

  override update(time: number): void {
    this.haloFx.clear();
    const pulse = progress().reducedEffects ? 0 : Math.sin(time / 260) * 6;
    halo(this.haloFx, this.moss.x, this.moss.y, 86 + pulse, PALETTE.gold);
  }
}
