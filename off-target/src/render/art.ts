import Phaser from 'phaser';
import { HEROES, HERO_ORDER, type HeroId } from '../content/characters';
import { PALETTE } from '../config/gameConfig';
import { outlineTexture } from '../utils/outline';

// All sprites are drawn here, pixel by pixel, in code. Replace any of them by loading an image
// under the same texture key; nothing else needs to change.

type Draw = (g: Phaser.GameObjects.Graphics) => void;

function tex(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  draw: Draw,
  outline = true,
): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
  if (outline) outlineTexture(scene, key, '#080614');
}

const px = (g: Phaser.GameObjects.Graphics, c: number, x: number, y: number, w = 1, h = 1) =>
  g.fillStyle(c, 1).fillRect(x, y, w, h);

/** A hero: an angular capsid head with glowing DNA, eyes, little arms and tail-fibre legs. */
function drawHero(g: Phaser.GameObjects.Graphics, id: HeroId, frame: string, hurt = false): void {
  const body = HEROES[id].color;
  const dark = PALETTE.amber;
  const glow = hurt ? 0x6b5a7a : PALETTE.mint;
  // capsid head (hexagon-ish)
  px(g, body, 4, 1, 6, 1);
  px(g, body, 3, 2, 8, 6);
  px(g, body, 4, 8, 6, 1);
  px(g, dark, 3, 7, 8, 1);
  // glass face with the genome inside
  px(g, 0x2b2050, 4, 3, 6, 4);
  px(g, glow, 5, 3, 1, 1);
  px(g, glow, 6, 4, 1, 1);
  px(g, glow, 7, 5, 1, 1);
  px(g, glow, 8, 6, 1, 1);
  // eyes
  px(g, PALETTE.white, 4, 4, 2, 2);
  px(g, PALETTE.white, 8, 4, 2, 2);
  px(g, PALETTE.ink, frame === 'blink' ? 4 : 5, 5, 1, frame === 'blink' ? 0.5 : 1);
  px(g, PALETTE.ink, 9, 5, 1, 1);
  // collar and body
  px(g, dark, 6, 9, 2, 2);
  // arms
  const armUp = frame === 'jump' || frame.startsWith('climb');
  px(g, PALETTE.white, 2, armUp ? 8 : 10, 2, 1);
  px(g, PALETTE.white, 10, armUp ? 8 : 10, 2, 1);
  // tail-fibre legs
  const legs: Record<string, [number, number, number, number]> = {
    idle: [4, 9, 13, 13],
    blink: [4, 9, 13, 13],
    run0: [3, 10, 13, 12],
    run1: [5, 8, 12, 13],
    run2: [4, 9, 13, 13],
    run3: [6, 7, 13, 12],
    jump: [3, 10, 12, 12],
    climb0: [5, 8, 13, 12],
    climb1: [5, 8, 12, 13],
  };
  const [lx, rx, ly, ry] = legs[frame] ?? [4, 9, 13, 13];
  g.lineStyle(1, PALETTE.white, 1);
  g.lineBetween(6, 11, lx, ly);
  g.lineBetween(8, 11, rx + 1, ry);
  px(g, PALETTE.white, lx - 1, ly, 2, 1);
  px(g, PALETTE.white, rx, ry, 2, 1);
  // a badge so heroes differ by shape, not just colour
  if (id === 'block') px(g, PALETTE.white, 1, 9, 2, 3); // shield
  if (id === 'lock') {
    px(g, PALETTE.ink, 10, 9, 3, 2);
    px(g, PALETTE.white, 11, 8, 1, 1);
  }
  if (id === 'freeze') {
    px(g, PALETTE.white, 11, 0, 1, 3);
    px(g, PALETTE.white, 10, 1, 3, 1);
  }
}

const HERO_FRAMES = ['idle', 'blink', 'run0', 'run1', 'run2', 'run3', 'jump', 'climb0', 'climb1'];

/** CHOP: a big machine with two cutting blades and a slot where it holds GUIDE. */
function drawChop(g: Phaser.GameObjects.Graphics, color: number, frame: number): void {
  const dark = 0x6b1f45;
  // body
  g.fillStyle(color, 1).fillRoundedRect(4, 6, 40, 28, 8);
  g.fillStyle(dark, 1).fillRoundedRect(8, 26, 32, 8, 3);
  // lobes
  g.fillStyle(0xd46b98, 1).fillCircle(14, 14, 7).fillCircle(34, 14, 7);
  // eyes
  px(g, PALETTE.white, 11, 11, 6, 5);
  px(g, PALETTE.white, 31, 11, 6, 5);
  px(g, PALETTE.ink, 14, 13, 3, 3);
  px(g, PALETTE.ink, 31, 13, 3, 3);
  // brow: focused, not evil
  px(g, dark, 10, 9, 7, 1);
  px(g, dark, 31, 9, 7, 1);
  // blades open and close
  const open = [3, 1, 0][frame] ?? 0;
  g.fillStyle(0xd8d8e8, 1);
  g.fillTriangle(18, 34, 23, 34, 20 - open, 42);
  g.fillTriangle(25, 34, 30, 34, 28 + open, 42);
  g.fillStyle(PALETTE.red, 1).fillRect(19, 33, 10, 2);
  // feet
  px(g, dark, 8, 34, 6, 3);
  px(g, dark, 34, 34, 6, 3);
}

/** SNIP: smaller, sharper, scissor-like. */
function drawSnip(g: Phaser.GameObjects.Graphics, frame: number): void {
  const c = PALETTE.violet;
  g.fillStyle(c, 1).fillTriangle(4, 30, 20, 4, 36, 30);
  g.fillStyle(0x4b2280, 1).fillRect(8, 24, 24, 6);
  px(g, PALETTE.white, 15, 14, 4, 4);
  px(g, PALETTE.white, 22, 14, 4, 4);
  px(g, PALETTE.ink, 16, 16, 2, 2);
  px(g, PALETTE.ink, 22, 16, 2, 2);
  const swing = [4, 0, 2][frame] ?? 0;
  g.lineStyle(3, 0xd8d8e8, 1);
  g.lineBetween(20, 30, 10 - swing, 38);
  g.lineBetween(20, 30, 30 + swing, 38);
  px(g, PALETTE.red, 18, 28, 4, 4);
}

export function makeArt(scene: Phaser.Scene): void {
  for (const id of HERO_ORDER)
    for (const f of HERO_FRAMES) {
      tex(scene, `${id}-${f}`, 14, 14, (g) => drawHero(g, id, f));
      tex(scene, `${id}-${f}-hurt`, 14, 14, (g) => drawHero(g, id, f, true));
    }
  for (let f = 0; f < 3; f++) {
    tex(scene, `chop-${f}`, 48, 44, (g) => drawChop(g, PALETTE.magenta, f));
    tex(scene, `snip-${f}`, 40, 40, (g) => drawSnip(g, f));
  }
  // GUIDE: a little ribbon that floats beside its machine
  tex(scene, 'guide', 12, 10, (g) => {
    g.fillStyle(0xffa64d, 1).fillEllipse(6, 4, 10, 6);
    px(g, PALETTE.ink, 4, 3, 1, 1);
    px(g, PALETTE.ink, 7, 3, 1, 1);
    g.lineStyle(2, 0xffa64d, 1).lineBetween(6, 7, 3, 9).lineBetween(3, 9, 8, 10);
  });
  // GENE: a strand of DNA lying on the floor, with a face
  tex(scene, 'gene', 40, 12, (g) => {
    for (let x = 0; x < 40; x += 4) {
      const y1 = 5 + Math.round(Math.sin(x / 4) * 3);
      const y2 = 5 - Math.round(Math.sin(x / 4) * 3);
      px(g, PALETTE.dna1, x, y1, 3, 2);
      px(g, PALETTE.dna2, x, y2, 3, 2);
      px(g, PALETTE.white, x + 1, Math.min(y1, y2) + 1, 1, Math.abs(y1 - y2));
    }
    px(g, PALETTE.ink, 17, 4, 1, 1);
    px(g, PALETTE.ink, 21, 4, 1, 1);
  });
  tex(scene, 'gene-cut', 40, 12, (g) => {
    for (let x = 0; x < 40; x += 4) {
      if (x >= 16 && x < 24) continue;
      const y = 5 + Math.round(Math.sin(x / 4) * 3);
      px(g, PALETTE.dna1, x, y, 3, 2);
      px(g, PALETTE.dna2, x, 10 - y, 3, 2);
    }
  });

  // tiles (16×16)
  tex(
    scene,
    'tile-solid',
    16,
    16,
    (g) => {
      px(g, PALETTE.membrane, 0, 0, 16, 16);
      px(g, PALETTE.membraneLight, 0, 0, 16, 2);
      px(g, 0x45307a, 0, 14, 16, 2);
      px(g, PALETTE.membraneLight, 3, 6, 2, 2);
      px(g, PALETTE.membraneLight, 10, 9, 2, 2);
    },
    false,
  );
  tex(scene, 'tile-ledge', 16, 6, (g) => {
    px(g, 0x6f8fd0, 0, 0, 16, 3);
    px(g, 0x3d5a9a, 0, 3, 16, 2);
    px(g, 0xb8ccf0, 2, 0, 2, 1);
    px(g, 0xb8ccf0, 10, 0, 2, 1);
  });
  tex(
    scene,
    'tile-ladder',
    16,
    16,
    (g) => {
      // a cytoskeletal filament: twisted beads
      for (let y = 0; y < 16; y += 4) {
        px(g, 0x9be08a, 4 + (y % 8 === 0 ? 0 : 1), y, 3, 3);
        px(g, 0x5aa04a, 9 - (y % 8 === 0 ? 0 : 1), y + 2, 3, 3);
      }
    },
    false,
  );
  tex(
    scene,
    'tile-spikes',
    16,
    16,
    (g) => {
      px(g, 0x5a1f2e, 0, 10, 16, 6);
      g.fillStyle(PALETTE.red, 1);
      for (let x = 0; x < 16; x += 4) g.fillTriangle(x, 11, x + 2, 2, x + 4, 11);
      g.fillStyle(0xffb0b8, 1);
      for (let x = 0; x < 16; x += 4) g.fillRect(x + 2, 4, 1, 2);
    },
    false,
  );
  tex(
    scene,
    'tile-goo',
    16,
    16,
    (g) => {
      g.fillStyle(0x2e8a7a, 0.45).fillRect(0, 0, 16, 16);
      g.fillStyle(0x7ff0d0, 0.5).fillCircle(4, 5, 2).fillCircle(11, 10, 3).fillCircle(6, 13, 1.5);
    },
    false,
  );
  tex(
    scene,
    'tile-gate',
    16,
    16,
    (g) => {
      // a nuclear pore, closed: a ring with crossing spokes
      px(g, 0x2a5c8f, 0, 0, 16, 16);
      g.lineStyle(2, 0x8fd0ff, 1).strokeCircle(8, 8, 6);
      g.lineBetween(2, 8, 14, 8).lineBetween(8, 2, 8, 14);
    },
    false,
  );
  tex(
    scene,
    'tile-gate-open',
    16,
    16,
    (g) => {
      g.lineStyle(1, 0x8fd0ff, 0.5).strokeCircle(8, 8, 6);
    },
    false,
  );
  tex(
    scene,
    'tile-door',
    16,
    16,
    (g) => {
      px(g, 0x8f6a2a, 0, 0, 16, 16);
      px(g, PALETTE.gold, 2, 2, 12, 12);
      px(g, PALETTE.ink, 7, 5, 2, 3);
      px(g, PALETTE.ink, 6, 8, 4, 3);
    },
    false,
  );
  tex(scene, 'tile-bouncer', 16, 16, (g) => {
    g.fillStyle(0xff8fcf, 0.9).fillEllipse(8, 10, 16, 12);
    g.fillStyle(PALETTE.white, 0.9).fillEllipse(5, 7, 4, 3);
  });

  // pickups and props
  tex(scene, 'bit', 8, 8, (g) => {
    g.fillStyle(PALETTE.turquoise, 1).fillTriangle(4, 0, 8, 4, 4, 8).fillTriangle(4, 0, 0, 4, 4, 8);
    px(g, PALETTE.white, 3, 2, 1, 1);
  });
  tex(scene, 'key', 12, 8, (g) => {
    g.fillStyle(PALETTE.gold, 1).fillCircle(3, 4, 3);
    px(g, PALETTE.gold, 5, 3, 7, 2);
    px(g, PALETTE.gold, 9, 5, 1, 2);
    px(g, PALETTE.gold, 11, 5, 1, 2);
    px(g, PALETTE.ink, 2, 3, 2, 2);
  });
  const badge = (key: string, color: number, draw: Draw) =>
    tex(scene, key, 12, 12, (g) => {
      g.fillStyle(color, 1).fillCircle(6, 6, 6);
      draw(g);
    });
  badge('sprint', 0x3fae5a, (g) => {
    g.fillStyle(PALETTE.white, 1).fillTriangle(3, 3, 7, 6, 3, 9).fillTriangle(6, 3, 10, 6, 6, 9);
  });
  badge('shield', 0x3f7fd6, (g) => {
    g.fillStyle(PALETTE.white, 1).fillRect(3, 3, 6, 4).fillTriangle(3, 7, 9, 7, 6, 10);
  });
  badge('doubleJump', 0xd06bd6, (g) => {
    g.fillStyle(PALETTE.white, 1).fillTriangle(2, 9, 6, 2, 6, 9).fillTriangle(6, 2, 10, 9, 6, 9);
  });
  badge('slowMotion', 0xd6a23f, (g) => {
    g.fillStyle(PALETTE.white, 1).fillTriangle(3, 2, 9, 2, 6, 6).fillTriangle(3, 10, 9, 10, 6, 6);
  });
  tex(scene, 'roller', 12, 12, (g) => {
    g.fillStyle(0x8a2a3a, 1).fillCircle(6, 6, 6);
    g.fillStyle(PALETTE.red, 1).fillCircle(6, 6, 4);
    px(g, PALETTE.white, 3, 3, 2, 2);
    px(g, PALETTE.ink, 5, 5, 2, 2);
  });
  tex(scene, 'checkpoint', 10, 22, (g) => {
    px(g, 0xb8acd8, 1, 0, 2, 22);
    g.fillStyle(PALETTE.mint, 1).fillTriangle(3, 1, 10, 5, 3, 9);
  });
  tex(scene, 'checkpoint-off', 10, 22, (g) => {
    px(g, 0xb8acd8, 1, 0, 2, 22);
    g.fillStyle(0x5a5070, 1).fillTriangle(3, 1, 10, 5, 3, 9);
  });
  tex(scene, 'pod', 16, 24, (g) => {
    g.fillStyle(0x2a1b4d, 1).fillRoundedRect(1, 2, 14, 21, 6);
    g.lineStyle(2, PALETTE.gold, 1).strokeRoundedRect(1, 2, 14, 21, 6);
    g.fillStyle(PALETTE.mint, 0.5).fillRoundedRect(4, 6, 8, 12, 3);
  });
  tex(scene, 'shock', 16, 8, (g) => {
    g.fillStyle(0xffd0f0, 0.9).fillTriangle(0, 8, 8, 0, 16, 8);
  });

  // background specks
  tex(
    scene,
    'blob',
    24,
    18,
    (g) => {
      g.fillStyle(0x3d2a6e, 0.6).fillEllipse(12, 9, 24, 18);
      g.fillStyle(0x5a3f8f, 0.6).fillEllipse(9, 7, 8, 5);
    },
    false,
  );
  tex(
    scene,
    'ribosome',
    22,
    16,
    (g) => {
      g.fillStyle(0x4a3a7a, 0.7).fillEllipse(11, 5, 18, 10);
      g.fillStyle(0x3a2d66, 0.7).fillEllipse(11, 11, 22, 10);
    },
    false,
  );
  tex(
    scene,
    'chromatin',
    32,
    32,
    (g) => {
      g.lineStyle(2, 0x6a3f8f, 0.5);
      const pts = Array.from(
        { length: 16 },
        (_, i) => new Phaser.Math.Vector2(i * 2, 16 + Math.sin(i * 0.9) * 10),
      );
      g.strokePoints(pts);
      g.fillStyle(0x8a5fb0, 0.5);
      for (const p of pts.filter((_, i) => i % 3 === 0)) g.fillCircle(p.x, p.y, 2.5);
    },
    false,
  );
}
