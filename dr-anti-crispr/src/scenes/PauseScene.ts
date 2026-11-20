import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create(data: { mode: string }): void {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x0d0a1f, 0.85).setOrigin(0);
    addCenteredText(this, 360, 'PAUSED', TEXT_STYLES.title);
    const resume = () => {
      this.scene.resume('Battle');
      this.scene.stop();
    };
    new Menu(
      this,
      [
        { label: () => 'RESUME', action: resume },
        {
          label: () => 'RESTART',
          action: () => {
            this.scene.stop('Battle');
            this.scene.stop();
            this.scene.start('Battle', { mode: data.mode });
          },
        },
        { label: () => 'SOUND ON / OFF', action: () => void sound.toggleMute() },
        {
          label: () => 'QUIT',
          action: () => {
            this.scene.stop('Battle');
            this.scene.start('Title');
          },
        },
      ],
      width / 2,
      500,
      460,
      90,
      resume,
    );
  }
}
