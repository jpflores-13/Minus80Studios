import Phaser from 'phaser';
import type { CharacterConfig } from '../characters/types';
import { touchAim, type Tap } from '../systems/aim';
import type { HuntInput, HuntState } from '../systems/hunt';
import { directionToward } from '../systems/movement';
import type { AbilitySlot } from '../systems/venom';
import type { Vec2 } from '../utils/math';

const JOYSTICK_RADIUS = 80;
const BUTTON_RADIUS = 66;
const HOLD_TO_CRAWL_MS = 220;
const DEPTH = 150;

interface TouchButton {
  slot: AbilitySlot;
  circle: Phaser.GameObjects.Arc;
  pressed: boolean;
}

// On-screen controls for phones and tablets.
// - Joystick (bottom left, or start a drag anywhere on the left side) moves the snail.
// - Press and hold on the reef and the snail crawls toward your finger.
// - A quick tap on the reef sets where abilities aim.
// - Ability buttons on the right.
//
// Finger positions are read every frame from the pointer objects rather than from
// move/up events, because mobile Safari doesn't always deliver those reliably.
export class TouchControls {
  private stick: Phaser.Input.Pointer | null = null;
  private stickOrigin: Vec2;
  private readonly restOrigin: Vec2;
  private hold: { pointer: Phaser.Input.Pointer; since: number } | null = null;
  private move: Vec2 = { x: 0, y: 0 };
  private tap: Tap | null = null;
  private readonly base: Phaser.GameObjects.Arc;
  private readonly knob: Phaser.GameObjects.Arc;
  private readonly stickLabel: Phaser.GameObjects.Text;
  private readonly reticle: Phaser.GameObjects.Arc;
  private readonly buttons: TouchButton[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    character: CharacterConfig,
    private readonly getState: () => HuntState,
  ) {
    scene.input.addPointer(2); // move and press a button at the same time
    const { width, height } = scene.scale;
    const accent = character.palette.accent;

    this.restOrigin = { x: 130, y: height - 150 };
    this.stickOrigin = { ...this.restOrigin };
    this.base = scene.add
      .circle(this.restOrigin.x, this.restOrigin.y, JOYSTICK_RADIUS, 0xffffff, 0.08)
      .setStrokeStyle(3, 0xffffff, 0.35)
      .setDepth(DEPTH);
    this.knob = scene.add
      .circle(this.restOrigin.x, this.restOrigin.y, 32, accent, 0.55)
      .setDepth(DEPTH + 1);
    this.stickLabel = scene.add
      .text(this.restOrigin.x, this.restOrigin.y + JOYSTICK_RADIUS + 16, 'MOVE', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#eef6f3',
      })
      .setOrigin(0.5)
      .setAlpha(0.7)
      .setDepth(DEPTH);
    this.reticle = scene.add
      .circle(0, 0, 18)
      .setStrokeStyle(2, 0xffffff, 0.8)
      .setDepth(DEPTH)
      .setVisible(false);

    const layout: [AbilitySlot, number, number][] = [
      ['capture', width - 85, height - 185],
      ['secondary', width - 230, height - 125],
      ['primary', width - 130, height - 335],
    ];
    for (const [slot, x, y] of layout) {
      const circle = scene.add
        .circle(x, y, BUTTON_RADIUS, 0x06192b, 0.7)
        .setStrokeStyle(3, accent, 0.9)
        .setDepth(DEPTH)
        .setInteractive();
      scene.add
        .text(x, y, character.abilities[slot].label.replace(' ', '\n'), {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '22px',
          fontStyle: 'bold',
          color: '#eef6f3',
          align: 'center',
        })
        .setOrigin(0.5)
        .setDepth(DEPTH + 1);
      const button: TouchButton = { slot, circle, pressed: false };
      circle.on('pointerdown', () => {
        button.pressed = true;
        circle.setFillStyle(accent, 0.45);
        scene.time.delayedCall(150, () => circle.setFillStyle(0x06192b, 0.7));
      });
      this.buttons.push(button);
    }

    scene.input.on('pointerdown', this.onDown, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      scene.input.off('pointerdown', this.onDown, this),
    );
  }

  // Called every frame before the hunt steps.
  update(): void {
    const state = this.getState();

    if (this.stick && !this.stick.isDown) this.releaseStick();
    if (this.stick) {
      const dx = this.stick.x - this.stickOrigin.x;
      const dy = this.stick.y - this.stickOrigin.y;
      const d = Math.hypot(dx, dy);
      const k = d > JOYSTICK_RADIUS ? JOYSTICK_RADIUS / d : 1;
      this.knob.setPosition(this.stickOrigin.x + dx * k, this.stickOrigin.y + dy * k);
      // small dead zone so a resting thumb doesn't drift
      this.move =
        d < 8 ? { x: 0, y: 0 } : { x: (dx * k) / JOYSTICK_RADIUS, y: (dy * k) / JOYSTICK_RADIUS };
    }

    if (this.hold && !this.hold.pointer.isDown) this.hold = null;

    if (this.tap && state.time - this.tap.time > 3) this.tap = null;
    this.reticle.setVisible(this.tap !== null);
    if (this.tap) this.reticle.setPosition(this.tap.pos.x, this.tap.pos.y);
  }

  // Merge into keyboard input: touch adds movement and presses, never cancels keys.
  apply(input: HuntInput): HuntInput {
    const state = this.getState();
    const take = (slot: AbilitySlot) => {
      const b = this.buttons.find((x) => x.slot === slot);
      const was = b?.pressed ?? false;
      if (b) b.pressed = false;
      return was;
    };
    const primary = take('primary');
    const secondary = take('secondary');
    const capture = take('capture');

    let move = input.move;
    if (this.stick) {
      move = this.move;
    } else if (this.hold && this.scene.time.now - this.hold.since >= HOLD_TO_CRAWL_MS) {
      const p = this.hold.pointer;
      move = directionToward(state.snail.pos, { x: p.worldX, y: p.worldY }, 12);
    }

    const slot: AbilitySlot = secondary && !primary ? 'secondary' : 'primary';
    const aim = primary || secondary ? touchAim(state, slot, this.tap) : input.aim;
    return {
      move,
      aim,
      primary: input.primary || primary,
      secondary: input.secondary || secondary,
      capture: input.capture || capture,
    };
  }

  private onDown(p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]): void {
    if (over.length > 0) return; // pressed a button
    if (!this.stick && p.x < this.scene.scale.width * 0.45) {
      this.stick = p;
      this.stickOrigin = { x: p.x, y: p.y };
      this.base.setPosition(p.x, p.y).setAlpha(1);
      this.knob.setPosition(p.x, p.y);
      this.stickLabel.setVisible(false);
      return;
    }
    // Anywhere else on the reef: remember it as the aim spot, and start a possible hold-to-crawl.
    this.tap = { pos: { x: p.worldX, y: p.worldY }, time: this.getState().time };
    this.hold = { pointer: p, since: this.scene.time.now };
  }

  private releaseStick(): void {
    this.stick = null;
    this.move = { x: 0, y: 0 };
    this.stickOrigin = { ...this.restOrigin };
    this.base.setPosition(this.restOrigin.x, this.restOrigin.y);
    this.knob.setPosition(this.restOrigin.x, this.restOrigin.y);
    this.stickLabel.setVisible(true);
  }
}
