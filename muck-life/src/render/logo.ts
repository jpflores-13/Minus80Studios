import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { TEXT_STYLES } from '../ui/text';

/**
 * The MUCK LIFE wordmark (placeholder for the artist's final logo, see docs/ARTIST_BRIEF.md):
 * chunky organic type in warm cream over mud, a pale root threading through the letters with a
 * lateral branch, and a small glowing O₂ bubble on the root tip.
 */
export function drawLogo(
  scene: Phaser.Scene,
  x: number,
  y: number,
  scale = 1,
): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const word = scene.add
    .text(0, 0, 'MUCK LIFE', {
      ...TEXT_STYLES.display,
      fontSize: `${Math.round(104 * scale)}px`,
      color: PALETTE.text,
      stroke: '#28231f',
      strokeThickness: 12 * scale,
      shadow: { offsetX: 0, offsetY: 6 * scale, color: '#000000', blur: 0, fill: true },
    })
    .setOrigin(0.5);
  const w = word.width;
  const g = scene.add.graphics();
  // Glow behind the lettering: the optode cyan, faint.
  g.fillStyle(PALETTE.cyan, 0.12);
  g.fillEllipse(0, 6 * scale, w * 1.15, 140 * scale);
  // The root threading through the letters.
  const root = scene.add.graphics();
  const path: [number, number][] = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    path.push([
      -w / 2 - 30 * scale + t * (w + 40 * scale),
      14 * scale + Math.sin(t * Math.PI * 3) * 16 * scale + t * 18 * scale,
    ]);
  }
  root.lineStyle(10 * scale, 0x1b1511, 1);
  root.beginPath();
  path.forEach(([px, py], i) => (i === 0 ? root.moveTo(px, py) : root.lineTo(px, py)));
  root.strokePath();
  root.lineStyle(6 * scale, PALETTE.root, 1);
  root.beginPath();
  path.forEach(([px, py], i) => (i === 0 ? root.moveTo(px, py) : root.lineTo(px, py)));
  root.strokePath();
  // A lateral branch dropping below the word.
  const [bx, by] = path[26]!;
  root.lineStyle(3 * scale, PALETTE.root, 1);
  root.lineBetween(bx, by, bx + 18 * scale, by + 40 * scale);
  root.lineBetween(bx + 9 * scale, by + 20 * scale, bx - 6 * scale, by + 44 * scale);
  // Oxygen bubble at the tip.
  const [tx, ty] = path[path.length - 1]!;
  const bubble = scene.add.graphics();
  bubble.fillStyle(PALETTE.mint, 0.25);
  bubble.fillCircle(tx + 18 * scale, ty - 6 * scale, 26 * scale);
  bubble.fillStyle(PALETTE.mint, 1);
  bubble.fillCircle(tx + 18 * scale, ty - 6 * scale, 15 * scale);
  const o2 = scene.add
    .text(tx + 18 * scale, ty - 6 * scale, 'O₂', {
      ...TEXT_STYLES.label,
      fontSize: `${Math.round(15 * scale)}px`,
      color: '#14110e',
    })
    .setOrigin(0.5);
  c.add([g, word, root, bubble, o2]);
  return c;
}

/** The O₂ RUSH sub-logo: italic, amber, with speed streaks. */
export function drawRushLogo(
  scene: Phaser.Scene,
  x: number,
  y: number,
  scale = 1,
): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.lineStyle(4 * scale, PALETTE.amber, 0.8);
  for (let i = 0; i < 3; i++)
    g.lineBetween(-150 * scale, (-14 + i * 14) * scale, -110 * scale, (-14 + i * 14) * scale);
  const t = scene.add
    .text(0, 0, 'O₂ RUSH', {
      ...TEXT_STYLES.display,
      fontSize: `${Math.round(60 * scale)}px`,
      fontStyle: 'italic bold',
      color: PALETTE.textAmber,
      stroke: '#28231f',
      strokeThickness: 8 * scale,
    })
    .setOrigin(0.5);
  c.add([g, t]);
  return c;
}
