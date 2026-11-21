import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';

// Code-drawn placeholder art. Load an image under the same key to replace any of it.

function tex(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  draw: (g: Phaser.GameObjects.Graphics) => void,
): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

/** Moss from above: a small elongated body, short legs, a speckled back, an animated tail. */
function drawMoss(g: Phaser.GameObjects.Graphics, step: number): void {
  g.fillStyle(0x6b5a44, 1).fillEllipse(10, 16, 8, 5);
  g.fillStyle(0x7a6850, 1).fillEllipse(20, 16, 18, 8);
  g.fillStyle(0x8a7760, 1).fillEllipse(30, 16, 10, 7);
  g.fillStyle(0x4a3f30, 1);
  for (const [x, y] of [
    [16, 13],
    [22, 19],
    [26, 13],
  ] as const)
    g.fillCircle(x, y, 1.2);
  const leg = step ? 2 : -2;
  g.fillStyle(0x5a4a38, 1)
    .fillRect(16 + leg, 20, 2, 4)
    .fillRect(16 - leg, 10, 2, -4)
    .fillRect(24 + leg, 20, 2, 4)
    .fillRect(24 - leg, 10, 2, -4);
  g.fillStyle(0x0c0f0c, 1).fillRect(33, 14, 1, 1).fillRect(33, 18, 1, 1);
}

export function makeArt(scene: Phaser.Scene): void {
  for (let step = 0; step < 2; step++) tex(scene, `moss-${step}`, 36, 32, (g) => drawMoss(g, step));

  tex(scene, 'tile-floor', 32, 32, (g) => {
    g.fillStyle(PALETTE.forest, 1).fillRect(0, 0, 32, 32);
    g.fillStyle(0x2a4b3c, 1).fillRect(4, 6, 3, 3).fillRect(20, 20, 3, 3).fillRect(12, 24, 2, 2);
  });
  tex(scene, 'tile-stream', 32, 32, (g) => {
    g.fillStyle(PALETTE.stream, 1).fillRect(0, 0, 32, 32);
    g.lineStyle(1.5, 0x8fc0d0, 0.6).lineBetween(2, 10, 12, 10).lineBetween(18, 22, 28, 22);
  });
  tex(scene, 'tile-moss', 32, 32, (g) => {
    g.fillStyle(PALETTE.moss, 1).fillRect(0, 0, 32, 32);
    g.fillStyle(0x5f7a54, 1).fillCircle(10, 10, 4).fillCircle(22, 20, 5).fillCircle(24, 8, 3);
  });
  tex(scene, 'tile-log', 32, 32, (g) => {
    g.fillStyle(PALETTE.terracotta, 1).fillRect(0, 0, 32, 32);
    g.fillStyle(0x8a5a3a, 1).fillRect(0, 12, 32, 8);
    g.lineStyle(1, 0x6a4228, 0.8).lineBetween(0, 16, 32, 16);
  });
  tex(scene, 'tile-clearing', 32, 32, (g) => {
    g.fillStyle(PALETTE.cream, 1).fillRect(0, 0, 32, 32);
    g.fillStyle(0xd8cfab, 1).fillRect(6, 6, 2, 2).fillRect(20, 14, 2, 2).fillRect(10, 22, 2, 2);
  });
  tex(scene, 'tile-barrier', 32, 32, (g) => {
    g.fillStyle(PALETTE.slate, 1).fillRect(0, 0, 32, 32);
    g.lineStyle(2, 0x3a4448, 1).lineBetween(0, 0, 32, 32).lineBetween(32, 0, 0, 32);
  });

  // the dark vignette: clear near Moss, deepening outward
  if (!scene.textures.exists('vignette')) {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(size / 2, size / 2, 60, size / 2, size / 2, size / 2);
      grad.addColorStop(0, 'rgba(20,32,26,0)');
      grad.addColorStop(0.55, 'rgba(20,32,26,0)');
      grad.addColorStop(1, 'rgba(20,32,26,0.55)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      scene.textures.addCanvas('vignette', canvas);
    }
  }

  tex(scene, 'rain-drop', 3, 8, (g) => {
    g.fillStyle(0x9fc8d8, 0.7).fillRect(0, 0, 3, 8);
  });
}
