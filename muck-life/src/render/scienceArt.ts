import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import type { Discovery } from '../content/science';

/** Simple original scientific illustrations for the ending and Explore (placeholders). */
export function drawDiscoveryArt(
  g: Phaser.GameObjects.Graphics,
  kind: Discovery['art'],
  cx: number,
  cy: number,
  t: number,
): void {
  const soil = () => {
    g.fillStyle(PALETTE.sediment, 1);
    g.fillRoundedRect(cx - 170, cy - 40, 340, 200, 12);
    g.fillStyle(0x6b9a9e, 1);
    g.fillRect(cx - 170, cy - 52, 340, 14);
  };
  const glow = (x: number, y: number, r: number, a: number) => {
    for (let i = 4; i >= 1; i--) {
      g.fillStyle(PALETTE.mint, (a * 0.22) / i);
      g.fillCircle(x, y, (r * i) / 2.5);
    }
  };
  switch (kind) {
    case 'aerenchyma': {
      // Cross-section of a root: cortex full of air channels around a central stele.
      g.fillStyle(PALETTE.root, 1);
      g.fillCircle(cx, cy + 40, 120);
      g.fillStyle(0x1b1511, 1);
      for (let k = 0; k < 18; k++) {
        const a = (k / 18) * Math.PI * 2;
        g.fillEllipse(cx + Math.cos(a) * 72, cy + 40 + Math.sin(a) * 72, 34, 22);
      }
      g.fillStyle(0x8a6a3a, 1);
      g.fillCircle(cx, cy + 40, 32);
      g.fillStyle(PALETTE.cyan, 0.9);
      const a = t * 1.5;
      g.fillCircle(cx + Math.cos(a) * 72, cy + 40 + Math.sin(a) * 72, 7);
      break;
    }
    case 'rol': {
      soil();
      g.lineStyle(10, PALETTE.root, 1);
      g.lineBetween(cx, cy - 40, cx, cy + 140);
      for (let k = 0; k < 8; k++) {
        const y = cy - 20 + k * 20;
        const d = ((t * 30 + k * 13) % 50) + 8;
        g.fillStyle(PALETTE.cyan, 1 - d / 60);
        g.fillCircle(cx - d, y, 3);
        g.fillCircle(cx + d, y + 8, 3);
      }
      break;
    }
    case 'growth': {
      soil();
      const len = 40 + ((t * 30) % 110);
      glow(cx, cy - 30 + len, 60, 1);
      g.lineStyle(7, PALETTE.root, 1);
      g.lineBetween(cx, cy - 38, cx, cy - 30 + len);
      g.fillStyle(PALETTE.cream, 1);
      g.fillCircle(cx, cy - 30 + len, 5);
      break;
    }
    case 'roots': {
      soil();
      g.lineStyle(7, PALETTE.root, 1);
      g.lineBetween(cx - 80, cy - 38, cx - 80, cy + 130);
      glow(cx - 80, cy + 120, 40, 0.8);
      g.lineStyle(7, 0xa98a5f, 1);
      g.lineBetween(cx + 70, cy - 38, cx + 70, cy + 130);
      glow(cx + 70, cy + 50, 90, 1);
      g.lineStyle(2, PALETTE.root, 1);
      for (let k = 0; k < 7; k++) {
        const y = cy + 10 + k * 14;
        const s = k % 2 ? 1 : -1;
        g.lineBetween(cx + 70, y, cx + 70 + s * 40, y + 18);
      }
      break;
    }
    case 'night': {
      g.fillStyle(0x0d1322, 1);
      g.fillRoundedRect(cx - 170, cy - 140, 340, 110, 12);
      g.fillStyle(0xeef0e0, 1);
      g.fillCircle(cx + 110, cy - 100, 16);
      soil();
      glow(cx, cy + 60, 80, 0.85 + 0.15 * Math.sin(t * 2));
      g.lineStyle(7, PALETTE.root, 1);
      g.lineBetween(cx, cy - 38, cx, cy + 100);
      break;
    }
    case 'chemistry': {
      soil();
      glow(cx, cy + 50, 90, 1);
      for (let k = 0; k < 24; k++) {
        const x = cx - 150 + (k % 8) * 42;
        const y = cy - 10 + Math.floor(k / 8) * 55;
        const near = Math.hypot(x - cx, y - (cy + 50)) < 80;
        if (near) {
          g.lineStyle(2, PALETTE.mint, 1);
          g.strokeCircle(x, y, 6);
        } else {
          g.fillStyle(PALETTE.amber, 0.6);
          g.fillRect(x - 4, y - 4, 8, 8);
        }
      }
      break;
    }
    case 'questions': {
      soil();
      g.lineStyle(7, PALETTE.root, 1);
      g.lineBetween(cx, cy - 38, cx + 20, cy + 120);
      g.fillStyle(PALETTE.amber, 1);
      for (let k = 0; k < 3; k++)
        g.fillCircle(cx - 110 + k * 110, cy + 20 + 10 * Math.sin(t + k), 6);
      break;
    }
  }
}

/** A cut-away rhizobox with its optode sheet, camera, and blue LED. */
export function drawRhizobox(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  g.fillStyle(0x0a0908, 1);
  g.fillRoundedRect(x - 20, y - 20, 420, 360, 10);
  // Box
  g.fillStyle(PALETTE.sediment, 1);
  g.fillRect(x, y + 40, 150, 290);
  g.lineStyle(3, PALETTE.cream, 0.9);
  g.strokeRect(x, y + 20, 150, 310);
  // Optode sheet on the front face
  g.fillStyle(PALETTE.cyan, 0.35);
  g.fillRect(x + 20, y + 90, 110, 210);
  g.lineStyle(2, PALETTE.cyan, 1);
  g.strokeRect(x + 20, y + 90, 110, 210);
  // Roots
  g.lineStyle(4, PALETTE.root, 1);
  g.lineBetween(x + 75, y + 40, x + 70, y + 260);
  g.lineBetween(x + 75, y + 60, x + 120, y + 200);
  // Leaves up into the light
  g.fillStyle(PALETTE.cattail, 1);
  g.fillTriangle(x + 70, y + 40, x + 80, y + 40, x + 60, y - 10);
  g.fillTriangle(x + 72, y + 40, x + 82, y + 40, x + 100, y - 14);
  // Camera + LED
  g.fillStyle(0x3a3a3a, 1);
  g.fillRoundedRect(x + 270, y + 170, 80, 56, 8);
  g.fillStyle(0x111111, 1);
  g.fillCircle(x + 260, y + 198, 18);
  g.fillStyle(0x3d6bff, 1);
  g.fillRect(x + 280, y + 120, 40, 18);
  g.lineStyle(2, 0x3d6bff, 0.5);
  g.lineBetween(x + 280, y + 130, x + 135, y + 160);
  g.lineBetween(x + 280, y + 130, x + 135, y + 260);
}
