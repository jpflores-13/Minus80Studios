import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { progress } from '../config/progress';
import { sound } from '../audio/Sound';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

// Dev builds: ?scene=Play&level=3 jumps straight into a scene while iterating.
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    if (import.meta.env.DEV) {
      const q = new URLSearchParams(window.location.search);
      const scene = q.get('scene');
      if (scene === 'Play')
        return void this.scene.start('Play', {
          kind: 'campaign',
          index: Number(q.get('level') ?? 0),
        });
      if (scene) return void this.scene.start(scene, {});
    }
    this.scene.start('Splash');
  }
}

/** Minus 80 Studios branding, then the opening (first time) or the title. Any input skips. */
export class SplashScene extends Phaser.Scene {
  constructor() {
    super('Splash');
  }

  create(): void {
    const { height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.ink);
    addCenteredText(this, height / 2 - 30, '-80', {
      ...TEXT_STYLES.display,
      fontSize: '120px',
      fontFamily: 'Georgia, serif',
    });
    addCenteredText(this, height / 2 + 50, 'S T U D I O S', {
      ...TEXT_STYLES.label,
      color: PALETTE.textDim,
    });
    addCenteredText(this, height - 40, 'Press any key or tap', TEXT_STYLES.hint);
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      sound.unlock();
      this.scene.start(progress().seenOpening ? 'Title' : 'Opening');
    };
    this.time.delayedCall(1800, go);
    this.input.once('pointerdown', go);
    this.input.keyboard?.once('keydown', go);
  }
}
