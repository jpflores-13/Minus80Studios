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
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.night);
    addCenteredText(this, 50, 'SETTINGS', TEXT_STYLES.title);
    new Menu(
      this,
      [
        { label: () => `SOUND: ${onOff(!progress().muted)}`, action: () => sound.toggleMute() },
        {
          label: () => `VOLUME: ${Math.round(progress().volume * 100)}%`,
          help: 'Each press goes up; past 100 it starts again from 0.',
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
          help: 'Reduced turns off screen shake, flashes and drifting backgrounds.',
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
          label: () => `BIG TOUCH BUTTONS: ${onOff(progress().bigButtons)}`,
          action: () => saveProgress({ bigButtons: !progress().bigButtons }),
        },
        {
          label: () => 'CONTROLS',
          help: 'Move: arrows or WASD. Jump: Space, Z or K. Power: E, X or J. Pause: Esc or P. Gamepad: stick or d-pad, A jump, B or X power, Start pause. Hold down and press jump to drop through a ledge.',
          action: () => undefined,
        },
        { label: () => 'BACK', action: () => this.scene.start('Title') },
      ],
      width / 2,
      130,
      480,
      62,
      () => this.scene.start('Title'),
    );
    addCenteredText(
      this,
      height - 26,
      'Tip: Casual difficulty (on the title screen) gives longer countdowns and more health.',
      TEXT_STYLES.hint,
    );
  }
}
