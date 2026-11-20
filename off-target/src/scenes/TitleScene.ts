import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import { DIFFICULTIES, type Difficulty } from '../config/tuning';
import { STAGES } from '../levels';
import { toggleFullscreen } from '../ui/fullscreen';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

const ORDER: Difficulty[] = ['casual', 'arcade', 'precision'];

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.night).fadeIn(400);
    const reduced = progress().reducedEffects;
    // a drifting cell interior behind the title
    for (let i = 0; i < 18; i++) {
      const img = this.add
        .image(
          Phaser.Math.Between(0, width),
          Phaser.Math.Between(0, height),
          Phaser.Math.RND.pick(['blob', 'ribosome']),
        )
        .setScale(4)
        .setAlpha(0.5);
      if (!reduced)
        this.tweens.add({
          targets: img,
          x: img.x - 200,
          duration: Phaser.Math.Between(9000, 16000),
          yoyo: true,
          repeat: -1,
        });
    }
    this.add.image(width * 0.18, height * 0.62, 'ace-idle').setScale(9);
    this.add.image(width * 0.82, height * 0.6, 'chop-0').setScale(5);
    this.add.image(width * 0.82, height * 0.81, 'gene').setScale(4);

    addCenteredText(this, 120, 'OFF TARGET.', TEXT_STYLES.display);
    addCenteredText(this, 196, 'Every second counts.', {
      ...TEXT_STYLES.hud,
      color: PALETTE.textMint,
    });

    const next = STAGES.find((s) => s.number === progress().cleared + 1) ?? STAGES[0]!;
    new Menu(
      this,
      [
        {
          label: () => (progress().cleared > 0 ? `CONTINUE: STAGE ${next.number}` : 'PLAY'),
          action: () =>
            progress().seenIntro ? this.startStage(next.id) : this.scene.start('Intro'),
        },
        { label: () => 'STAGES & TIME TRIALS', action: () => this.scene.start('StageSelect') },
        {
          label: () => `DIFFICULTY: ${DIFFICULTIES[progress().difficulty].name.toUpperCase()}`,
          help: DIFFICULTIES[progress().difficulty].description,
          action: () => {
            const i = ORDER.indexOf(progress().difficulty);
            saveProgress({ difficulty: ORDER[(i + 1) % ORDER.length] ?? 'arcade' });
          },
        },
        { label: () => 'SETTINGS & ACCESSIBILITY', action: () => this.scene.start('Settings') },
        { label: () => 'THE MACHINES', action: () => this.scene.start('Machines') },
        { label: () => 'DID YOU KNOW?', action: () => this.scene.start('Ending') },
        ...(this.sys.game.device.fullscreen.available
          ? [
              {
                label: () => (this.scale.isFullscreen ? 'EXIT FULL SCREEN' : 'FULL SCREEN'),
                action: () => toggleFullscreen(this),
              },
            ]
          : []),
        { label: () => 'MORE -80 STUDIOS GAMES', action: () => (window.location.href = '../') },
      ],
      width / 2,
      280,
      440,
    );
    addCenteredText(
      this,
      height - 26,
      'Arrows choose · Enter select · A Minus 80 Studios game',
      TEXT_STYLES.hint,
    );
    sound.playSong('title');
  }

  private startStage(id: string): void {
    const stage = STAGES.find((s) => s.id === id);
    if (stage?.chooseHero) this.scene.start('HeroSelect', { stageId: id });
    else this.scene.start('Stage', { stageId: id });
  }
}
