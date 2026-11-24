import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { announce } from './announce';
import { Button } from './Button';
import { TEXT_STYLES } from './text';

export interface GridItem {
  label: string;
  help?: string;
  action: () => void;
}

/** A grid of buttons: arrow keys / WASD move in 2-D, Enter or Space chooses, Esc goes back. */
export class Grid {
  private readonly buttons: Button[];
  private index = 0;
  private readonly help: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    private readonly items: GridItem[],
    opts: {
      x: number;
      y: number;
      cols: number;
      cellW: number;
      cellH: number;
      gapX?: number;
      gapY?: number;
    },
    onBack: () => void,
  ) {
    const gx = opts.gapX ?? 12;
    const gy = opts.gapY ?? 10;
    this.buttons = items.map((it, i) => {
      const c = i % opts.cols;
      const r = Math.floor(i / opts.cols);
      const b = new Button(
        scene,
        opts.x + c * (opts.cellW + gx) + opts.cellW / 2,
        opts.y + r * (opts.cellH + gy) + opts.cellH / 2,
        opts.cellW,
        opts.cellH,
        it.label,
        () => this.choose(i),
      );
      b.label.setFontSize(16);
      b.bg.on('pointerover', () => this.focus(i, false));
      return b;
    });
    const rows = Math.ceil(items.length / opts.cols);
    this.help = scene.add
      .text(scene.scale.width / 2, opts.y + rows * (opts.cellH + gy) + 8, '', {
        ...TEXT_STYLES.hint,
        align: 'center',
        wordWrap: { width: 1100 },
      })
      .setOrigin(0.5, 0);
    const kb = scene.input.keyboard;
    kb?.on('keydown', (e: KeyboardEvent) => {
      const n = this.items.length;
      if (e.key === 'ArrowRight' || e.key === 'd') this.focus(Math.min(n - 1, this.index + 1));
      else if (e.key === 'ArrowLeft' || e.key === 'a') this.focus(Math.max(0, this.index - 1));
      else if (e.key === 'ArrowDown' || e.key === 's')
        this.focus(Math.min(n - 1, this.index + opts.cols));
      else if (e.key === 'ArrowUp' || e.key === 'w')
        this.focus(Math.max(0, this.index - opts.cols));
      else if (e.key === 'Enter' || e.key === ' ') this.choose(this.index);
      else if (e.key === 'Escape') onBack();
    });
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => kb?.removeAllListeners());
    this.focus(0);
  }

  focus(i: number, speak = true): void {
    this.index = i;
    this.buttons.forEach((b, j) => b.setFocus(j === i));
    const it = this.items[i];
    this.help.setText(it?.help ?? '');
    if (it && speak)
      announce(`${it.label}${it.help ? `. ${it.help}` : ''}, ${i + 1} of ${this.items.length}`);
  }

  private choose(i: number): void {
    sound.unlock();
    sound.play('click');
    this.items[i]?.action();
  }
}
