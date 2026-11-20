import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

const onOff = (v: boolean) => (v ? 'ON' : 'OFF');
const cycle = (v: number, opts: number[]) =>
  opts[(opts.indexOf(v) + 1) % opts.length] ?? opts[0] ?? 1;

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super('Settings');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.charcoal);
    addCenteredText(this, 50, 'SETTINGS', TEXT_STYLES.title);
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
          label: () =>
            `HOW MUCH YOU CAN SEE: ${({ 0.7: 'LITTLE', 1: 'NORMAL', 1.5: 'MORE', 2.2: 'LOTS' } as Record<number, string>)[progress().ambient] ?? 'NORMAL'}`,
          help: 'How far the tunnels show around you without touching.',
          action: () => saveProgress({ ambient: cycle(progress().ambient, [0.7, 1, 1.5, 2.2]) }),
        },
        {
          label: () =>
            `TOUCH MEMORY: ${({ 1: 'NORMAL', 1.6: 'LONGER', 2.5: 'LONGEST' } as Record<number, string>)[progress().memoryScale] ?? 'NORMAL'}`,
          help: 'How long touch marks stay before fading.',
          action: () => saveProgress({ memoryScale: cycle(progress().memoryScale, [1, 1.6, 2.5]) }),
        },
        {
          label: () => `AUTO-BITE FOOD: ${onOff(progress().autoBite)}`,
          help: 'Bites prey you have recognised as soon as your nose is on it.',
          action: () => saveProgress({ autoBite: !progress().autoBite }),
        },
        {
          label: () => `VIBRATION: ${onOff(progress().haptics)}`,
          help: 'Only on phones that support it. Never needed to play.',
          action: () => saveProgress({ haptics: !progress().haptics }),
        },
        {
          label: () => `EFFECTS: ${progress().reducedEffects ? 'REDUCED' : 'FULL'}`,
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
          help: 'Move: arrows or WASD. Focus: hold Shift or F. Bite: Space or E. Pause: Esc. Restart: R. Gamepad: stick, A bite, shoulder buttons focus. Phone: drag on the left to move, BITE and FOCUS on the right.',
          action: () => undefined,
        },
        { label: () => 'BACK', action: () => this.scene.start('Title') },
      ],
      width / 2,
      110,
      620,
      58,
      () => this.scene.start('Title'),
    );
    addCenteredText(
      this,
      height - 24,
      'Everything is playable with sound and vibration off.',
      TEXT_STYLES.hint,
    );
  }
}
