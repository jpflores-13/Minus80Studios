import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';

// Code-drawn placeholder art. Load an image under the same key to replace any of it.
// See docs/ART_DIRECTION.md for what a professional pass should replace these with.

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

/** A round, fuzzy bumble bee from above, wings out. Untinted; scenes tint it per character. */
function drawBee(g: Phaser.GameObjects.Graphics, wingsUp: boolean): void {
  const wy = wingsUp ? -2 : 2;
  g.fillStyle(0xf4f0e0, 0.55);
  g.fillEllipse(8, 8 + wy, 10, 6);
  g.fillEllipse(24, 8 + wy, 10, 6);
  // abdomen stripes
  g.fillStyle(0x2a1d12, 1).fillEllipse(16, 20, 16, 13);
  g.fillStyle(0xe8b84b, 1).fillRect(9, 15, 14, 3).fillRect(9, 22, 14, 3);
  // thorax and head
  g.fillStyle(0x3a2a1a, 1).fillCircle(16, 9, 7);
  g.fillStyle(0x241a10, 1).fillCircle(16, 3, 4);
  // antennae
  g.lineStyle(1.5, 0x241a10, 1).lineBetween(14, 1, 11, -3).lineBetween(18, 1, 21, -3);
}

/** A flower: five petals and a bright centre, as a top-down icon. */
function drawFlower(g: Phaser.GameObjects.Graphics, color: number): void {
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    g.fillStyle(color, 1).fillEllipse(16 + Math.cos(a) * 7, 16 + Math.sin(a) * 7, 9, 9);
  }
  g.fillStyle(PALETTE.honey, 1).fillCircle(16, 16, 6);
}

function drawBroodCell(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(PALETTE.earth, 1).fillRoundedRect(2, 2, 28, 28, 8);
  g.fillStyle(PALETTE.honeyLight, 1).fillCircle(16, 16, 9);
  g.fillStyle(PALETTE.cream, 0.7).fillCircle(16, 16, 4);
}

function drawDebris(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0x5a4a3a, 1);
  g.fillRect(4, 18, 10, 4);
  g.fillRect(16, 10, 12, 4);
  g.fillRect(8, 6, 8, 4);
  g.fillStyle(0x3a2d20, 1).fillRect(4, 18, 10, 4).fillRect(16, 22, 10, 3);
}

function drawStorage(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(PALETTE.amber, 1).fillRoundedRect(2, 6, 36, 32, 10);
  g.fillStyle(PALETTE.honey, 1).fillRoundedRect(6, 10, 28, 24, 8);
  g.fillStyle(PALETTE.honeyLight, 0.6).fillEllipse(20, 18, 16, 10);
}

export function makeArt(scene: Phaser.Scene): void {
  tex(scene, 'bee-0', 32, 26, (g) => drawBee(g, false));
  tex(scene, 'bee-1', 32, 26, (g) => drawBee(g, true));
  tex(scene, 'flower-rose', 32, 32, (g) => drawFlower(g, PALETTE.rose));
  tex(scene, 'flower-sky', 32, 32, (g) => drawFlower(g, PALETTE.sky));
  tex(scene, 'brood-cell', 32, 32, drawBroodCell);
  tex(scene, 'debris', 32, 32, drawDebris);
  tex(scene, 'storage', 40, 40, drawStorage);

  tex(scene, 'particle', 4, 4, (g) => {
    g.fillStyle(PALETTE.honey, 0.8).fillRect(0, 0, 4, 4);
  });

  // the dark: transparent around Buzzby, deepening outward. Unused in daylight scenes, kept
  // for a possible dusk/weather look later.
  if (!scene.textures.exists('vignette')) {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(
        size / 2,
        size / 2,
        size / 4,
        size / 2,
        size / 2,
        size / 2,
      );
      grad.addColorStop(0, 'rgba(36,26,16,0)');
      grad.addColorStop(1, 'rgba(36,26,16,0.55)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      scene.textures.addCanvas('vignette', canvas);
    }
  }
}
