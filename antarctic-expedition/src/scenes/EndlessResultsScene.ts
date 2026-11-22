import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress } from '../config/progress';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

export class EndlessResultsScene extends Phaser.Scene {
  constructor() {
    super('EndlessResults');
  }

  create(data: { score: number; laps: number }): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.midnight).fadeIn(200);
    const best = progress().bestEndless;

    addCenteredText(this, 140, 'RUN OVER', TEXT_STYLES.title);
    addCenteredText(
      this,
      200,
      `Final score: ${data.score}\nLaps completed: ${data.laps}\nBest score: ${best}`,
      { ...TEXT_STYLES.body, align: 'center' },
    );
    if (data.score >= best && data.score > 0) {
      addCenteredText(this, 290, 'New best score!', {
        ...TEXT_STYLES.hud,
        color: PALETTE.textGold,
      });
    }

    new Menu(
      this,
      [
        { label: () => 'RUN AGAIN', action: () => this.scene.start('Endless') },
        { label: () => 'TITLE', action: () => this.scene.start('Title') },
      ],
      width / 2,
      400,
      420,
      62,
      () => this.scene.start('Title'),
    );
    addCenteredText(this, height - 34, 'Esc to go back', TEXT_STYLES.hint);
    sound.playSong('title');
  }
}
