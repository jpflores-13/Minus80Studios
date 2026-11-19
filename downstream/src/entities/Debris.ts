import Phaser from 'phaser';
import { TUNING } from '../config/tuning';
import { currentSpeedAt } from '../systems/current';

export const DEBRIS_KINDS = ['bottle', 'bag', 'fragment'] as const;
export type DebrisKind = (typeof DEBRIS_KINDS)[number];

/** A piece of placeholder plastic carried downstream (left → right) by the current. */
export class Debris {
  readonly sprite: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, kind: DebrisKind, x: number, y: number) {
    this.sprite = scene.add.image(x, y, kind).setAngle(Phaser.Math.Between(0, 359));
  }

  /** Drift with the local current speed. */
  update(dtSeconds: number, bankTop: number, bankBottom: number): void {
    const speed = Math.max(
      TUNING.debris.minDriftSpeed,
      currentSpeedAt(this.sprite.y, bankTop, bankBottom, TUNING.river.maxCurrentSpeed),
    );
    this.sprite.x += speed * dtSeconds;
  }

  hasEscaped(worldWidth: number): boolean {
    return this.sprite.x - this.sprite.displayWidth / 2 > worldWidth;
  }

  containsPoint(x: number, y: number): boolean {
    const reach =
      Math.max(this.sprite.displayWidth, this.sprite.displayHeight) / 2 + TUNING.debris.tapPadding;
    return Phaser.Math.Distance.Between(x, y, this.sprite.x, this.sprite.y) <= reach;
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
