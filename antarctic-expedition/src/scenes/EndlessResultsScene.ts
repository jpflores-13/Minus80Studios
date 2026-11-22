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

    // Stacked off each block's measured height — see OneDropResultsScene for the same fix.
    let y = 140;
    const titleText = this.add.text(width / 2, y, 'RUN OVER', TEXT_STYLES.title).setOrigin(0.5, 0);
    y += titleText.height + 20;
    const statsText = this.add
      .text(
        width / 2,
        y,
        `Final score: ${data.score}\nLaps completed: ${data.laps}\nBest score: ${best}`,
        { ...TEXT_STYLES.body, align: 'center' },
      )
      .setOrigin(0.5, 0);
    y += statsText.height + 20;
    if (data.score >= best && data.score > 0) {
      const best2 = this.add
        .text(width / 2, y, 'New best score!', { ...TEXT_STYLES.hud, color: PALETTE.textGold })
        .setOrigin(0.5, 0);
      y += best2.height + 20;
    }

    const menuY = Math.min(Math.max(400, y), height - 200);
    new Menu(
      this,
      [
        { label: () => 'RUN AGAIN', action: () => this.scene.start('Endless') },
        { label: () => 'TITLE', action: () => this.scene.start('Title') },
      ],
      width / 2,
      menuY,
      420,
      62,
      () => this.scene.start('Title'),
    );
    addCenteredText(this, height - 34, 'Esc to go back', TEXT_STYLES.hint);
    sound.playSong('title');
  }
}
