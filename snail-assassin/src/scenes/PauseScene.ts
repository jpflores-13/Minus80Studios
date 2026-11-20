import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { settings, updateSettings } from '../config/settings';
import { Button } from '../ui/Button';
import { announce } from '../ui/announce';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

/** Overlay shown while the hunt is paused. */
export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create(data: { characterId: string }): void {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x000000, 0.65).setOrigin(0);
    addCenteredText(this, height * 0.3, 'PAUSED', TEXT_STYLES.title);
    const options = addCenteredText(this, height * 0.52, '', {
      ...TEXT_STYLES.body,
      align: 'center',
      lineSpacing: 10,
    });
    const render = () =>
      options.setText(
        [
          'Esc  resume',
          'R  restart hunt',
          'C  choose another assassin',
          'T  title screen',
          `M  sound: ${settings().muted ? 'off' : 'on'}    − / +  volume ${Math.round(settings().volume * 100)}%`,
          `V  effects: ${settings().reducedEffects ? 'reduced' : 'full'}`,
        ].join('\n'),
      );
    render();
    announce(`Paused. ${options.text.replace(/\n/g, '. ')}`);

    const kb = this.input.keyboard;
    const close = (next: () => void) => {
      kb?.removeAllListeners();
      this.scene.stop();
      next();
    };
    const hunt = () => this.scene.get('Hunt').scene;
    kb?.on('keydown-ESC', () => close(() => this.scene.resume('Hunt')));
    kb?.on('keydown-R', () => close(() => hunt().restart({ characterId: data.characterId })));
    kb?.on('keydown-C', () =>
      close(() => hunt().start('Select', { mode: 'hunt', characterId: data.characterId })),
    );
    kb?.on('keydown-T', () => close(() => hunt().start('Title')));
    kb?.on('keydown-M', () => {
      sound.toggleMute();
      render();
    });
    const vol = (d: number) => {
      sound.setVolume(settings().volume + d);
      render();
    };
    kb?.on('keydown-MINUS', () => vol(-0.1));
    kb?.on('keydown-PLUS', () => vol(0.1));
    kb?.on('keydown-EQUALS', () => vol(0.1));
    kb?.on('keydown-V', () => {
      updateSettings({ reducedEffects: !settings().reducedEffects });
      render();
    });
    const by = height * 0.82;
    new Button(this, width / 2 - 260, by, 220, 48, 'RESUME', () =>
      close(() => this.scene.resume('Hunt')),
    );
    new Button(this, width / 2, by, 220, 48, 'RESTART', () =>
      close(() => hunt().restart({ characterId: data.characterId })),
    );
    new Button(this, width / 2 - 130, by + 64, 220, 48, 'CHOOSE ASSASSIN', () =>
      close(() => hunt().start('Select', { mode: 'hunt', characterId: data.characterId })),
    );
    new Button(this, width / 2 + 130, by + 64, 220, 48, 'SOUND ON / OFF', () => {
      sound.toggleMute();
      render();
    });
    new Button(this, width / 2 + 260, by, 220, 48, 'HOME', () =>
      close(() => hunt().start('Title')),
    );
  }
}
