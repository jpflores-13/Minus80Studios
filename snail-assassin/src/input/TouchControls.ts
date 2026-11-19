import Phaser from 'phaser';
import type { CharacterConfig } from '../characters/types';
import { touchAim, type Tap } from '../systems/aim';
import type { HuntInput, HuntState } from '../systems/hunt';
import type { AbilitySlot } from '../systems/venom';
import type { Vec2 } from '../utils/math';

const JOYSTICK_RADIUS = 70;
const BUTTON_RADIUS = 66;
const DEPTH = 150;

interface TouchButton {
  slot: AbilitySlot;
  circle: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
  pressed: boolean;
}

// On-screen controls for phones and tablets:
// - left half of the screen: drag anywhere to move (a joystick appears under your thumb)
// - right side: tap the reef to aim, then press an ability button
export class TouchControls {
  private stickPointer: number | null = null;
  private stickOrigin: Vec2 = { x: 0, y: 0 };
  private move: Vec2 = { x: 0, y: 0 };
  private tap: Tap | null = null;
  private readonly base: Phaser.GameObjects.Arc;
  private readonly knob: Phaser.GameObjects.Arc;
  private readonly reticle: Phaser.GameObjects.Arc;
  private readonly buttons: TouchButton[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    character: CharacterConfig,
    private readonly getState: () => HuntState,
  ) {
    scene.input.addPointer(2); // allow moving and pressing a button at the same time
    const accent = character.palette.accent;
    this.base = scene.add
      .circle(0, 0, JOYSTICK_RADIUS, 0xffffff, 0.08)
      .setStrokeStyle(2, 0xffffff, 0.3)
      .setDepth(DEPTH)
      .setVisible(false);
    this.knob = scene.add
      .circle(0, 0, 28, accent, 0.5)
      .setDepth(DEPTH + 1)
      .setVisible(false);
    this.reticle = scene.add
      .circle(0, 0, 18)
      .setStrokeStyle(2, 0xffffff, 0.8)
      .setDepth(DEPTH)
      .setVisible(false);

    const { width, height } = scene.scale;
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
      const label = scene.add
        .text(x, y, character.abilities[slot].label.replace(' ', '\n'), {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '22px',
          fontStyle: 'bold',
          color: '#eef6f3',
          align: 'center',
          wordWrap: { width: BUTTON_RADIUS * 1.8 },
        })
        .setOrigin(0.5)
        .setDepth(DEPTH + 1);
      const button: TouchButton = { slot, circle, label, pressed: false };
      circle.on('pointerdown', () => {
        button.pressed = true;
        circle.setFillStyle(accent, 0.45);
      });
      circle.on('pointerup', () => circle.setFillStyle(0x06192b, 0.7));
      circle.on('pointerout', () => circle.setFillStyle(0x06192b, 0.7));
      this.buttons.push(button);
    }

    scene.input.on('pointerdown', this.onDown, this);
    scene.input.on('pointermove', this.onMove, this);
    scene.input.on('pointerup', this.onUp, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.off('pointerdown', this.onDown, this);
      scene.input.off('pointermove', this.onMove, this);
      scene.input.off('pointerup', this.onUp, this);
    });
  }

  // Merge into keyboard input: touch only adds movement and presses, never cancels keys.
  apply(input: HuntInput): HuntInput {
    const state = this.getState();
    const pressed = (slot: AbilitySlot) => {
      const b = this.buttons.find((x) => x.slot === slot);
      const was = b?.pressed ?? false;
      if (b) b.pressed = false;
      return was;
    };
    const primary = pressed('primary');
    const secondary = pressed('secondary');
    const capture = pressed('capture');
    const usingStick = this.move.x !== 0 || this.move.y !== 0;
    const aimSlot: AbilitySlot = primary ? 'primary' : secondary ? 'secondary' : 'primary';
    const aim = primary || secondary ? touchAim(state, aimSlot, this.tap) : input.aim;
    return {
      move: usingStick ? this.move : input.move,
      aim,
      primary: input.primary || primary,
      secondary: input.secondary || secondary,
      capture: input.capture || capture,
    };
  }

  update(): void {
    const state = this.getState();
    if (this.tap && state.time - this.tap.time > 3) this.tap = null;
    this.reticle.setVisible(this.tap !== null);
    if (this.tap) this.reticle.setPosition(this.tap.pos.x, this.tap.pos.y);
  }

  private onDown(p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]): void {
    if (over.length > 0) return; // pressed a button
    if (p.x < this.scene.scale.width * 0.45 && this.stickPointer === null) {
      this.stickPointer = p.id;
      this.stickOrigin = { x: p.x, y: p.y };
      this.base.setPosition(p.x, p.y).setVisible(true);
      this.knob.setPosition(p.x, p.y).setVisible(true);
      return;
    }
    this.tap = { pos: { x: p.worldX, y: p.worldY }, time: this.getState().time };
  }

  private onMove(p: Phaser.Input.Pointer): void {
    if (p.id !== this.stickPointer) return;
    const dx = p.x - this.stickOrigin.x;
    const dy = p.y - this.stickOrigin.y;
    const d = Math.hypot(dx, dy);
    const k = d > JOYSTICK_RADIUS ? JOYSTICK_RADIUS / d : 1;
    this.knob.setPosition(this.stickOrigin.x + dx * k, this.stickOrigin.y + dy * k);
    // small dead zone so a resting thumb doesn't drift
    this.move =
      d < 10 ? { x: 0, y: 0 } : { x: (dx * k) / JOYSTICK_RADIUS, y: (dy * k) / JOYSTICK_RADIUS };
  }

  private onUp(p: Phaser.Input.Pointer): void {
    if (p.id !== this.stickPointer) return;
    this.stickPointer = null;
    this.move = { x: 0, y: 0 };
    this.base.setVisible(false);
    this.knob.setVisible(false);
  }
}
