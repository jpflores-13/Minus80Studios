import Phaser from 'phaser';
import { settings } from '../config/settings';
import type { HuntInput } from '../systems/hunt';
import { directionFromKeys } from '../systems/movement';

// Keyboard and mouse, using the player's chosen keys (Settings > Controls).
// Arrow keys always move too. Touch is handled by TouchControls and merged on top.
export class HuntControls {
  private readonly keys: Record<string, Phaser.Input.Keyboard.Key> = {};

  constructor(private readonly scene: Phaser.Scene) {
    const kb = scene.input.keyboard;
    if (!kb) return;
    const map = settings().keys;
    const add = (name: string, code: string) => {
      const keyCode =
        Phaser.Input.Keyboard.KeyCodes[code as keyof typeof Phaser.Input.Keyboard.KeyCodes];
      if (keyCode !== undefined) this.keys[name] = kb.addKey(keyCode);
    };
    add('up', map.up);
    add('down', map.down);
    add('left', map.left);
    add('right', map.right);
    add('primary', map.primary);
    add('secondary', map.secondary);
    add('capture', map.capture);
    add('arrowUp', 'UP');
    add('arrowDown', 'DOWN');
    add('arrowLeft', 'LEFT');
    add('arrowRight', 'RIGHT');
  }

  read(): HuntInput {
    const k = this.keys;
    const down = (...names: string[]) => names.some((n) => k[n]?.isDown === true);
    const pressed = (name: string) => {
      const key = k[name];
      return key !== undefined && Phaser.Input.Keyboard.JustDown(key);
    };
    const pointer = this.scene.input.activePointer;
    return {
      move: directionFromKeys(
        down('left', 'arrowLeft'),
        down('right', 'arrowRight'),
        down('up', 'arrowUp'),
        down('down', 'arrowDown'),
      ),
      aim: { x: pointer.worldX, y: pointer.worldY },
      primary: pressed('primary'),
      secondary: pressed('secondary'),
      capture: pressed('capture'),
    };
  }
}
