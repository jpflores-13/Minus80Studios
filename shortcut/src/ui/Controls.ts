import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { announce } from './announce';
import { Button } from './Button';
import { TEXT_STYLES } from './text';

/**
 * Something the keyboard can land on. Tab and Shift+Tab move between them, Enter activates,
 * left and right adjust. Every control also works by pointer or touch.
 */
export interface Focusable {
  describe(): string;
  activate?(): void;
  adjust?(dir: -1 | 1, big: boolean): void;
  setFocus(on: boolean): void;
}

export class FocusList {
  private items: Focusable[] = [];
  private index = 0;

  add(...items: Focusable[]): void {
    this.items.push(...items);
  }

  current(): Focusable | undefined {
    return this.items[this.index];
  }

  focus(i: number): void {
    this.items[this.index]?.setFocus(false);
    const n = this.items.length;
    this.index = ((i % n) + n) % n;
    const item = this.items[this.index];
    item?.setFocus(true);
    if (item) announce(item.describe());
  }

  focusItem(item: Focusable): void {
    const i = this.items.indexOf(item);
    if (i >= 0) this.focus(i);
  }

  /** Returns true if the key was used. */
  handle(e: KeyboardEvent): boolean {
    const item = this.current();
    if (e.key === 'Tab') {
      this.focus(this.index + (e.shiftKey ? -1 : 1));
    } else if (e.key === 'ArrowLeft' && item?.adjust) {
      item.adjust(-1, e.shiftKey);
    } else if (e.key === 'ArrowRight' && item?.adjust) {
      item.adjust(1, e.shiftKey);
    } else if ((e.key === 'Enter' || e.key === ' ') && item?.activate) {
      item.activate();
    } else return false;
    e.preventDefault();
    return true;
  }
}

/** A labelled value with ◀ ▶ buttons. */
export class Stepper implements Focusable {
  private readonly text: Phaser.GameObjects.Text;
  private readonly frame: Phaser.GameObjects.Rectangle;
  private readonly minus: Button;
  private readonly plus: Button;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    w: number,
    private readonly label: string,
    private readonly value: () => string,
    private readonly change: (dir: -1 | 1, big: boolean) => void,
    private readonly help = '',
    dark = false,
  ) {
    this.frame = scene.add
      .rectangle(x + w / 2, y, w, 52, dark ? 0x2a2740 : 0xffffff, 1)
      .setStrokeStyle(2, dark ? 0x6b6390 : PALETTE.ink)
      .setDepth(70);
    this.text = scene.add
      .text(x + w / 2, y, '', {
        ...TEXT_STYLES.small,
        fontSize: '15px',
        align: 'center',
        color: dark ? '#ece8f6' : PALETTE.text,
      })
      .setOrigin(0.5)
      .setDepth(71);
    this.minus = new Button(scene, x + 26, y, 44, 44, '◀', () => this.step(-1));
    this.plus = new Button(scene, x + w - 26, y, 44, 44, '▶', () => this.step(1));
    for (const b of [this.minus, this.plus]) {
      b.bg.setDepth(71);
      b.label.setDepth(72);
    }
    this.refresh();
  }

  private step(dir: -1 | 1): void {
    this.change(dir, false);
    this.refresh();
    announce(`${this.label} ${this.value()}`);
  }

  adjust(dir: -1 | 1, big: boolean): void {
    this.change(dir, big);
    this.refresh();
    announce(`${this.label} ${this.value()}`);
  }

  refresh(): void {
    this.text.setText(`${this.label}\n${this.value()}`);
  }

  describe(): string {
    return `${this.label}: ${this.value()}. Left and right to change. ${this.help}`;
  }

  setFocus(on: boolean): void {
    this.frame.setStrokeStyle(on ? 4 : 2, on ? PALETTE.goldDark : PALETTE.ink);
  }

  setVisible(v: boolean): void {
    for (const o of [this.text, this.frame]) o.setVisible(v);
    this.minus.setVisible(v);
    this.plus.setVisible(v);
  }

  destroy(): void {
    this.text.destroy();
    this.frame.destroy();
    this.minus.destroy();
    this.plus.destroy();
  }
}

/** A Button that can also take keyboard focus. */
export class FocusButton implements Focusable {
  readonly button: Button;
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    w: number,
    h: number,
    private readonly label: () => string,
    private readonly onClick: () => void,
    color?: number,
    private readonly help = '',
  ) {
    this.button = new Button(
      scene,
      x,
      y,
      w,
      h,
      label(),
      () => {
        onClick();
        this.refresh();
      },
      color,
    );
  }

  refresh(): void {
    this.button.setText(this.label());
  }

  activate(): void {
    this.onClick();
    this.refresh();
  }

  describe(): string {
    return `${this.label()}, button. ${this.help}`;
  }

  setFocus(on: boolean): void {
    this.button.bg.setStrokeStyle(on ? 5 : 2, on ? PALETTE.gold : PALETTE.ink);
  }
}
