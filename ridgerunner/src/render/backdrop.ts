import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { progress } from '../config/progress';

// A painted scene behind every menu screen (Title, Intro, Level Select, Settings), instead of a
// flat fill. Ridges, a tree line, and a stream band tie the backdrop to what the game is about.
// All code-drawn, like the rest of src/render — load an image to replace it later.

function hills(
  g: Phaser.GameObjects.Graphics,
  width: number,
  baseY: number,
  amp: number,
  step: number,
  color: number,
  alpha: number,
): void {
  g.fillStyle(color, alpha);
  g.beginPath();
  g.moveTo(0, baseY);
  for (let x = 0; x <= width; x += step) {
    const y = baseY - amp * (0.5 + 0.5 * Math.sin(x * 0.013 + color * 1e-5));
    g.lineTo(x, y);
  }
  g.lineTo(width, baseY + amp * 2);
  g.lineTo(0, baseY + amp * 2);
  g.closePath();
  g.fillPath();
}

function fir(g: Phaser.GameObjects.Graphics, x: number, y: number, h: number, color: number): void {
  g.fillStyle(color, 1);
  for (let i = 0; i < 3; i++) {
    const w = h * 0.45 * (1 - i * 0.22);
    const ty = y - h + i * (h * 0.3);
    g.fillTriangle(x - w / 2, ty + h * 0.32, x + w / 2, ty + h * 0.32, x, ty);
  }
  g.fillRect(x - 2, y - 4, 4, 8);
}

/** A soft layered glow: a cheap stand-in for a radial gradient using Graphics alone. */
export function halo(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  r: number,
  color: number,
): void {
  for (let i = 5; i > 0; i--) g.fillStyle(color, 0.05 * (6 - i)).fillCircle(x, y, (r * i) / 5);
}

/** Paints a layered landscape into the given scene at depth -10..-5, behind everything else. */
export function drawBackdrop(scene: Phaser.Scene): void {
  const { width, height } = scene.scale;
  const sky = scene.add.graphics().setDepth(-10);
  sky.fillGradientStyle(0x0f1a16, 0x0f1a16, PALETTE.forest, PALETTE.forest, 1);
  sky.fillRect(0, 0, width, height);

  const far = scene.add.graphics().setDepth(-9);
  hills(far, width, height * 0.52, 46, 24, PALETTE.slate, 0.55);
  const near = scene.add.graphics().setDepth(-8);
  hills(near, width, height * 0.62, 60, 18, 0x1c3328, 0.85);

  const trees = scene.add.graphics().setDepth(-7);
  const rng = (seed: number) => {
    const s = Math.sin(seed * 12.9898) * 43758.5453;
    return s - Math.floor(s);
  };
  for (let i = 0, x = -10; x < width + 10; i++) {
    const h = 70 + rng(i) * 60;
    fir(trees, x, height * 0.66 + rng(i + 50) * 14, h, i % 3 === 0 ? 0x16271e : 0x1e3a2c);
    x += 26 + rng(i + 100) * 30;
  }

  // The stream: what the whole game is about, so it gets a visible band of its own.
  const stream = scene.add.graphics().setDepth(-6);
  stream.fillStyle(PALETTE.stream, 0.9);
  stream.beginPath();
  stream.moveTo(0, height * 0.86);
  stream.lineTo(width, height * 0.78);
  stream.lineTo(width, height * 0.92);
  stream.lineTo(0, height);
  stream.closePath();
  stream.fillPath();
  stream.lineStyle(2, 0xcfe6ea, 0.35);
  for (let i = 0; i < 5; i++) {
    const y0 = height * 0.82 + i * 7;
    stream.lineBetween(width * 0.05, y0, width * 0.95, y0 - height * 0.03);
  }

  const floor = scene.add.graphics().setDepth(-5);
  floor.fillStyle(PALETTE.ink, 1);
  floor.fillRect(0, height * 0.94, width, height * 0.06);

  if (progress().reducedEffects) return;
  // Fireflies: a handful of warm motes drifting slowly upward, fading in and out.
  for (let i = 0; i < 9; i++) {
    const x = 40 + rng(i + 300) * (width - 80);
    const y = height * 0.35 + rng(i + 400) * height * 0.5;
    const dot = scene.add.circle(x, y, 2 + rng(i + 500) * 1.5, PALETTE.gold, 0.8).setDepth(-4);
    scene.tweens.add({
      targets: dot,
      y: y - 30 - rng(i + 600) * 40,
      alpha: 0,
      duration: 3200 + rng(i + 700) * 2600,
      delay: rng(i + 800) * 2000,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onRepeat: () => dot.setPosition(x, y).setAlpha(0.8),
    });
  }
}
