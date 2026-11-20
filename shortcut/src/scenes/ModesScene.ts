import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import { BLUEPRINTS } from '../levels/blueprints';
import { announce } from '../ui/announce';
import { FocusButton, FocusList } from '../ui/Controls';
import { SCI } from '../ui/scienceArt';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

// After the reveal: Science Mode, City Planner, Blueprint, and watching the ending again.
export class ModesScene extends Phaser.Scene {
  private focus = new FocusList();

  constructor() {
    super('Modes');
  }

  create(): void {
    this.focus = new FocusList();
    const science = progress().scienceMode;
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(science ? SCI.bg : PALETTE.cream);
    const ink = science ? SCI.text : PALETTE.text;
    addCenteredText(this, 60, 'MORE TO PLAY', { ...TEXT_STYLES.title, color: ink });
    if (!progress().revealed) {
      addCenteredText(this, height / 2, 'Finish all eight levels of Ferngate to unlock these.', {
        ...TEXT_STYLES.body,
        color: ink,
      });
    }
    const solved = Object.keys(progress().blueprints).length;
    const items: [string, string, () => void][] = [
      [
        science ? 'SCIENCE MODE: ON' : 'SCIENCE MODE: OFF',
        'The same levels and engine, shown as chromatin, cohesin and CTCF, with science tooltips.',
        () => {
          saveProgress({ scienceMode: !progress().scienceMode });
          this.scene.restart();
        },
      ],
      [
        'CITY PLANNER',
        'A sandbox: change every rule, compare maps, export data.',
        () => this.scene.start('Planner'),
      ],
      [
        `BLUEPRINT (${solved}/${BLUEPRINTS.length} matched)`,
        'Rebuild the hidden city behind a target connectivity map.',
        () => this.scene.start('Blueprint', { index: 0 }),
      ],
      [
        'PLAY THE LEVELS',
        'Back to Ferngate, in the current view.',
        () => this.scene.start('LevelSelect'),
      ],
      ['WATCH THE ENDING AGAIN', '', () => this.scene.start('Reveal')],
      ['BACK TO TITLE', '', () => this.scene.start('Title')],
    ];
    const open = progress().revealed;
    items.forEach(([label, help, fn], i) => {
      const locked = !open && i < 3;
      const b = new FocusButton(
        this,
        width / 2,
        150 + i * 74,
        520,
        58,
        () => (locked ? `${label}  (locked)` : label),
        () => {
          if (locked) {
            sound.play('deny');
            announce('Locked. Finish all eight levels first.');
            return;
          }
          sound.unlock();
          sound.play('click');
          fn();
        },
        i === 0 ? PALETTE.goldDark : PALETTE.accent,
        help,
      );
      if (locked) b.button.setEnabled(false);
      this.focus.add(b);
      if (help)
        this.add
          .text(width / 2 + 280, 150 + i * 74, help, {
            ...TEXT_STYLES.small,
            fontSize: '14px',
            wordWrap: { width: 330 },
            color: science ? SCI.textDim : PALETTE.textDim,
          })
          .setOrigin(0, 0.5);
    });
    addCenteredText(this, height - 30, '↑ ↓ or Tab choose · ENTER select · ESC back', {
      ...TEXT_STYLES.hint,
      fontSize: '16px',
      color: science ? SCI.textDim : PALETTE.textDim,
    });
    const kb = this.input.keyboard;
    kb?.on('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') return this.scene.start('Title');
      if (e.key === 'ArrowDown')
        return this.focus.handle(new KeyboardEvent('keydown', { key: 'Tab' }));
      if (e.key === 'ArrowUp')
        return this.focus.handle(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }));
      this.focus.handle(e);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => kb?.removeAllListeners());
    this.focus.focus(0);
  }
}
