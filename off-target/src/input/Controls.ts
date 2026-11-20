import Phaser from 'phaser';
import type { GameInput } from '../systems/game';

/** Buttons held on the touch screen; set by TouchControls, read here. */
export const touch = {
  left: false,
  right: false,
  up: false,
  down: false,
  jump: false,
  action: false,
};

// Keyboard, gamepad and touch, merged into one GameInput each frame.
//   Move: arrows or WASD · Jump: Space, Z or K · Power: E, X or J · Pause: Esc or P
//   Gamepad: d-pad or left stick, A jumps, B or X uses the power, Start pauses.
export class Controls {
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private prevJump = false;
  private prevAction = false;
  private prevPause = false;

  constructor(private readonly scene: Phaser.Scene) {
    const kb = scene.input.keyboard;
    if (!kb) return;
    const add = (name: string, code: number) => (this.keys[name] = kb.addKey(code, true));
    const K = Phaser.Input.Keyboard.KeyCodes;
    add('left', K.LEFT);
    add('a', K.A);
    add('right', K.RIGHT);
    add('d', K.D);
    add('up', K.UP);
    add('w', K.W);
    add('down', K.DOWN);
    add('s', K.S);
    add('space', K.SPACE);
    add('z', K.Z);
    add('k', K.K);
    add('e', K.E);
    add('x', K.X);
    add('j', K.J);
    add('esc', K.ESC);
    add('p', K.P);
  }

  private down(...names: string[]): boolean {
    return names.some((n) => this.keys[n]?.isDown === true);
  }

  private pad(): Phaser.Input.Gamepad.Gamepad | undefined {
    return this.scene.input.gamepad?.pad1;
  }

  read(): GameInput {
    const pad = this.pad();
    const stickX = pad?.leftStick.x ?? 0;
    const stickY = pad?.leftStick.y ?? 0;
    const left = this.down('left', 'a') || touch.left || !!pad?.left || stickX < -0.4;
    const right = this.down('right', 'd') || touch.right || !!pad?.right || stickX > 0.4;
    const up = this.down('up', 'w') || touch.up || !!pad?.up || stickY < -0.5;
    const downHeld = this.down('down', 's') || touch.down || !!pad?.down || stickY > 0.5;
    const jump = this.down('space', 'z', 'k') || touch.jump || !!pad?.A;
    const action = this.down('e', 'x', 'j') || touch.action || !!pad?.B || !!pad?.X;
    const input: GameInput = {
      left,
      right,
      up,
      down: downHeld,
      jump,
      jumpPressed: jump && !this.prevJump,
      action: action && !this.prevAction,
    };
    this.prevJump = jump;
    this.prevAction = action;
    return input;
  }

  /** Pause pressed this frame (keyboard or gamepad Start). */
  pausePressed(): boolean {
    const now = this.down('esc', 'p') || !!this.pad()?.buttons[9]?.pressed;
    const pressed = now && !this.prevPause;
    this.prevPause = now;
    return pressed;
  }
}
