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

/** A tiny deterministic hash, so tile texture variants look scattered but never change frame to frame. */
function hash(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/** Pick between a tile kind's texture variants, stable for a given tile position. */
export function tileVariant(kind: string, tx: number, ty: number, count: number): string {
  const i = Math.floor(hash(tx, ty) * count) % count;
  return i === 0 ? kind : `${kind}-${i}`;
}

/** Moss from above: a small elongated body, short legs, a speckled back, an animated tail. */
function drawMoss(g: Phaser.GameObjects.Graphics, step: number): void {
  // a faint warm halo under the body gives it some presence against the forest floor
  g.fillStyle(0xd9b27c, 0.18).fillEllipse(19, 16, 26, 16);
  g.fillStyle(0x6b5a44, 1).fillEllipse(10, 16, 8, 5);
  g.fillStyle(0x7a6850, 1).fillEllipse(20, 16, 18, 8);
  g.fillStyle(0x8a7760, 1).fillEllipse(30, 16, 10, 7);
  // a lighter dorsal stripe, the way a real salamander's back often catches more light
  g.fillStyle(0x968268, 1).fillEllipse(20, 15, 15, 3);
  g.fillStyle(0x4a3f30, 1);
  for (const [x, y] of [
    [14, 13],
    [18, 19],
    [22, 13],
    [26, 18],
    [16, 16],
  ] as const)
    g.fillCircle(x, y, 1.2);
  const leg = step ? 2 : -2;
  g.fillStyle(0x5a4a38, 1)
    .fillRect(16 + leg, 20, 2, 4)
    .fillRect(16 - leg, 10, 2, -4)
    .fillRect(24 + leg, 20, 2, 4)
    .fillRect(24 - leg, 10, 2, -4);
  g.fillStyle(0x0c0f0c, 1).fillRect(33, 14, 1, 1).fillRect(33, 18, 1, 1);
  g.fillStyle(0xd9b27c, 0.6).fillRect(33, 13, 1, 1).fillRect(33, 17, 1, 1);
}

/** Forest floor: dithered ground, a sprinkle of grass blades and pebbles. Two variants. */
function drawFloor(g: Phaser.GameObjects.Graphics, seed: number): void {
  g.fillStyle(PALETTE.forest, 1).fillRect(0, 0, 32, 32);
  for (let i = 0; i < 24; i++) {
    const x = Math.floor(hash(seed, i) * 32);
    const y = Math.floor(hash(seed + 50, i) * 32);
    g.fillStyle(hash(seed + 90, i) > 0.5 ? 0x2a4b3c : 0x1a3328, 0.6).fillRect(x, y, 2, 2);
  }
  const blades =
    seed === 0
      ? [
          [5, 24],
          [19, 8],
          [26, 27],
        ]
      : [
          [9, 6],
          [24, 20],
          [14, 29],
        ];
  g.fillStyle(0x3d6b4f, 0.8);
  for (const [x, y] of blades as [number, number][]) {
    g.fillRect(x, y, 1, 5).fillRect(x + 2, y + 1, 1, 4);
  }
  const pebble = seed === 0 ? [22, 11] : [6, 17];
  g.fillStyle(0x52453a, 0.7).fillCircle(pebble[0]!, pebble[1]!, 2);
  g.fillStyle(0x6a5c4e, 0.5).fillCircle(pebble[0]! - 1, pebble[1]! - 1, 0.8);
}

/** Moss patches: soft overlapping clumps with a lighter crown and darker shadowed edge. */
function drawMossPatch(g: Phaser.GameObjects.Graphics, seed: number): void {
  g.fillStyle(PALETTE.moss, 1).fillRect(0, 0, 32, 32);
  const clumps =
    seed === 0
      ? [
          [10, 10, 5],
          [22, 20, 6],
          [24, 8, 3.5],
        ]
      : [
          [8, 22, 4.5],
          [20, 10, 5.5],
          [25, 24, 3],
        ];
  for (const [x, y, r] of clumps as [number, number, number][]) {
    g.fillStyle(0x4c6244, 0.5).fillCircle(x + 1, y + 1.5, r);
    g.fillStyle(0x5f7a54, 1).fillCircle(x, y, r);
    g.fillStyle(0x8aa078, 0.8).fillCircle(x - r * 0.3, y - r * 0.3, r * 0.45);
  }
  g.fillStyle(0x3a4e33, 0.5);
  for (let i = 0; i < 10; i++) {
    const x = Math.floor(hash(seed + 20, i) * 32);
    const y = Math.floor(hash(seed + 70, i) * 32);
    g.fillRect(x, y, 1, 1);
  }
}

/** Flowing water: two shimmer frames, light streaks and a foam edge drifting between them. */
function drawStream(g: Phaser.GameObjects.Graphics, frame: number): void {
  g.fillStyle(PALETTE.stream, 1).fillRect(0, 0, 32, 32);
  g.fillStyle(0x4f87a0, 0.5).fillRect(0, 22, 32, 10);
  const off = frame * 10;
  g.lineStyle(1.5, 0xcfe9f0, 0.65);
  for (let i = -1; i < 3; i++) {
    const x0 = (i * 14 + off) % 46;
    g.lineBetween(x0, 4, x0 + 8, 12);
  }
  g.lineStyle(1, 0x8fc0d0, 0.5);
  for (let i = -1; i < 3; i++) {
    const x0 = (i * 11 + off * 1.4) % 44;
    g.lineBetween(x0, 20, x0 + 6, 26);
  }
  g.fillStyle(0xe9f4f7, frame === 0 ? 0.35 : 0.2).fillCircle(6 + off * 0.3, 16, 2);
}

/** A fallen log: bark grain, cut-end rings, and a sunlit edge. */
function drawLog(g: Phaser.GameObjects.Graphics, seed: number): void {
  g.fillStyle(PALETTE.terracotta, 1).fillRect(0, 0, 32, 32);
  g.fillStyle(0x6a4228, 1).fillRect(0, 10, 32, 12);
  g.fillStyle(0x8a5a3a, 1).fillRect(0, 12, 32, 8);
  g.lineStyle(1, 0x5a3620, 0.7);
  for (let x = 2; x < 32; x += 6) g.lineBetween(x + (seed % 3), 12, x + (seed % 3) - 2, 20);
  g.lineStyle(1, 0xc08a5a, 0.5).lineBetween(0, 12, 32, 12);
  g.fillStyle(0x3d6b4f, 0.5).fillRect(2, 2, 6, 3).fillRect(22, 26, 6, 3);
}

/** A sunlit clearing: warm ground, scattered pebbles and dry grass. */
function drawClearing(g: Phaser.GameObjects.Graphics, seed: number): void {
  g.fillStyle(PALETTE.cream, 1).fillRect(0, 0, 32, 32);
  for (let i = 0; i < 10; i++) {
    const x = Math.floor(hash(seed + 10, i) * 32);
    const y = Math.floor(hash(seed + 60, i) * 32);
    g.fillStyle(hash(seed + 95, i) > 0.5 ? 0xd8cfab : 0xc9bd92, 0.7).fillRect(x, y, 2, 2);
  }
  const grass =
    seed === 0
      ? [
          [7, 20],
          [24, 9],
        ]
      : [
          [14, 26],
          [27, 18],
        ];
  g.fillStyle(0xb9a85e, 0.8);
  for (const [x, y] of grass as [number, number][]) g.fillRect(x, y, 1, 5).fillRect(x + 2, y, 1, 4);
  g.fillStyle(0xf3ead0, 0.4).fillCircle(seed === 0 ? 20 : 10, seed === 0 ? 20 : 12, 5);
}

/** An impassable rock wall: angular facets, a cracked seam, light from the upper left. */
function drawBarrier(g: Phaser.GameObjects.Graphics, seed: number): void {
  g.fillStyle(PALETTE.slate, 1).fillRect(0, 0, 32, 32);
  g.fillStyle(0x3f4c50, 1);
  g.fillTriangle(0, 0, 32, 0, 0, 20);
  g.fillTriangle(32, 32, 0, 32, 32, 14);
  g.fillStyle(0x6a7a7e, 0.6);
  g.fillTriangle(0, 0, 18, 0, 0, 10);
  g.lineStyle(1.5, 0x2a3438, 0.8);
  g.lineBetween(4 + (seed % 4), 2, 14, 18).lineBetween(14, 18, 10, 30);
  g.lineBetween(20, 4, 28, 16);
  for (let i = 0; i < 14; i++) {
    const x = Math.floor(hash(seed + 30, i) * 32);
    const y = Math.floor(hash(seed + 80, i) * 32);
    g.fillStyle(0x24302f, 0.5).fillRect(x, y, 1, 1);
  }
}

export function makeArt(scene: Phaser.Scene): void {
  for (let step = 0; step < 2; step++) tex(scene, `moss-${step}`, 36, 32, (g) => drawMoss(g, step));

  tex(scene, 'tile-floor', 32, 32, (g) => drawFloor(g, 0));
  tex(scene, 'tile-floor-1', 32, 32, (g) => drawFloor(g, 1));
  tex(scene, 'tile-stream', 32, 32, (g) => drawStream(g, 0));
  tex(scene, 'tile-stream-1', 32, 32, (g) => drawStream(g, 1));
  tex(scene, 'tile-moss', 32, 32, (g) => drawMossPatch(g, 0));
  tex(scene, 'tile-moss-1', 32, 32, (g) => drawMossPatch(g, 1));
  tex(scene, 'tile-log', 32, 32, (g) => drawLog(g, 0));
  tex(scene, 'tile-clearing', 32, 32, (g) => drawClearing(g, 0));
  tex(scene, 'tile-clearing-1', 32, 32, (g) => drawClearing(g, 1));
  tex(scene, 'tile-barrier', 32, 32, (g) => drawBarrier(g, 0));

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

  tex(scene, 'mote', 4, 4, (g) => {
    g.fillStyle(PALETTE.gold, 0.9).fillCircle(2, 2, 2);
  });
}
