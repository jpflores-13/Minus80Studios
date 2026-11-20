import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create(data: { stageId: string; hero: string }): void {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x0d0a1f, 0.8).setOrigin(0);
    addCenteredText(this, 150, 'PAUSED', TEXT_STYLES.title);
    const resume = () => {
      this.scene.resume('Stage');
      this.scene.stop();
    };
    new Menu(
      this,
      [
        { label: () => 'RESUME', action: resume },
        { label: () => 'RESTART STAGE', action: () => this.restart(data) },
        { label: () => (sound.toggleMute() ? 'SOUND: OFF' : 'SOUND: ON'), action: () => undefined },
        { label: () => 'QUIT TO STAGES', action: () => this.quit() },
      ],
      width / 2,
      260,
      420,
      66,
      resume,
    );
  }

  private restart(data: { stageId: string; hero: string }): void {
    this.scene.stop('Stage');
    this.scene.stop();
    this.scene.start('Stage', { stageId: data.stageId, hero: data.hero });
  }

  private quit(): void {
    this.scene.stop('Stage');
    this.scene.stop('Hud');
    this.scene.start('StageSelect');
  }
}
