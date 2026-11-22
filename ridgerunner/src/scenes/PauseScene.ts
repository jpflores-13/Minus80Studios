import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create(data: { levelId: string; beyond?: boolean }): void {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, PALETTE.ink, 0.85).setOrigin(0);
    addCenteredText(this, height * 0.3, 'PAUSED', TEXT_STYLES.title);
    const resume = () => {
      this.scene.stop();
      this.scene.resume('Level');
    };
    new Menu(
      this,
      [
        { label: () => 'RESUME', action: resume },
        {
          label: () => 'RESTART',
          action: () => {
            this.scene.stop();
            this.scene.stop('Level');
            this.scene.start('Level', { levelId: data.levelId, beyond: data.beyond });
          },
        },
        {
          label: () => 'TITLE',
          action: () => {
            this.scene.stop();
            this.scene.stop('Level');
            this.scene.start('Title');
          },
        },
      ],
      width / 2,
      height * 0.45,
      360,
      60,
      resume,
    );
  }
}
