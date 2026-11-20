import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { OBJECTS, type Material } from '../content/objects';
import { isIdentified, type GameState } from '../systems/game';
import { nosePoint, RAYS, rayLength } from '../systems/senses';

// Draws what Diggy feels: the star, its touch marks and anything recognised. A screen picture of
// touch: a fictional translation, not how the mole perceives the world.

const MARK_COLOR: Record<string, number> = {
  worm: PALETTE.coral,
  larva: PALETTE.amber,
  beetle: 0x8fb0d0,
  rock: PALETTE.sand,
  root: PALETTE.green,
  soil: 0x8a6a52,
  stone: 0x9aa0aa,
};

/** One mark, shaped by material so nothing depends on colour alone. */
function drawMark(
  g: Phaser.GameObjects.Graphics,
  material: string,
  x: number,
  y: number,
  a: number,
  big: boolean,
): void {
  const c = MARK_COLOR[material] ?? PALETTE.white;
  const s = big ? 1.5 : 1;
  g.fillStyle(c, a).lineStyle(1.5, c, a);
  switch ((OBJECTS[material as Material]?.mark ?? material) as string) {
    case 'soft':
      g.fillCircle(x, y, 2.4 * s);
      break;
    case 'segmented':
      g.fillRect(x - 2.5 * s, y - 1, 5 * s, 2);
      break;
    case 'hard':
      g.fillTriangle(x, y - 3 * s, x + 3 * s, y, x, y + 3 * s).fillTriangle(
        x,
        y - 3 * s,
        x - 3 * s,
        y,
        x,
        y + 3 * s,
      );
      break;
    case 'rough':
      g.lineBetween(x - 2.5 * s, y - 2.5 * s, x + 2.5 * s, y + 2.5 * s).lineBetween(
        x + 2.5 * s,
        y - 2.5 * s,
        x - 2.5 * s,
        y + 2.5 * s,
      );
      break;
    case 'fibrous':
      g.lineBetween(x - 3 * s, y, x + 3 * s, y);
      break;
    case 'stone':
      g.fillRect(x - 1.5, y - 1.5, 3, 3);
      break;
    default:
      g.fillCircle(x, y, 1.2);
  }
}

export function drawSenses(
  g: Phaser.GameObjects.Graphics,
  s: GameState,
  focus: boolean,
  time: number,
  reduced: boolean,
  memoryScale: number,
): void {
  g.clear();
  const now = s.time;

  // touch marks, fading with time
  for (const m of s.memory.marks) {
    const a = Math.max(0, 1 - (now - m.time) / (s.memory.memory * memoryScale));
    if (a <= 0) continue;
    drawMark(g, m.material, m.x, m.y, a * (m.resolution > 0.5 ? 1 : 0.8), m.resolution > 0.5);
  }

  // anything recognised: its outline pieced together, plus a sign that reads without colour
  for (const t of s.things) {
    if (!t.alive || !isIdentified(s, t)) continue;
    const def = OBJECTS[t.material];
    const c = MARK_COLOR[t.material] ?? PALETTE.white;
    g.lineStyle(2, c, 0.85);
    let top = { x: 0, y: 0 };
    if (t.shape.kind === 'circle') {
      g.strokeCircle(t.shape.c.x, t.shape.c.y, t.shape.r);
      top = { x: t.shape.c.x, y: t.shape.c.y - t.shape.r - 8 };
    } else {
      g.strokePoints(t.shape.points.map((p) => new Phaser.Math.Vector2(p.x, p.y)));
      const p = t.shape.points[0];
      if (p) top = { x: p.x, y: p.y - 10 };
    }
    // prey: a little star; not food: a cross
    if (def.edible) {
      const pulse = reduced ? 1 : 1 + Math.sin(time / 120) * 0.15;
      g.fillStyle(PALETTE.amber, 1);
      const pts: Phaser.Math.Vector2[] = [];
      for (let k = 0; k < 10; k++) {
        const rr = (k % 2 ? 2 : 5) * pulse;
        const ang = -Math.PI / 2 + (k * Math.PI) / 5;
        pts.push(new Phaser.Math.Vector2(top.x + Math.cos(ang) * rr, top.y + Math.sin(ang) * rr));
      }
      g.fillPoints(pts, true);
    } else {
      g.lineStyle(2, PALETTE.white, 0.8)
        .lineBetween(top.x - 3, top.y - 3, top.x + 3, top.y + 3)
        .lineBetween(top.x + 3, top.y - 3, top.x - 3, top.y + 3);
    }
  }

  // the star: 22 fleshy rays, each twitching out on its tap and glowing when it touches
  const n = nosePoint(s.mole);
  RAYS.forEach((ray, i) => {
    const contact = s.lastContacts[i];
    const a = s.mole.heading + ray.angle;
    const reach =
      rayLength(ray, focus) *
      (contact
        ? contact.dist / rayLength(ray, focus)
        : 0.55 + (reduced ? 0 : Math.sin(time / 60 + i * 1.7) * 0.12));
    const len = Math.max(5, Math.min(rayLength(ray, focus), reach));
    const ex = n.x + Math.cos(a) * len;
    const ey = n.y + Math.sin(a) * len;
    const fovea = ray.number === 11;
    g.lineStyle(
      fovea ? 3 : 2,
      contact ? PALETTE.coral : PALETTE.rose,
      contact ? 1 : 0.85,
    ).lineBetween(n.x, n.y, ex, ey);
    g.fillStyle(contact ? 0xffe0e4 : PALETTE.rose, 1).fillCircle(ex, ey, fovea ? 2 : 1.4);
  });
  g.fillStyle(PALETTE.coral, 1).fillCircle(n.x, n.y, 3);
}
