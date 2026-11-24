import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import { matureRhizome, NO_FEATURES, baseConfig } from '../levels/builders';
import { Aboveground, drawSediment, Heatmap, RootRenderer } from '../render/marsh';
import { drawLogo } from '../render/logo';
import { Session } from '../systems/session';
import { announce } from '../ui/announce';
import { TEXT_STYLES } from '../ui/text';

const NARRATION = [
  'Life in the marsh looks pretty peaceful.',
  'Above the mud, anyway.',
  'Below the surface, something extraordinary is happening.',
  'And you’ve got a front-row seat.',
];

/**
 * The brief, skippable opening: title over a quiet marsh, the camera sinks below the water, and
 * the first oxygen pool lights up around a growing root. Then straight into Level 1.
 */
export class OpeningScene extends Phaser.Scene {
  private session!: Session;
  private above!: Aboveground;
  private heat!: Heatmap;
  private roots!: RootRenderer;
  private t = 0;
  private done = false;
  private subtitle!: Phaser.GameObjects.Text;
  private lineIndex = -1;
  private toTitle = false;

  constructor() {
    super('Opening');
  }

  init(data: { toTitle?: boolean }): void {
    this.t = 0;
    this.done = false;
    this.lineIndex = -1;
    this.toTitle = data?.toTitle ?? false;
  }

  create(): void {
    const reduced = progress().reducedMotion;
    this.session = new Session({
      ...baseConfig(),
      id: 'opening',
      title: 'Opening',
      duration: Infinity,
      hoursPerSecond: 3,
      growth: { growthBoost: 2, lateralsEnabled: false, rhizomeRoots: false },
      setup: (plant, _rng, t0) => {
        const { seg } = matureRhizome(plant, 300, 980, 236, t0 - 600);
        plant.ramets.push({ x: 640, bornAt: t0 - 600, plantId: 0 });
        plant.scheduleRoots(seg.id, 640, 238, t0 + 12, 1);
      },
      distractorRate: 0,
      features: NO_FEATURES,
    });
    this.above = new Aboveground(this, { flowerSpikes: true, reducedMotion: reduced });
    drawSediment(this, 9);
    this.heat = new Heatmap(this, this.session.field, 'heat-opening');
    this.roots = new RootRenderer(this);
    const logo = drawLogo(this, 640, 92, 0.6).setDepth(20);
    const tag = this.add
      .text(640, 132, 'It’s a dirty job. Somebody’s gotta oxygenate it.', {
        ...TEXT_STYLES.body,
        fontStyle: 'italic',
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.tweens.add({ targets: [logo, tag], alpha: 0, delay: 2600, duration: 600 });
    this.subtitle = this.add
      .text(640, 640, '', {
        ...TEXT_STYLES.body,
        fontSize: '26px',
        backgroundColor: '#14110ecc',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(30);
    this.add
      .text(1268, 708, 'Skip: any key or tap', TEXT_STYLES.hint)
      .setOrigin(1, 1)
      .setScrollFactor(0)
      .setDepth(30);
    const cam = this.cameras.main;
    cam.setBackgroundColor(PALETTE.mud);
    if (!reduced) {
      cam.setZoom(1.6).centerOn(640, 225);
      this.time.delayedCall(3000, () => {
        cam.zoomTo(1, 3200, 'Sine.easeInOut');
        cam.pan(640, 360, 3200, 'Sine.easeInOut');
      });
    }
    sound.playSong('title');
    announce('MUCK LIFE. It’s a dirty job. Somebody’s gotta oxygenate it.');
    this.time.delayedCall(400, () => {
      this.input.once('pointerdown', () => this.finish());
      this.input.keyboard?.once('keydown', () => this.finish());
    });
  }

  override update(_time: number, delta: number): void {
    const dt = Math.min(0.05, delta / 1000);
    this.t += dt;
    // The sediment stays dark until the camera is below the water, then growth begins.
    const s = this.session;
    if (this.t > 5) s.update(dt);
    this.above.draw(dt, 1, s.plant.ramets, s.simHour);
    this.heat.draw(progress().colormap, 'combined', s.imaging);
    this.roots.draw(s.plant, s.simHour, 1);
    const line = Math.floor((this.t - 3.2) / 2.6);
    if (line !== this.lineIndex && line >= 0 && line < NARRATION.length) {
      this.lineIndex = line;
      this.subtitle.setText(NARRATION[line]!);
      announce(NARRATION[line]!);
    }
    if (this.t > 3.2 + NARRATION.length * 2.6 + 0.8) this.finish();
  }

  private finish(): void {
    if (this.done) return;
    this.done = true;
    sound.unlock();
    const first = !progress().seenOpening;
    saveProgress({ seenOpening: true });
    if (first && !this.toTitle) this.scene.start('LevelIntro', { index: 0 });
    else this.scene.start('Title');
  }
}
