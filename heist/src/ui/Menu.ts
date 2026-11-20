import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { announce } from './announce';
import { Button } from './Button';

export interface MenuItem {
  label: () => string;
  action: () => void;
  help?: string;
  enabled?: () => boolean;
}

/**
 * A vertical list of big buttons. Arrow keys or d-pad move, Enter/Space/A choose, Esc goes back.
 * Touch and mouse work directly. Everything is announced for screen readers.
 */
export class Menu {
  private buttons: Button[] = [];
  private index = 0;
  private padPrev = { up: false, down: false, a: false, b: false };

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly items: MenuItem[],
    x: number,
    y: number,
    w: number,
    gap = 62,
    private readonly onBack?: () => void,
  ) {
    this.buttons = items.map((item, i) => {
      const b = new Button(scene, x, y + i * gap, w, 50, item.label(), () => this.choose(i));
      if (item.enabled && !item.enabled()) b.setEnabled(false);
      b.bg.on('pointerover', () => this.focus(i, false));
      return b;
    });
    const kb = scene.input.keyboard;
    kb?.on('keydown', (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 's') this.focus(this.index + 1);
      else if (e.key === 'ArrowUp' || e.key === 'w') this.focus(this.index - 1);
      else if (e.key === 'Enter' || e.key === ' ') this.choose(this.index);
      else if (e.key === 'Escape') this.onBack?.();
    });
    scene.events.on(Phaser.Scenes.Events.UPDATE, () => this.pollPad());
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => kb?.removeAllListeners());
    this.focus(0);
  }

  private pollPad(): void {
    const pad = this.scene.input.gamepad?.pad1;
    if (!pad) return;
    const now = {
      up: pad.up || pad.leftStick.y < -0.5,
      down: pad.down || pad.leftStick.y > 0.5,
      a: pad.A,
      b: pad.B,
    };
    if (now.down && !this.padPrev.down) this.focus(this.index + 1);
    if (now.up && !this.padPrev.up) this.focus(this.index - 1);
    if (now.a && !this.padPrev.a) this.choose(this.index);
    if (now.b && !this.padPrev.b) this.onBack?.();
    this.padPrev = now;
  }

  focus(i: number, speak = true): void {
    const n = this.items.length;
    this.index = ((i % n) + n) % n;
    this.buttons.forEach((b, j) => b.setFocus(j === this.index));
    const item = this.items[this.index];
    if (item && speak)
      announce(`${item.label()}${item.help ? `. ${item.help}` : ''}, ${this.index + 1} of ${n}`);
  }

  refresh(): void {
    this.buttons.forEach((b, i) => {
      const item = this.items[i];
      if (!item) return;
      b.setText(item.label());
      b.setEnabled(!item.enabled || item.enabled());
    });
  }

  private choose(i: number): void {
    const item = this.items[i];
    if (!item) return;
    sound.unlock();
    if (item.enabled && !item.enabled()) {
      sound.play('deny');
      announce('Locked.');
      return;
    }
    sound.play('click');
    item.action();
    this.refresh();
  }
}
