import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create(data: { jobId: string }): void {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x14232b, 0.85).setOrigin(0);
    addCenteredText(this, 180, 'PAUSED', TEXT_STYLES.title);
    const resume = () => {
      this.scene.resume('Job');
      this.scene.stop();
    };
    new Menu(
      this,
      [
        { label: () => 'RESUME', action: resume },
        {
          label: () => 'RESTART (R)',
          action: () => {
            this.scene.stop('Job');
            this.scene.stop();
            this.scene.start('Job', data);
          },
        },
        { label: () => 'SOUND ON / OFF', action: () => void sound.toggleMute() },
        {
          label: () => 'QUIT',
          action: () => {
            this.scene.stop('Job');
            this.scene.start('Title');
          },
        },
      ],
      width / 2,
      290,
      420,
      72,
      resume,
    );
  }
}
