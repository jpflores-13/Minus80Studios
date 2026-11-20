import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

const onOff = (v: boolean) => (v ? 'ON' : 'OFF');

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super('Settings');
  }

  create(): void {
    const { width } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.navy);
    addCenteredText(this, 60, 'SETTINGS', TEXT_STYLES.title);
    new Menu(
      this,
      [
        {
          label: () => `SOUND: ${onOff(!progress().muted)}`,
          action: () => void sound.toggleMute(),
        },
        {
          label: () => `VOLUME: ${Math.round(progress().volume * 100)}%`,
          action: () =>
            sound.setVolume(
              progress().volume >= 1 ? 0 : Math.round((progress().volume + 0.1) * 10) / 10,
            ),
        },
        {
          label: () => `MUSIC: ${onOff(progress().music)}`,
          action: () => {
            saveProgress({ music: !progress().music });
            sound.applyVolume();
          },
        },
        {
          label: () => `EFFECTS: ${progress().reducedEffects ? 'REDUCED' : 'FULL'}`,
          help: 'Reduced stops flashes, pulsing and moving dashes.',
          action: () => saveProgress({ reducedEffects: !progress().reducedEffects }),
        },
        {
          label: () => `LARGE TEXT: ${onOff(progress().largeText)}`,
          action: () => {
            saveProgress({ largeText: !progress().largeText });
            this.scene.restart();
          },
        },
        {
          label: () => 'CONTROLS',
          help: 'Move: WASD or arrows. Run: Shift. Folder: Space (again to let go). Pause: Esc. Restart: R. Gamepad: stick, A Folder, B or right shoulder to run. Phone: drag on the left to move, FOLDER and RUN on the right.',
          action: () => undefined,
        },
        { label: () => 'BACK', action: () => this.scene.start('Title') },
      ],
      width / 2,
      150,
      560,
      70,
      () => this.scene.start('Title'),
    );
  }
}
