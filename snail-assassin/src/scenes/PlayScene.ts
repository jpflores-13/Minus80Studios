import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { TUNING } from '../config/tuning';
import { Snail } from '../entities/Snail';
import { directionFromKeys, directionToward } from '../systems/movement';
import { TEXT_STYLES } from '../ui/text';
import { prefersReducedMotion } from '../utils/accessibility';
import type { Vec2 } from '../utils/math';

type MoveKeys = Record<
  'left' | 'right' | 'up' | 'down' | 'a' | 'd' | 'w' | 's',
  Phaser.Input.Keyboard.Key
>;

/** First playable sandbox: crawl the seabed. No hunting or stealth yet. */
export class PlayScene extends Phaser.Scene {
  private snail!: Snail;
  private keys: MoveKeys | undefined;
  private snow: { dot: Phaser.GameObjects.Image; speed: number }[] = [];
  private bounds!: Phaser.Geom.Rectangle;

  constructor() {
    super('Play');
  }

  create(): void {
    const { width, height } = this.scale;
    this.bounds = new Phaser.Geom.Rectangle(0, height * 0.35, width, height * 0.65);
    this.add.rectangle(0, height * 0.82, width, height * 0.18, PALETTE.seabed).setOrigin(0);

    this.createMarineSnow();
    this.snail = new Snail(this, width / 2, height * 0.75);

    this.keys = this.input.keyboard?.addKeys({
      left: 'LEFT',
      right: 'RIGHT',
      up: 'UP',
      down: 'DOWN',
      a: 'A',
      d: 'D',
      w: 'W',
      s: 'S',
    }) as MoveKeys | undefined;
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('Title'));

    this.add.text(16, 16, 'Move: arrow keys / WASD, or hold touch · Esc: title', TEXT_STYLES.hint);
  }

  override update(_time: number, deltaMs: number): void {
    const dt = deltaMs / 1000;
    this.snail.update(this.readInputDirection(), dt, this.bounds);
    for (const flake of this.snow) {
      flake.dot.y += flake.speed * dt;
      if (flake.dot.y > this.scale.height) flake.dot.y = 0;
    }
  }

  private readInputDirection(): Vec2 {
    const pointer = this.input.activePointer;
    if (pointer.isDown) {
      return directionToward(
        this.snail.position,
        { x: pointer.worldX, y: pointer.worldY },
        TUNING.snail.arrivalRadius,
      );
    }
    const k = this.keys;
    if (!k) return { x: 0, y: 0 };
    return directionFromKeys(
      k.left.isDown || k.a.isDown,
      k.right.isDown || k.d.isDown,
      k.up.isDown || k.w.isDown,
      k.down.isDown || k.s.isDown,
    );
  }

  private createMarineSnow(): void {
    const { count, minFallSpeed, maxFallSpeed } = TUNING.marineSnow;
    const still = prefersReducedMotion();
    for (let i = 0; i < count; i++) {
      const dot = this.add
        .image(
          Phaser.Math.Between(0, this.scale.width),
          Phaser.Math.Between(0, this.scale.height),
          'snow',
        )
        .setAlpha(Phaser.Math.FloatBetween(0.2, 0.7));
      this.snow.push({
        dot,
        speed: still ? 0 : Phaser.Math.FloatBetween(minFallSpeed, maxFallSpeed),
      });
    }
  }
}
