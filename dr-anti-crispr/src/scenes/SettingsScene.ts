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
    addCenteredText(this, 120, 'SETTINGS', TEXT_STYLES.title);
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
          label: () => `AIM: ${progress().autoAim ? 'AUTOMATIC' : 'STRAIGHT UP'}`,
          help: 'Automatic aims at the nearest machine each weapon can affect. Straight up fires forward, arcade style.',
          action: () => saveProgress({ autoAim: !progress().autoAim }),
        },
        {
          label: () => `TOUCH: ${progress().dragToMove ? 'DRAG TO MOVE' : 'BUTTONS ONLY'}`,
          action: () => saveProgress({ dragToMove: !progress().dragToMove }),
        },
        {
          label: () => `EFFECTS: ${progress().reducedEffects ? 'REDUCED' : 'FULL'}`,
          help: 'Reduced turns off shaking, flashes and drifting backgrounds.',
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
          label: () => 'WATCH THE OPENING AGAIN',
          action: () => this.scene.start('Intro', { replay: true }),
        },
        {
          label: () => 'CONTROLS',
          help: 'Phone: drag anywhere to move; tap ACR CLOUD and REINFORCE. Keys: arrows or WASD move, E or Shift cloud, Space reinforce, Esc pause, 1 to 3 pick upgrades. Gamepad: stick moves, A reinforce, B cloud, Start pause.',
          action: () => undefined,
        },
        { label: () => 'BACK', action: () => this.scene.start('Title') },
      ],
      width / 2,
      240,
      580,
      84,
      () => this.scene.start('Title'),
    );
    addCenteredText(
      this,
      height - 40,
      'Tip: Gentle difficulty halves the damage you take.',
      TEXT_STYLES.hint,
    );
  }
}
