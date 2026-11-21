import Phaser from 'phaser';
import { announce } from './announce';
import { Button } from './Button';
import { TEXT_STYLES } from './text';

export interface MenuItem {
  label: () => string;
  action: () => void;
  help?: string;
}

/** A vertical list of big buttons. Arrows/d-pad move, Enter/Space/A choose, Esc goes back. */
export class Menu {
  private buttons: Button[] = [];
  private index = 0;
  private helpText: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    private readonly items: MenuItem[],
    x: number,
    y: number,
    w: number,
    gap = 62,
    onBack?: () => void,
  ) {
    this.buttons = items.map((item, i) => {
      const b = new Button(scene, x, y + i * gap, w, 50, item.label(), () => this.choose(i));
      b.bg.on('pointerover', () => this.focus(i, false));
      return b;
    });
    this.helpText = scene.add
      .text(x, y + items.length * gap + 28, '', { ...TEXT_STYLES.hint, wordWrap: { width: w } })
      .setOrigin(0.5, 0);
    this.focus(0, false);
    const kb = scene.input.keyboard;
    const up = () => this.focus(this.index - 1, true);
    const down = () => this.focus(this.index + 1, true);
    kb?.on('keydown-UP', up);
    kb?.on('keydown-DOWN', down);
    kb?.on('keydown-W', up);
    kb?.on('keydown-S', down);
    kb?.on('keydown-ENTER', () => this.choose(this.index));
    kb?.on('keydown-SPACE', () => this.choose(this.index));
    if (onBack) kb?.on('keydown-ESC', onBack);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => kb?.removeAllListeners());
  }

  focus(i: number, announceIt: boolean): void {
    const n = this.buttons.length;
    this.index = ((i % n) + n) % n;
    this.refresh();
    if (announceIt) announce(this.items[this.index]?.label() ?? '');
  }

  refresh(): void {
    this.buttons.forEach((b, i) => {
      const item = this.items[i];
      if (item) b.setText(item.label());
      b.setFocus(i === this.index);
    });
    this.helpText.setText(this.items[this.index]?.help ?? '');
  }

  private choose(i: number): void {
    this.items[i]?.action();
  }

  destroy(): void {
    for (const b of this.buttons) b.destroy();
    this.helpText.destroy();
  }
}
