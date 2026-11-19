import Phaser from 'phaser';
import type { HuntInput } from '../systems/hunt';
import { directionFromKeys } from '../systems/movement';

/**
 * Maps physical devices to abstract hunt actions. The simulation only ever
 * sees a HuntInput, so touch or gamepad support later means adding another
 * mapper here, not changing game logic.
 *
 *   WASD / arrows: move · mouse: aim · Q: primary · E: secondary · Space: capture
 */
export class HuntControls {
  private readonly keys: Record<string, Phaser.Input.Keyboard.Key>;

  constructor(private readonly scene: Phaser.Scene) {
    const kb = scene.input.keyboard;
    if (!kb) throw new Error('Keyboard input is required for this prototype.');
    this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,Q,E,SPACE') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;
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
        down('A', 'LEFT'),
        down('D', 'RIGHT'),
        down('W', 'UP'),
        down('S', 'DOWN'),
      ),
      aim: { x: pointer.worldX, y: pointer.worldY },
      primary: pressed('Q'),
      secondary: pressed('E'),
      capture: pressed('SPACE'),
    };
  }
}
