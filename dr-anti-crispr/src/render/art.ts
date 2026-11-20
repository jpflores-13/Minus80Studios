import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { outlineTexture } from '../utils/outline';

// Every sprite is drawn here in code, at pixel scale, and shown 3× larger. Load a PNG under the
// same key to replace any of them.

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
const v = (x: number, y: number) => new Phaser.Math.Vector2(x, y);

/** The doctor: a capsid head with its genome glowing inside, arms with launchers, fibre legs. */
function drawDoctor(g: Phaser.GameObjects.Graphics, health: number, step: number): void {
  const gold = PALETTE.gold;
  const amber = PALETTE.amber;
  // head: an angular, see-through capsid
  const head = [v(8, 1), v(16, 1), v(21, 6), v(21, 14), v(16, 19), v(8, 19), v(3, 14), v(3, 6)];
  g.fillStyle(0x3a2a6e, 0.9).fillPoints(head, true);
  g.lineStyle(1, gold, 1).strokePoints(head, true);
  g.lineStyle(1, amber, 0.6)
    .lineBetween(8, 1, 12, 10)
    .lineBetween(16, 1, 12, 10)
    .lineBetween(3, 14, 12, 10)
    .lineBetween(21, 14, 12, 10);
  // the genome: a coil that breaks up as integrity drops
  const coil = [
    [6, 5],
    [8, 4],
    [10, 6],
    [12, 5],
    [14, 7],
    [16, 6],
    [18, 8],
    [16, 10],
    [14, 9],
    [12, 11],
    [10, 10],
    [8, 12],
    [6, 11],
    [8, 14],
    [10, 13],
    [12, 15],
    [14, 14],
    [16, 16],
  ];
  const keep = Math.round(coil.length * Math.max(0, health));
  coil.forEach(([x, y], i) => {
    if (i >= keep && i % 2 === 0) return; // gaps where damage has broken it
    px(g, i < keep ? PALETTE.mint : 0x7a6a9a, x ?? 0, y ?? 0, 2, 1);
  });
  // eyes behind the glass, and a scientist's goggles band
  px(g, gold, 5, 7, 14, 1);
  px(g, PALETTE.white, 7, 8, 3, 3);
  px(g, PALETTE.white, 14, 8, 3, 3);
  px(g, PALETTE.ink, 8, 9, 2, 2);
  px(g, PALETTE.ink, 15, 9, 2, 2);
  // collar and tail sheath
  px(g, amber, 9, 19, 6, 2);
  px(g, gold, 10, 21, 4, 7);
  for (let y = 22; y < 28; y += 2) px(g, amber, 10, y, 4, 1);
  // mechanical arms with launchers
  px(g, 0xc8c0e0, 3, 22, 7, 2);
  px(g, 0xc8c0e0, 14, 22, 7, 2);
  px(g, PALETTE.turquoise, 0, 20, 4, 4);
  px(g, PALETTE.turquoise, 20, 20, 4, 4);
  // baseplate and tail fibres (they step as it walks)
  px(g, gold, 7, 28, 10, 2);
  g.lineStyle(1, PALETTE.white, 1);
  const s = step % 2 === 0 ? 1 : -1;
  g.lineBetween(8, 30, 3, 34 + s).lineBetween(3, 34 + s, 1, 36);
  g.lineBetween(10, 30, 8, 35 - s);
  g.lineBetween(14, 30, 16, 35 + s);
  g.lineBetween(16, 30, 21, 34 - s).lineBetween(21, 34 - s, 23, 36);
}

function drawEnemy(g: Phaser.GameObjects.Graphics, kind: string, frame: number): void {
  const jaw = frame ? 2 : 0;
  switch (kind) {
    case 'cutter': {
      g.fillStyle(0xd6334a, 1).fillEllipse(12, 10, 20, 16);
      px(g, PALETTE.white, 7, 6, 3, 3);
      px(g, PALETTE.white, 14, 6, 3, 3);
      px(g, PALETTE.ink, 8, 7, 2, 2);
      px(g, PALETTE.ink, 14, 7, 2, 2);
      g.fillStyle(0xe8e8f4, 1)
        .fillTriangle(6, 16, 11, 16, 6 - jaw, 23)
        .fillTriangle(13, 16, 18, 16, 18 + jaw, 23);
      break;
    }
    case 'stalker': {
      g.fillStyle(0x9b4fd6, 1).fillCircle(10, 11, 8);
      px(g, PALETTE.white, 6, 7, 8, 7);
      g.fillStyle(PALETTE.red, 1).fillCircle(10 + jaw - 1, 10, 2.5);
      g.lineStyle(1, 0x9b4fd6, 1).lineBetween(10, 3, 6, 0).lineBetween(10, 3, 14, 0);
      for (let x = 4; x < 18; x += 4) px(g, 0x6a2fa0, x, 18, 2, 3);
      break;
    }
    case 'twinblade': {
      g.fillStyle(0xc23ab0, 1).fillRect(7, 7, 10, 10);
      g.lineStyle(3, 0xe8e8f4, 1);
      g.lineBetween(2, 2 + jaw, 22, 22 - jaw).lineBetween(22, 2 + jaw, 2, 22 - jaw);
      px(g, PALETTE.ink, 10, 10, 4, 4);
      px(g, PALETTE.white, 11, 11, 1, 1);
      break;
    }
    case 'shredder': {
      g.fillStyle(0x8f1f3a, 1).fillRoundedRect(3, 2, 26, 22, 5);
      g.fillStyle(0xd6334a, 1).fillRect(3, 10, 26, 4);
      for (let x = 4 + jaw; x < 28; x += 4)
        g.fillStyle(0xe8e8f4, 1).fillTriangle(x, 24, x + 3, 24, x + 1.5, 29);
      px(g, PALETTE.white, 8, 5, 4, 3);
      px(g, PALETTE.white, 20, 5, 4, 3);
      px(g, PALETTE.ink, 10, 6, 2, 2);
      px(g, PALETTE.ink, 20, 6, 2, 2);
      break;
    }
    case 'swarm': {
      g.fillStyle(0xe0607a, 1).fillTriangle(1, 10, 6, 1, 11, 10);
      px(g, PALETTE.white, 5, 5, 2, 2);
      break;
    }
    case 'commander': {
      g.fillStyle(0x6a3fd6, 1).fillEllipse(14, 16, 26, 20);
      g.fillStyle(PALETTE.gold, 1)
        .fillTriangle(6, 7, 9, 1, 12, 7)
        .fillTriangle(11, 7, 14, 0, 17, 7)
        .fillTriangle(16, 7, 19, 1, 22, 7);
      px(g, PALETTE.white, 8, 12, 5, 4);
      px(g, PALETTE.white, 16, 12, 5, 4);
      px(g, PALETTE.ink, 10, 13, 2, 2);
      px(g, PALETTE.ink, 17, 13, 2, 2);
      g.lineStyle(1, PALETTE.red, 1).lineBetween(9, 21, 19, 21 - jaw);
      break;
    }
  }
}

function drawMegacutter(g: Phaser.GameObjects.Graphics, frame: number): void {
  const jaw = frame ? 4 : 0;
  g.fillStyle(0xa02040, 1).fillEllipse(30, 24, 56, 40);
  g.fillStyle(0xd6334a, 1).fillEllipse(30, 20, 46, 28);
  for (let x = 6; x < 56; x += 8) g.fillStyle(0x6b1f45, 1).fillTriangle(x, 8, x + 4, 0, x + 8, 8);
  px(g, PALETTE.white, 16, 14, 9, 7);
  px(g, PALETTE.white, 35, 14, 9, 7);
  px(g, PALETTE.ink, 20, 16, 4, 4);
  px(g, PALETTE.ink, 36, 16, 4, 4);
  g.fillStyle(0xe8e8f4, 1)
    .fillTriangle(16, 40, 27, 40, 16 - jaw, 56)
    .fillTriangle(33, 40, 44, 40, 44 + jaw, 56);
}

function drawPrime(g: Phaser.GameObjects.Graphics, frame: number): void {
  g.lineStyle(10, 0x6a3fd6, 1).strokeCircle(36, 36, 28);
  g.lineStyle(3, 0x9b7af0, 1).strokeCircle(36, 36, 33);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + frame * 0.2;
    g.fillStyle(i % 2 ? PALETTE.red : 0xe8e8f4, 1).fillCircle(
      36 + Math.cos(a) * 33,
      36 + Math.sin(a) * 33,
      3,
    );
  }
  g.fillStyle(0x2a1b4d, 1).fillCircle(36, 36, 18);
  px(g, PALETTE.white, 27, 30, 7, 6);
  px(g, PALETTE.white, 39, 30, 7, 6);
  px(g, PALETTE.red, 29, 32, 3, 3);
  px(g, PALETTE.red, 41, 32, 3, 3);
}

export function makeArt(scene: Phaser.Scene): void {
  for (let hp = 0; hp <= 4; hp++)
    for (let step = 0; step < 2; step++)
      tex(scene, `doc-${hp}-${step}`, 24, 37, (g) => drawDoctor(g, hp / 4, step));
  tex(scene, 'ally', 24, 37, (g) => drawDoctor(g, 1, 0));
  for (const kind of ['cutter', 'stalker', 'twinblade', 'shredder', 'swarm', 'commander'])
    for (let f = 0; f < 2; f++) {
      const size: Record<string, [number, number]> = {
        cutter: [24, 24],
        stalker: [20, 22],
        twinblade: [24, 24],
        shredder: [32, 30],
        swarm: [12, 11],
        commander: [28, 26],
      };
      const [w, h] = size[kind] ?? [24, 24];
      tex(scene, `${kind}-${f}`, w, h, (g) => drawEnemy(g, kind, f));
    }
  for (let f = 0; f < 2; f++) {
    tex(scene, `megacutter-${f}`, 60, 58, (g) => drawMegacutter(g, f));
    tex(scene, `prime-${f}`, 72, 72, (g) => drawPrime(g, f));
  }

  // projectiles, one shape per weapon
  tex(scene, 'shot-blockade', 8, 8, (g) => {
    g.fillStyle(PALETTE.turquoise, 1).fillRect(1, 1, 6, 4).fillTriangle(1, 5, 7, 5, 4, 8);
  });
  tex(scene, 'shot-lockdown', 8, 8, (g) => {
    g.fillStyle(PALETTE.mint, 1).fillRect(1, 3, 6, 5);
    g.lineStyle(1, PALETTE.mint, 1).strokeRect(2.5, 0.5, 3, 3);
  });
  tex(scene, 'shot-doubleTrouble', 10, 6, (g) => {
    g.lineStyle(2, 0x7fd0ff, 1).strokeCircle(3, 3, 2).strokeCircle(7, 3, 2);
  });
  tex(scene, 'shot-pulse', 10, 10, (g) => {
    g.lineStyle(2, 0xb0ffe8, 1).strokeCircle(5, 5, 4);
  });

  // what an inhibited machine looks like: a shape for each state
  tex(scene, 'fx-blocked', 16, 10, (g) => {
    g.lineStyle(2, PALETTE.turquoise, 1).beginPath().arc(8, 10, 8, Math.PI, 0).strokePath();
  });
  tex(scene, 'fx-locked', 10, 12, (g) => {
    g.lineStyle(2, PALETTE.mint, 1).strokeRect(3, 1, 4, 5);
    g.fillStyle(PALETTE.mint, 1).fillRect(1, 5, 8, 7);
    px(g, PALETTE.ink, 4, 7, 2, 3);
  });
  tex(scene, 'fx-linked', 12, 8, (g) => {
    g.lineStyle(2, 0x7fd0ff, 1).strokeEllipse(4, 4, 7, 6).strokeEllipse(8, 4, 7, 6);
  });
  tex(scene, 'fx-frozen', 12, 12, (g) => {
    g.lineStyle(2, 0xd0f4ff, 1)
      .lineBetween(6, 0, 6, 12)
      .lineBetween(1, 3, 11, 9)
      .lineBetween(1, 9, 11, 3);
  });

  tex(scene, 'protein', 6, 6, (g) => {
    g.fillStyle(PALETTE.amber, 1).fillCircle(3, 3, 3);
    px(g, PALETTE.goldLight, 2, 1, 1, 1);
  });
  tex(scene, 'ribosome', 40, 32, (g) => {
    g.fillStyle(0x5a3f8f, 1).fillEllipse(20, 10, 34, 18);
    g.fillStyle(0x45307a, 1).fillEllipse(20, 22, 40, 18);
    g.fillStyle(0x8a6cc4, 1).fillEllipse(14, 8, 8, 4);
  });
  tex(
    scene,
    'plasmid',
    24,
    24,
    (g) => {
      g.lineStyle(3, 0x3a5f9f, 0.7).strokeCircle(12, 12, 9);
      g.fillStyle(0x8fd0ff, 0.6).fillCircle(12, 3, 2).fillCircle(21, 12, 2);
    },
    false,
  );
  tex(
    scene,
    'speck',
    4,
    4,
    (g) => {
      g.fillStyle(0x6a5aa0, 0.6).fillCircle(2, 2, 2);
    },
    false,
  );
}
