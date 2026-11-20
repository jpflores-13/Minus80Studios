import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { progress } from '../config/progress';
import { touch } from './Controls';

// On-screen buttons for phones and tablets: a d-pad on the left, JUMP and POWER on the right.
// Multi-touch, so you can run and jump at the same time. Shown only on touch devices.
export class TouchControls {
  private readonly objects: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene, onPause: () => void) {
    const touchDevice = scene.sys.game.device.input.touch;
    if (!touchDevice) return;
    scene.input.addPointer(3);
    const { width, height } = scene.scale;
    const s = progress().bigButtons ? 1.3 : 1;
    const r = 52 * s;
    const pad = (
      x: number,
      y: number,
      label: string,
      key: keyof typeof touch,
      color: number = PALETTE.purpleLight,
    ) => {
      const c = scene.add
        .circle(x, y, r, color, 0.55)
        .setStrokeStyle(3, PALETTE.gold, 0.8)
        .setDepth(90)
        .setInteractive();
      const t = scene.add
        .text(x, y, label, {
          fontFamily: 'monospace',
          fontSize: `${Math.round(26 * s)}px`,
          fontStyle: 'bold',
          color: '#f4f0ff',
        })
        .setOrigin(0.5)
        .setDepth(91);
      const on = () => {
        touch[key] = true;
        c.setAlpha(0.95);
      };
      const off = () => {
        touch[key] = false;
        c.setAlpha(1);
      };
      c.on('pointerdown', on);
      c.on('pointerover', (p: Phaser.Input.Pointer) => p.isDown && on());
      c.on('pointerup', off);
      c.on('pointerout', off);
      this.objects.push(c, t);
    };
    const bx = 30 + r * 2;
    const by = height - 30 - r * 2;
    pad(bx - r * 1.6, by, '◀', 'left');
    pad(bx + r * 1.6, by, '▶', 'right');
    pad(bx, by - r * 1.5, '▲', 'up');
    pad(bx, by + r * 1.5, '▼', 'down');
    pad(width - 40 - r, height - 40 - r, 'JUMP', 'jump', 0x3d6a8f);
    pad(width - 70 - r * 3.2, height - 60 - r * 0.6, '★', 'action', 0x8f3d6a);
    const pause = scene.add
      .text(width - 20, 150, '❚❚', {
        fontFamily: 'monospace',
        fontSize: '34px',
        color: '#f4f0ff',
        backgroundColor: '#2a1b4d',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(1, 0)
      .setDepth(91)
      .setInteractive();
    pause.on('pointerup', onPause);
    this.objects.push(pause);
  }

  destroy(): void {
    for (const k of Object.keys(touch) as (keyof typeof touch)[]) touch[k] = false;
    for (const o of this.objects) o.destroy();
  }
}
