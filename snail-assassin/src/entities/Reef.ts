import Phaser from 'phaser';
import { PALETTE, PIXEL } from '../config/gameConfig';
import { TUNING } from '../config/tuning';
import { prefersReducedMotion } from '../utils/accessibility';
import { createRng } from '../utils/rng';

// Reef background: sand, rocks, coral, seagrass, drifting specks and soft moving light.
export class Reef {
  private snow: { dot: Phaser.GameObjects.Image; vx: number; vy: number }[] = [];
  private lights: Phaser.GameObjects.Ellipse[] = [];
  private readonly still = prefersReducedMotion();

  constructor(
    private readonly scene: Phaser.Scene,
    seed: number,
  ) {
    const { width, height } = scene.scale;
    const w = Math.ceil(width / PIXEL);
    const h = Math.ceil(height / PIXEL);
    const key = `reef-${seed}`;
    if (!scene.textures.exists(key)) paintReef(scene, key, w, h, seed);
    scene.add.image(0, 0, key).setOrigin(0).setScale(PIXEL).setDepth(-10);

    const rng = createRng(seed + 1);
    for (let i = 0; i < 4; i++) {
      const light = scene.add
        .ellipse(rng.range(0, width), rng.range(0, height), 420, 220, 0xfff4d6, 0.05)
        .setDepth(-5);
      this.lights.push(light);
    }
    for (let i = 0; i < TUNING.marineSnow.count; i++) {
      const dot = scene.add
        .image(rng.range(0, width), rng.range(0, height), 'px')
        .setScale(PIXEL / 2)
        .setTint(PALETTE.snow)
        .setAlpha(rng.range(0.15, 0.5))
        .setDepth(20);
      this.snow.push({ dot, vx: rng.range(4, 12), vy: rng.range(-3, 3) });
    }
  }

  update(time: number, dt: number): void {
    if (this.still) return;
    const { width, height } = this.scene.scale;
    for (const s of this.snow) {
      s.dot.x = (s.dot.x + s.vx * dt + width) % width;
      s.dot.y = (s.dot.y + s.vy * dt + height) % height;
    }
    this.lights.forEach((l, i) => {
      l.x += Math.sin(time / 4000 + i) * 6 * dt;
      l.y += Math.cos(time / 5000 + i * 2) * 4 * dt;
      l.setAlpha(0.035 + 0.02 * Math.sin(time / 1500 + i));
    });
  }
}

function paintReef(scene: Phaser.Scene, key: string, w: number, h: number, seed: number): void {
  const rng = createRng(seed);
  const g = scene.add.graphics();
  g.fillStyle(PALETTE.sand, 1);
  g.fillRect(0, 0, w, h);
  // Sand ripples.
  g.fillStyle(PALETTE.sandDark, 1);
  for (let y = 4; y < h; y += 7) {
    for (let x = 0; x < w; x += 2) {
      if (Math.sin(x / 9 + y) > 0.6) g.fillRect(x, y + Math.round(Math.sin(x / 6) * 1.5), 2, 1);
    }
  }
  g.fillStyle(PALETTE.sandLight, 1);
  for (let i = 0; i < 220; i++)
    g.fillRect(Math.floor(rng.range(0, w)), Math.floor(rng.range(0, h)), 1, 1);

  // Seagrass beds: dense short blades (ambush cover).
  for (let b = 0; b < 6; b++) {
    const cx = rng.range(20, w - 20);
    const cy = rng.range(20, h - 20);
    for (let i = 0; i < 70; i++) {
      const x = Math.floor(cx + rng.range(-16, 16));
      const y = Math.floor(cy + rng.range(-10, 10));
      g.fillStyle(rng.next() > 0.4 ? PALETTE.seagrass : PALETTE.seagrassLight, 1);
      g.fillRect(x, y, 1, 2 + Math.floor(rng.range(0, 3)));
    }
  }

  // Rocks with dark crevices.
  for (let r = 0; r < 7; r++) {
    const x = rng.range(10, w - 30);
    const y = rng.range(10, h - 20);
    const rw = rng.range(10, 22);
    const rh = rng.range(6, 12);
    g.fillStyle(PALETTE.rockDark, 1);
    g.fillEllipse(x + 1, y + 2, rw, rh);
    g.fillStyle(PALETTE.rock, 1);
    g.fillEllipse(x, y, rw, rh);
    g.fillStyle(PALETTE.rockDark, 1);
    g.fillRect(Math.floor(x - rw / 4), Math.floor(y), Math.floor(rw / 2), 1);
  }

  // Coral heads: clustered blobs in warm colours.
  const corals = [PALETTE.coral, PALETTE.coralPink, PALETTE.coralGold];
  for (let c = 0; c < 9; c++) {
    const cx = rng.range(10, w - 10);
    const cy = rng.range(10, h - 10);
    const color = corals[c % corals.length] ?? PALETTE.coral;
    for (let i = 0; i < 9; i++) {
      g.fillStyle(color, 1);
      g.fillCircle(cx + rng.range(-6, 6), cy + rng.range(-5, 5), rng.range(1.5, 3.5));
    }
    g.fillStyle(0xffffff, 0.35);
    g.fillRect(Math.floor(cx), Math.floor(cy - 2), 1, 1);
  }

  // Deep-water vignette at the edges.
  for (let i = 0; i < 10; i++) {
    g.fillStyle(PALETTE.navy, 0.09);
    g.fillRect(0, 0, w, i * 2);
    g.fillRect(0, h - i * 2, w, i * 2);
    g.fillRect(0, 0, i * 3, h);
    g.fillRect(w - i * 3, 0, i * 3, h);
  }
  g.generateTexture(key, w, h);
  g.destroy();
}
