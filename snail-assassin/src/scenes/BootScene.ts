import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';

/**
 * Creates placeholder textures in code, so the prototype needs no image files.
 * When real art arrives, load it here instead (this.load.image(...) in preload()).
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.makeSnailTexture();
    this.makeSnowTexture();
    this.scene.start(this.firstScene());
  }

  /** Dev-only shortcut: open http://localhost:8081/?scene=Play to skip the title. */
  private firstScene(): string {
    const requested = new URLSearchParams(window.location.search).get('scene');
    const known = requested !== null && this.scene.get(requested) !== null;
    return import.meta.env.DEV && known ? requested : 'Title';
  }

  private makeSnailTexture(): void {
    const g = this.add.graphics();
    // Soft body (foot) underneath the shell.
    g.fillStyle(PALETTE.body, 1);
    g.fillEllipse(44, 40, 76, 16);
    // Conical shell pointing backward, with simple stripes.
    g.fillStyle(PALETTE.shell, 1);
    g.fillTriangle(8, 30, 64, 10, 64, 40);
    g.fillStyle(PALETTE.shellStripe, 1);
    for (const x of [24, 38, 52]) g.fillRect(x, 18, 4, 18);
    // Siphon: the snail's "snorkel", sweeping ahead to sense prey.
    g.lineStyle(4, PALETTE.body, 1);
    g.lineBetween(70, 36, 86, 22);
    g.generateTexture('snail', 92, 50);
    g.destroy();
  }

  private makeSnowTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(PALETTE.snow, 1);
    g.fillCircle(2, 2, 2);
    g.generateTexture('snow', 4, 4);
    g.destroy();
  }
}
