import Phaser from 'phaser';
import { TUNING } from '../config/tuning';
import { stepVelocity } from '../systems/movement';
import { clamp, type Vec2 } from '../utils/math';

/** The player: a placeholder cone snail that crawls toward the input direction. */
export class Snail {
  readonly sprite: Phaser.GameObjects.Image;
  private velocity: Vec2 = { x: 0, y: 0 };

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.add.image(x, y, 'snail');
  }

  get position(): Vec2 {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  update(direction: Vec2, dtSeconds: number, bounds: Phaser.Geom.Rectangle): void {
    this.velocity = stepVelocity(this.velocity, direction, TUNING.snail, dtSeconds);
    const halfW = this.sprite.displayWidth / 2;
    const halfH = this.sprite.displayHeight / 2;
    this.sprite.x = clamp(
      this.sprite.x + this.velocity.x * dtSeconds,
      bounds.left + halfW,
      bounds.right - halfW,
    );
    this.sprite.y = clamp(
      this.sprite.y + this.velocity.y * dtSeconds,
      bounds.top + halfH,
      bounds.bottom - halfH,
    );
    // Face the direction of travel.
    if (Math.abs(this.velocity.x) > 1) this.sprite.setFlipX(this.velocity.x < 0);
  }
}
