import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { TUNING } from '../config/tuning';
import { Debris, DEBRIS_KINDS } from '../entities/Debris';
import { currentSpeedAt, interceptionRate, type InterceptionTally } from '../systems/current';
import { TEXT_STYLES } from '../ui/text';
import { prefersReducedMotion } from '../utils/accessibility';

/** First playable sandbox: plastic drifts downstream; tap/click pieces to intercept them. */
export class PlayScene extends Phaser.Scene {
  private debris: Debris[] = [];
  private ripples: Phaser.GameObjects.Image[] = [];
  private tally: InterceptionTally = { intercepted: 0, escaped: 0 };
  private bankTop = 0;
  private bankBottom = 0;
  private spawnTimer = 0;
  private hud!: Phaser.GameObjects.Text;

  constructor() {
    super('Play');
  }

  create(): void {
    const { width, height } = this.scale;
    const channel = height * TUNING.river.channelHeightFraction;
    this.bankTop = (height - channel) / 2;
    this.bankBottom = this.bankTop + channel;
    this.debris = [];
    this.tally = { intercepted: 0, escaped: 0 };

    this.add.rectangle(0, this.bankTop, width, channel, PALETTE.water).setOrigin(0);
    this.createRipples();

    this.hud = this.add.text(16, 16, '', TEXT_STYLES.body);
    this.add.text(
      16,
      height - 40,
      'Click / tap plastic to intercept it · Esc: title',
      TEXT_STYLES.hint,
    );
    this.updateHud();

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) =>
      this.tryIntercept(p.worldX, p.worldY),
    );
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('Title'));
  }

  override update(_time: number, deltaMs: number): void {
    const dt = deltaMs / 1000;

    this.spawnTimer += dt;
    if (this.spawnTimer >= TUNING.debris.spawnIntervalSeconds) {
      this.spawnTimer = 0;
      this.spawnDebris();
    }

    for (const piece of this.debris) piece.update(dt, this.bankTop, this.bankBottom);
    const escaped = this.debris.filter((d) => d.hasEscaped(this.scale.width));
    if (escaped.length > 0) {
      escaped.forEach((d) => d.destroy());
      this.debris = this.debris.filter((d) => !escaped.includes(d));
      this.tally.escaped += escaped.length;
      this.updateHud();
    }

    for (const r of this.ripples) {
      r.x += currentSpeedAt(r.y, this.bankTop, this.bankBottom, TUNING.river.maxCurrentSpeed) * dt;
      if (r.x > this.scale.width + 12) r.x = -12;
    }
  }

  private spawnDebris(): void {
    const kind = Phaser.Utils.Array.GetRandom([...DEBRIS_KINDS]);
    const margin = 20;
    const y = Phaser.Math.Between(this.bankTop + margin, this.bankBottom - margin);
    this.debris.push(new Debris(this, kind, -30, y));
  }

  private tryIntercept(x: number, y: number): void {
    const hit = this.debris.find((d) => d.containsPoint(x, y));
    if (!hit) return;
    hit.destroy();
    this.debris = this.debris.filter((d) => d !== hit);
    this.tally.intercepted += 1;
    this.updateHud();
  }

  private createRipples(): void {
    const still = prefersReducedMotion();
    this.ripples = [];
    for (let i = 0; i < 40; i++) {
      const ripple = this.add
        .image(
          Phaser.Math.Between(0, this.scale.width),
          Phaser.Math.Between(this.bankTop + 6, this.bankBottom - 6),
          'ripple',
        )
        .setAlpha(0.35);
      // With reduced motion the ripples stay put (still visible, just not moving).
      if (!still) this.ripples.push(ripple);
    }
  }

  private updateHud(): void {
    const rate = Math.round(interceptionRate(this.tally) * 100);
    this.hud.setText(
      `Intercepted: ${this.tally.intercepted}   Escaped: ${this.tally.escaped}   (${rate}%)`,
    );
  }
}
