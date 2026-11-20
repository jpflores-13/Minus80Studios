import type Phaser from 'phaser';
import type { Conditions } from '../systems/weather';

// Weather icons for the calendar, told apart by shape (not just colour):
// sun = dry, cloud = light rain, cloud with drops = moderate rain, cloud with lightning = storm.
export function drawMonthIcon(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  rain: Conditions,
): void {
  if (rain === 'dry') {
    g.fillStyle(0xf2b632, 1);
    g.fillCircle(x, y, 7);
    g.lineStyle(2, 0xf2b632, 1);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      g.lineBetween(
        x + Math.cos(a) * 9,
        y + Math.sin(a) * 9,
        x + Math.cos(a) * 12,
        y + Math.sin(a) * 12,
      );
    }
    return;
  }
  const cloud = rain === 'heavy' ? 0x4a5560 : 0x8a97a3;
  g.fillStyle(cloud, 1);
  g.fillCircle(x - 6, y, 6);
  g.fillCircle(x + 1, y - 4, 7);
  g.fillCircle(x + 8, y, 6);
  g.fillRect(x - 6, y, 14, 6);
  if (rain === 'moderate') {
    g.fillStyle(0x3f86b0, 1);
    for (const dx of [-5, 1, 7]) g.fillRect(x + dx, y + 8, 2, 5);
  }
  if (rain === 'heavy') {
    g.fillStyle(0xf2c94c, 1);
    g.fillTriangle(x + 1, y + 6, x - 4, y + 14, x + 1, y + 13);
    g.fillTriangle(x + 1, y + 13, x + 5, y + 12, x, y + 20);
  }
}
