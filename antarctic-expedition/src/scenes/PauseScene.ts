import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

interface PauseData {
  returnTo: string;
  returnData: Record<string, unknown>;
}

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create(data: PauseData): void {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, PALETTE.ink, 0.85).setOrigin(0);
    addCenteredText(this, 220, 'PAUSED', TEXT_STYLES.title);
    const resume = () => {
      this.scene.resume(data.returnTo);
      this.scene.stop();
    };
    new Menu(
      this,
      [
        { label: () => 'RESUME', action: resume },
        {
          label: () => 'RESTART (R)',
          action: () => {
            this.scene.stop(data.returnTo);
            this.scene.stop();
            this.scene.start(data.returnTo, data.returnData);
          },
        },
        { label: () => 'SOUND ON / OFF', action: () => void sound.toggleMute() },
        {
          label: () => 'QUIT',
          action: () => {
            this.scene.stop(data.returnTo);
            this.scene.start('Title');
          },
        },
      ],
      width / 2,
      300,
      420,
      72,
      resume,
    );
  }
}
