import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import { drawBackdrop } from '../render/backdrop';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

export class SettingsScene extends Phaser.Scene {
  private menu!: Menu;

  constructor() {
    super('Settings');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.forest);
    drawBackdrop(this);
    const { width, height } = this.scale;
    addCenteredText(this, 70, 'SETTINGS & ACCESSIBILITY', TEXT_STYLES.title);
    this.menu = new Menu(
      this,
      [
        {
          label: () => `REDUCED MOTION: ${progress().reducedEffects ? 'ON' : 'OFF'}`,
          help: 'Turns off screen-shake-style effects and background animation.',
          action: () => {
            saveProgress({ reducedEffects: !progress().reducedEffects });
            this.menu.refresh();
          },
        },
        {
          label: () => `LARGE TEXT: ${progress().largeText ? 'ON' : 'OFF'}`,
          action: () => {
            saveProgress({ largeText: !progress().largeText });
            this.menu.refresh();
          },
        },
        {
          label: () => `EASIER MOISTURE: ${progress().easyMode ? 'ON' : 'OFF'}`,
          help: 'Terrain drains moisture more slowly. A kinder difficulty, not a different game.',
          action: () => {
            saveProgress({ easyMode: !progress().easyMode });
            this.menu.refresh();
          },
        },
        { label: () => 'BACK', action: () => this.scene.start('Title') },
      ],
      width / 2,
      180,
      560,
      62,
      () => this.scene.start('Title'),
    );
    addCenteredText(this, height - 30, 'Arrows choose · Enter toggle · Esc back', TEXT_STYLES.hint);
  }
}
