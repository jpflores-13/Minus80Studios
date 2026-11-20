import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import { announce } from '../ui/announce';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

interface Item {
  label: () => string;
  help: string;
  activate: () => void;
  adjust?: (dir: -1 | 1) => void;
}

const onOff = (v: boolean) => (v ? 'ON' : 'OFF');

// Settings and accessibility options. Arrow keys or tap to choose, Enter or tap to change,
// Esc to go back. Everything is also announced for screen readers.
export class SettingsScene extends Phaser.Scene {
  private items: Item[] = [];
  private rows: Phaser.GameObjects.Text[] = [];
  private helpText!: Phaser.GameObjects.Text;
  private index = 0;

  constructor() {
    super('Settings');
  }

  create(data: { index?: number }): void {
    this.index = data.index ?? 0;
    const { height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.cream);
    addCenteredText(this, 50, 'SETTINGS', TEXT_STYLES.title);

    this.items = [
      {
        label: () => `SOUND: ${onOff(!progress().muted)}`,
        help: 'Turn all sound on or off.',
        activate: () => sound.toggleMute(),
      },
      {
        label: () => `VOLUME: ${Math.round(progress().volume * 100)}%`,
        help: 'Use left and right to change the volume.',
        activate: () => this.nudgeVolume(1),
        adjust: (dir) => this.nudgeVolume(dir),
      },
      {
        label: () => `EFFECTS: ${progress().reducedEffects ? 'REDUCED' : 'FULL'}`,
        help: 'Reduced stops the moving parcels and title animation. Deliveries flash the building instead.',
        activate: () => saveProgress({ reducedEffects: !progress().reducedEffects }),
      },
      {
        label: () => `LARGE TEXT: ${onOff(progress().largeText)}`,
        help: 'Makes all the writing in the game bigger.',
        activate: () => {
          saveProgress({ largeText: !progress().largeText });
          this.scene.restart({ index: this.index });
        },
      },
      {
        label: () => 'KEYBOARD CONTROLS',
        help: 'Planning: left and right arrows move along the road (hold Shift for big steps), Enter places, turns or picks up, Delete removes, 1 and 2 pick a tool, R runs, H shows the briefing. Running: F fast, P pause, S stop and edit. M mutes anywhere.',
        activate: () => announce(this.items[4]?.help ?? ''),
      },
      {
        label: () => 'BACK',
        help: 'Return to the title screen.',
        activate: () => this.scene.start('Title'),
      },
    ];
    this.rows = this.items.map((_item, i) => {
      const row = addCenteredText(this, 120 + i * 54, '', TEXT_STYLES.body).setInteractive({
        useHandCursor: true,
      });
      row.on('pointerover', () => this.focus(i));
      row.on('pointerup', () => {
        this.focus(i);
        this.activate();
      });
      return row;
    });
    this.helpText = addCenteredText(this, height - 80, '', {
      ...TEXT_STYLES.hint,
      align: 'center',
      wordWrap: { width: 980 },
    });
    addCenteredText(this, height - 26, '↑ ↓ choose · ENTER change · ← → volume · ESC back', {
      ...TEXT_STYLES.hint,
      fontSize: '16px',
    });

    const kb = this.input.keyboard;
    kb?.on('keydown', (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') this.focus(this.index + 1);
      else if (e.key === 'ArrowUp') this.focus(this.index - 1);
      else if (e.key === 'ArrowLeft') this.items[this.index]?.adjust?.(-1);
      else if (e.key === 'ArrowRight') this.items[this.index]?.adjust?.(1);
      else if (e.key === 'Enter' || e.key === ' ') this.activate();
      else if (e.key === 'Escape') this.scene.start('Title');
      this.refresh();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => kb?.removeAllListeners());
    this.focus(Math.min(this.index, this.items.length - 1));
  }

  private focus(i: number): void {
    const n = this.items.length;
    this.index = (i + n) % n;
    this.refresh();
    const item = this.items[this.index];
    if (item) announce(`${item.label()}. ${item.help}`);
  }

  private activate(): void {
    sound.unlock();
    sound.play('click');
    this.items[this.index]?.activate();
    this.refresh();
    const item = this.items[this.index];
    if (item) announce(item.label());
  }

  private refresh(): void {
    this.rows.forEach((row, i) => {
      const item = this.items[i];
      if (!item) return;
      const active = i === this.index;
      row.setText(active ? `▸ ${item.label()} ◂` : item.label()).setAlpha(active ? 1 : 0.7);
    });
    this.helpText.setText(this.items[this.index]?.help ?? '');
  }

  private nudgeVolume(dir: -1 | 1): void {
    sound.unlock();
    sound.setVolume(Math.round((progress().volume + dir * 0.1) * 10) / 10);
    announce(`Volume ${Math.round(progress().volume * 100)} percent`);
    this.refresh();
  }
}
