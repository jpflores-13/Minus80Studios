import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { clearExpedition } from '../config/progress';
import { Menu, type MenuItem } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

const PHI = (1 + Math.sqrt(5)) / 2;

/** A unit icosahedron's 12 vertices — a stand-in "molecule," not a real structure. */
function icosahedron(): Vec3[] {
  const pts: Vec3[] = [];
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      pts.push({ x: 0, y: sx * 1, z: sy * PHI });
      pts.push({ x: sx * 1, y: sy * PHI, z: 0 });
      pts.push({ x: sx * PHI, y: 0, z: sy * 1 });
    }
  }
  return pts;
}

function edges(points: Vec3[]): [number, number][] {
  const list: [number, number][] = [];
  const dist = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if (dist(points[i]!, points[j]!) < 2.1) list.push([i, j]);
    }
  }
  return list;
}

/**
 * Reveals a rotating, deliberately simplified placeholder shape after a successful RECONSTRUCT
 * round. This is illustrative only, never presented as an actual reconstructed structure.
 */
export class ReconstructRevealScene extends Phaser.Scene {
  private angle = 0;
  private graphics!: Phaser.GameObjects.Graphics;
  private points = icosahedron();
  private edgeList = edges(this.points);

  constructor() {
    super('ReconstructReveal');
  }

  create(data: { campaignIndex?: number } = {}): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.ink).fadeIn(300);
    addCenteredText(this, 90, 'STRUCTURE RECOVERED', {
      ...TEXT_STYLES.title,
      color: PALETTE.textMint,
    });
    addCenteredText(
      this,
      130,
      'Illustrative only — a real reconstruction averages thousands of particle images.',
      { ...TEXT_STYLES.hint, align: 'center', wordWrap: { width: width - 200 } },
    );
    this.graphics = this.add.graphics();
    this.angle = 0;

    const items: MenuItem[] = [];
    if (data.campaignIndex !== undefined) {
      clearExpedition(data.campaignIndex);
      items.push({
        label: () => 'CONTINUE',
        action: () => this.scene.start('ExpeditionIntro', { index: data.campaignIndex! + 1 }),
      });
    } else {
      items.push({
        label: () => 'RECONSTRUCT AGAIN',
        action: () => this.scene.start('Reconstruct'),
      });
    }
    items.push({ label: () => 'TITLE', action: () => this.scene.start('Title') });

    new Menu(this, items, width / 2, height - 100, 420, 58, () => this.scene.start('Title'));
    sound.playSong('title');
  }

  override update(_time: number, delta: number): void {
    this.angle += (delta / 1000) * 0.6;
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2 - 20;
    const scale = 90;
    const projected = this.points.map((p) => {
      const cosA = Math.cos(this.angle);
      const sinA = Math.sin(this.angle);
      const x = p.x * cosA - p.z * sinA;
      const z = p.x * sinA + p.z * cosA;
      const depth = 4 / (4 + z);
      return { x: cx + x * scale * depth, y: cy + p.y * scale * depth, depth };
    });

    this.graphics.clear();
    for (const [a, b] of this.edgeList) {
      const pa = projected[a]!;
      const pb = projected[b]!;
      const alpha = Math.min(1, (pa.depth + pb.depth) / 2.6);
      this.graphics.lineStyle(2, PALETTE.glacier, alpha);
      this.graphics.lineBetween(pa.x, pa.y, pb.x, pb.y);
    }
    for (const p of projected) {
      this.graphics.fillStyle(PALETTE.mint, Math.min(1, p.depth));
      this.graphics.fillCircle(p.x, p.y, 4 * p.depth);
    }
  }
}
