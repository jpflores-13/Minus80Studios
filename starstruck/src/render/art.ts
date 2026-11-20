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

/** Diggy from above, facing right: a velvety body, huge digging hands, a tiny gold bolt. */
function drawMole(g: Phaser.GameObjects.Graphics, step: number, accent: number): void {
  // tail
  g.fillStyle(0x3a3a40, 1).fillEllipse(3, 16, 8, 4);
  // body
  g.fillStyle(0x2c2c33, 1).fillEllipse(17, 16, 26, 20);
  g.fillStyle(0x3d3d46, 1).fillEllipse(15, 13, 16, 9);
  // big pink digging hands, swinging as it walks
  const s = step ? 2 : -2;
  g.fillStyle(PALETTE.rose, 1)
    .fillEllipse(24 + s, 5, 9, 6)
    .fillEllipse(24 - s, 27, 9, 6);
  g.fillStyle(0xf6d0d4, 1);
  for (let i = 0; i < 3; i++) {
    g.fillRect(27 + s, 3 + i * 2, 2, 1);
    g.fillRect(27 - s, 25 + i * 2, 2, 1);
  }
  // head
  g.fillStyle(0x2c2c33, 1).fillEllipse(29, 16, 12, 12);
  // tiny eyes (moles see very little)
  g.fillStyle(0x0c0f13, 1).fillRect(29, 12, 1, 1).fillRect(29, 19, 1, 1);
  // the lightning-bolt accessory on its back
  g.fillStyle(accent, 1);
  g.fillPoints(
    [
      new Phaser.Math.Vector2(12, 10),
      new Phaser.Math.Vector2(16, 10),
      new Phaser.Math.Vector2(14, 15),
      new Phaser.Math.Vector2(18, 15),
      new Phaser.Math.Vector2(11, 22),
      new Phaser.Math.Vector2(13, 16),
      new Phaser.Math.Vector2(9, 16),
    ],
    true,
  );
}

export function makeArt(scene: Phaser.Scene): void {
  for (let step = 0; step < 2; step++)
    tex(scene, `mole-${step}`, 36, 32, (g) => drawMole(g, step, PALETTE.amber));

  // tiles (32×32)
  tex(scene, 'tile-tunnel', 32, 32, (g) => {
    g.fillStyle(0x2a211c, 1).fillRect(0, 0, 32, 32);
    g.fillStyle(0x342922, 1)
      .fillRect(3, 5, 2, 2)
      .fillRect(20, 14, 3, 2)
      .fillRect(11, 25, 2, 2)
      .fillRect(27, 28, 2, 1);
  });
  tex(scene, 'tile-soil', 32, 32, (g) => {
    g.fillStyle(PALETTE.soil, 1).fillRect(0, 0, 32, 32);
    g.fillStyle(0x56402f, 1)
      .fillRect(4, 6, 3, 3)
      .fillRect(18, 3, 2, 2)
      .fillRect(24, 19, 3, 3)
      .fillRect(9, 22, 2, 2);
    g.fillStyle(0x3b2b23, 1).fillRect(14, 12, 4, 2).fillRect(2, 28, 5, 2);
  });
  tex(scene, 'tile-rock', 32, 32, (g) => {
    g.fillStyle(0x3a3c42, 1).fillRect(0, 0, 32, 32);
    g.fillStyle(0x50545c, 1).fillTriangle(2, 28, 14, 4, 26, 28);
    g.fillStyle(0x2a2c30, 1).fillTriangle(14, 4, 26, 28, 30, 18);
  });
  tex(scene, 'tile-dug', 32, 32, (g) => {
    g.fillStyle(0x2a211c, 1).fillRect(0, 0, 32, 32);
    g.fillStyle(0x4a382c, 0.8).fillCircle(8, 8, 3).fillCircle(24, 20, 4).fillCircle(14, 26, 2);
  });

  // the dark: transparent around Diggy, deepening outward
  if (!scene.textures.exists('vignette')) {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // drawn at 2x scale in play: clear for ~40px around Diggy, mostly dark by ~140px
      const grad = ctx.createRadialGradient(size / 2, size / 2, 14, size / 2, size / 2, size / 2);
      grad.addColorStop(0, 'rgba(23,28,34,0)');
      grad.addColorStop(0.05, 'rgba(23,28,34,0.3)');
      grad.addColorStop(0.14, 'rgba(23,28,34,0.78)');
      grad.addColorStop(1, 'rgba(23,28,34,0.9)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      scene.textures.addCanvas('vignette', canvas);
    }
  }

  tex(scene, 'particle', 3, 3, (g) => {
    g.fillStyle(PALETTE.sand, 0.7).fillRect(0, 0, 3, 3);
  });
}
