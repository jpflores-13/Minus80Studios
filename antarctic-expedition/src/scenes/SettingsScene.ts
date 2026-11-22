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
    this.cameras.main.setBackgroundColor(PALETTE.midnight).fadeIn(200);
    addCenteredText(this, 70, 'SETTINGS & ACCESSIBILITY', TEXT_STYLES.title);
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
          help: 'Reduced turns off screen fades and pulsing effects.',
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
          label: () => `RELAXED MICROSCOPY: ${onOff(progress().relaxedMicroscopy)}`,
          help: 'Slows every ONE DROP, RECONSTRUCT, and Endless round so there is more time to look.',
          action: () => saveProgress({ relaxedMicroscopy: !progress().relaxedMicroscopy }),
        },
        {
          label: () => 'CONTROLS',
          help:
            'DIVE: arrows or WASD to swim, Space to photograph, E to collect the sample. ' +
            'ONE DROP, RECONSTRUCT, Endless: tap or click a particle to document it, tap its ' +
            '? badge to flag it as uncertain, or Tab to select and Enter / U on keyboard. ' +
            'Escape or P pauses anywhere; R restarts from the pause menu.',
          action: () => undefined,
        },
        { label: () => 'BACK', action: () => this.scene.start('Title') },
      ],
      width / 2,
      150,
      640,
      62,
      () => this.scene.start('Title'),
    );
    addCenteredText(this, height - 34, 'Esc to go back', TEXT_STYLES.hint);
  }
}
