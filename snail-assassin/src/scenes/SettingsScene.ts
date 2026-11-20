import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { DEFAULT_KEYS, settings, updateSettings, type Action } from '../config/settings';
import { announce } from '../ui/announce';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

interface Item {
  label: () => string;
  help: string;
  activate: () => void;
  // Left/right arrows (volume only)
  adjust?: (dir: -1 | 1) => void;
}

const ACTION_NAMES: Record<Action, string> = {
  up: 'Move up',
  down: 'Move down',
  left: 'Move left',
  right: 'Move right',
  primary: 'First ability (Q)',
  secondary: 'Second ability (E)',
  capture: 'Capture',
  pause: 'Pause',
};

const onOff = (v: boolean) => (v ? 'ON' : 'OFF');

// Settings and accessibility options. Arrow keys or tap to choose, Enter or tap to change,
// Esc to go back. Everything is also announced for screen readers.
export class SettingsScene extends Phaser.Scene {
  private items: Item[] = [];
  private rows: Phaser.GameObjects.Text[] = [];
  private helpText!: Phaser.GameObjects.Text;
  private index = 0;
  private page: 'main' | 'controls' = 'main';
  private waitingFor: Action | null = null;

  constructor() {
    super('Settings');
  }

  create(data: { page?: 'main' | 'controls'; index?: number }): void {
    this.page = data.page ?? 'main';
    this.index = data.index ?? 0;
    this.waitingFor = null;
    this.cameras.main.setBackgroundColor(0x06192b);
    const { height } = this.scale;
    addCenteredText(this, 50, this.page === 'main' ? 'SETTINGS' : 'CONTROLS', TEXT_STYLES.title);

    this.items = this.page === 'main' ? this.mainItems() : this.controlItems();
    this.rows = this.items.map((_item, i) => {
      const row = addCenteredText(this, 120 + i * 50, '', TEXT_STYLES.body).setInteractive({
        useHandCursor: true,
      });
      row.on('pointerover', () => this.focus(i));
      row.on('pointerup', () => {
        this.focus(i);
        this.activate();
      });
      return row;
    });
    this.helpText = addCenteredText(this, height - 70, '', {
      ...TEXT_STYLES.hint,
      align: 'center',
      wordWrap: { width: 900 },
    });
    addCenteredText(this, height - 28, '↑ ↓ choose · ENTER change · ← → volume · ESC back', {
      ...TEXT_STYLES.hint,
      fontSize: '16px',
    });

    const kb = this.input.keyboard;
    kb?.on('keydown', (e: KeyboardEvent) => this.onKey(e));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => kb?.removeAllListeners());
    this.focus(Math.min(this.index, this.items.length - 1));
  }

  private mainItems(): Item[] {
    return [
      {
        label: () => `SOUND: ${onOff(!settings().muted)}`,
        help: 'Turn all sound on or off.',
        activate: () => sound.toggleMute(),
      },
      {
        label: () => `VOLUME: ${Math.round(settings().volume * 100)}%`,
        help: 'Use left and right to change the volume.',
        activate: () => this.nudgeVolume(1),
        adjust: (dir) => this.nudgeVolume(dir),
      },
      {
        label: () => `EFFECTS: ${settings().reducedEffects ? 'REDUCED' : 'FULL'}`,
        help: 'Reduced turns off screen shake, wobbling and drifting motion.',
        activate: () => updateSettings({ reducedEffects: !settings().reducedEffects }),
      },
      {
        label: () => `RELAXED MODE: ${onOff(settings().relaxed)}`,
        help: 'No timer on the hunt, and the octopus never grabs you. Take as long as you like.',
        activate: () => updateSettings({ relaxed: !settings().relaxed }),
      },
      {
        label: () => `LARGE TEXT: ${onOff(settings().largeText)}`,
        help: 'Makes all the writing in the game bigger.',
        activate: () => {
          updateSettings({ largeText: !settings().largeText });
          this.scene.restart({ page: 'main', index: this.index });
        },
      },
      {
        label: () => `ASSIST: ${onOff(settings().assist)}`,
        help: 'Abilities aim themselves and capture happens on its own. Good for one-handed or switch play.',
        activate: () => updateSettings({ assist: !settings().assist }),
      },
      {
        label: () => 'CONTROLS…',
        help: 'Change which keys do what.',
        activate: () => this.scene.restart({ page: 'controls', index: 0 }),
      },
      {
        label: () => 'BACK',
        help: 'Return to the title screen.',
        activate: () => this.scene.start('Title'),
      },
    ];
  }

  private controlItems(): Item[] {
    const actions = Object.keys(ACTION_NAMES) as Action[];
    return [
      ...actions.map((action) => ({
        label: () => `${ACTION_NAMES[action]}: ${keyLabel(settings().keys[action])}`,
        help: 'Press Enter, then press the new key. Arrow keys always move as well.',
        activate: () => this.waitForKey(action),
      })),
      {
        label: () => 'RESET TO DEFAULTS',
        help: 'Back to W A S D, Q, E, Space and Esc.',
        activate: () => updateSettings({ keys: { ...DEFAULT_KEYS } }),
      },
      {
        label: () => 'BACK',
        help: 'Return to settings.',
        activate: () => this.scene.restart({ page: 'main', index: 6 }),
      },
    ];
  }

  private onKey(e: KeyboardEvent): void {
    if (this.waitingFor) {
      e.preventDefault();
      this.assignKey(this.waitingFor, e.keyCode);
      return;
    }
    if (e.key === 'ArrowDown') this.focus(this.index + 1);
    else if (e.key === 'ArrowUp') this.focus(this.index - 1);
    else if (e.key === 'ArrowLeft') this.items[this.index]?.adjust?.(-1);
    else if (e.key === 'ArrowRight') this.items[this.index]?.adjust?.(1);
    else if (e.key === 'Enter' || e.key === ' ') this.activate();
    else if (e.key === 'Escape') {
      if (this.page === 'controls') this.scene.restart({ page: 'main', index: 6 });
      else this.scene.start('Title');
    }
    this.refresh();
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
    sound.play('select');
    this.items[this.index]?.activate();
    this.refresh();
    const item = this.items[this.index];
    if (item && !this.waitingFor) announce(item.label());
  }

  private refresh(): void {
    this.rows.forEach((row, i) => {
      const item = this.items[i];
      if (!item) return;
      const active = i === this.index;
      const label =
        this.waitingFor && active
          ? `Press a key for ${ACTION_NAMES[this.waitingFor]}…`
          : item.label();
      row.setText(active ? `▸ ${label} ◂` : label).setAlpha(active ? 1 : 0.65);
    });
    this.helpText.setText(this.items[this.index]?.help ?? '');
  }

  private nudgeVolume(dir: -1 | 1): void {
    sound.unlock();
    sound.setVolume(Math.round((settings().volume + dir * 0.1) * 10) / 10);
    announce(`Volume ${Math.round(settings().volume * 100)} percent`);
    this.refresh();
  }

  private waitForKey(action: Action): void {
    this.waitingFor = action;
    announce(`Press the new key for ${ACTION_NAMES[action]}. Escape cancels.`);
    this.refresh();
  }

  private assignKey(action: Action, keyCode: number): void {
    const name = keyName(keyCode);
    this.waitingFor = null;
    if (!name || (name === 'ESC' && action !== 'pause')) {
      announce('Cancelled.');
      this.refresh();
      return;
    }
    // If another action already uses this key, swap them so nothing is left without a key.
    const keys = { ...settings().keys };
    const clash = (Object.keys(keys) as Action[]).find((a) => a !== action && keys[a] === name);
    if (clash) keys[clash] = keys[action];
    keys[action] = name;
    updateSettings({ keys });
    announce(
      `${ACTION_NAMES[action]} is now ${keyLabel(name)}${clash ? `. ${ACTION_NAMES[clash]} moved to ${keyLabel(keys[clash])}` : ''}.`,
    );
    this.refresh();
  }
}

// Phaser key names from a browser key code, e.g. 81 -> "Q".
function keyName(keyCode: number): string | null {
  const codes = Phaser.Input.Keyboard.KeyCodes as unknown as Record<string, number>;
  return Object.keys(codes).find((k) => codes[k] === keyCode) ?? null;
}

function keyLabel(name: string): string {
  const pretty: Record<string, string> = {
    SPACE: 'Space',
    ESC: 'Esc',
    ENTER: 'Enter',
    SHIFT: 'Shift',
    TAB: 'Tab',
  };
  return pretty[name] ?? name;
}
