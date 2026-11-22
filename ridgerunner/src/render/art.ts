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

/** Moss from above: a long, sinuous salamander body (not three stacked blobs), a distinctly
 * wider head, four small splayed legs, and a tapering tail — cuter and warmer-toned than the
 * old placeholder, still a code-drawn silhouette in the style of a Pacific Northwest woodland
 * salamander (an Ensatina or Pacific giant salamander build, not a newt or a lizard; see
 * docs/SCIENCE.md for what Moss's real-world counterpart, the Cascade torrent salamander,
 * actually looks like — this is a gameplay-readable abstraction of that general body type, not
 * a claim about its exact proportions). Faces +x (heading 0); origin sits near MOSS_ORIGIN_X.
 */
function drawMoss(g: Phaser.GameObjects.Graphics, step: number): void {
  const wig = step ? 1 : -1; // a gentle one-pixel undulation along the spine as it walks

  // a soft warm halo under the body gives it presence against the forest floor
  g.fillStyle(0xd9b27c, 0.16).fillEllipse(23, 14, 40, 20);

  // the tail-to-head spine, drawn as a chain of overlapping circles that taper at the tail and
  // widen gently into the body, so the silhouette reads as one long sinuous animal
  const spine: [number, number, number][] = [
    [3, 14, 1.6],
    [6.5, 14 + wig * 0.6, 2.4],
    [10, 14 - wig * 0.4, 3.2],
    [14, 14 + wig * 0.5, 4],
    [18.5, 14 - wig * 0.3, 4.6],
    [23, 14 + wig * 0.3, 4.8],
    [27.5, 14, 4.7],
    [32, 14, 4.3],
    [36, 14, 3.8],
  ];
  const BODY = 0x8a5a36;
  const BODY_LIGHT = 0x9c6b42;
  const BODY_DARK = 0x6e4529;
  g.fillStyle(BODY, 1);
  for (const [x, y, r] of spine) g.fillCircle(x, y, r);

  // the head: a distinctly wider, rounder shape than the body, the clearest "salamander, not a
  // blob" cue at this scale
  g.fillStyle(BODY_LIGHT, 1).fillEllipse(40, 14, 11, 10);
  g.fillStyle(BODY, 1).fillEllipse(38.5, 14, 7.6, 8.4);

  // a lighter dorsal stripe catching the light along the spine, and a warm belly-side shadow
  g.fillStyle(0xb98a52, 0.85).fillEllipse(22, 12.4, 28, 2.6);
  g.fillStyle(BODY_DARK, 0.35).fillEllipse(22, 17, 30, 3.2);

  // scattered darker speckles along the back, the way a real salamander's dorsal pattern breaks
  // up its silhouette
  g.fillStyle(BODY_DARK, 1);
  for (const [x, y] of [
    [10, 12.5],
    [14.5, 16],
    [19, 11.5],
    [23.5, 16.5],
    [28, 12],
    [32.5, 16],
  ] as const)
    g.fillCircle(x, y, 1.1);

  // four small splayed legs: front pair tucked just behind the head, back pair mid-body, each
  // drawn as a short outward-angled limb with a tiny rounded foot, animated in diagonal pairs
  g.lineStyle(2, 0x5a4226, 1);
  const legs: [number, number, number, number][] = [
    // [attachX, attachY, footX, footY]
    [34.5, 10.5, 37.5 + wig, 5.5], // front-left
    [34.5, 17.5, 37.5 + wig, 22.5], // front-right
    [19, 10.2, 15 - wig, 5], // back-left
    [19, 17.8, 15 - wig, 23], // back-right
  ];
  for (const [ax, ay, fx, fy] of legs) {
    g.lineBetween(ax, ay, fx, fy);
    g.fillStyle(0x5a4226, 1).fillCircle(fx, fy, 1.4);
  }

  // big, expressive, cuter eyes near the top of the head, each with a tiny bright highlight
  for (const ey of [11.2, 16.8]) {
    g.fillStyle(0x1c1410, 1).fillCircle(42.5, ey, 2.1);
    g.fillStyle(0xf5e9d6, 0.9).fillCircle(41.8, ey - 0.6, 0.7);
  }
}

/** Fraction along the moss texture's width where its logical position (and rotation pivot)
 * sits — near mid-body, slightly head-ward, matching how the collision circle in systems/game.ts
 * tracks Moss's centre of mass rather than its visual nose. */
export const MOSS_ORIGIN_X = 0.46;

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

/** A fallen log: bark grain, cut-end rings, a sunlit edge, and a couple of tiny pale-green
 * seedling sprouts along the top. Fallen, decaying logs like this are where a good share of
 * new conifer growth in Pacific Northwest old-growth forest actually starts — a real "nurse
 * log" (see docs/SCIENCE.md). */
function drawLog(g: Phaser.GameObjects.Graphics, seed: number): void {
  g.fillStyle(PALETTE.terracotta, 1).fillRect(0, 0, 32, 32);
  g.fillStyle(0x6a4228, 1).fillRect(0, 10, 32, 12);
  g.fillStyle(0x8a5a3a, 1).fillRect(0, 12, 32, 8);
  g.lineStyle(1, 0x5a3620, 0.7);
  for (let x = 2; x < 32; x += 6) g.lineBetween(x + (seed % 3), 12, x + (seed % 3) - 2, 20);
  g.lineStyle(1, 0xc08a5a, 0.5).lineBetween(0, 12, 32, 12);
  g.fillStyle(0x3d6b4f, 0.5).fillRect(2, 2, 6, 3).fillRect(22, 26, 6, 3);
  const sprout = seed === 0 ? 9 : 20;
  g.lineStyle(1, 0x5f9158, 0.9)
    .lineBetween(sprout, 10, sprout, 6)
    .lineBetween(sprout + 3, 10, sprout + 3, 7);
  g.fillStyle(0x6fae63, 0.9)
    .fillCircle(sprout, 6, 1)
    .fillCircle(sprout + 3, 7, 0.8);
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

// --- Per-level biome set-dressing ------------------------------------------------------------
// Each hand-built level's visual environment is grounded in a real Pacific Northwest setting
// (see docs/SCIENCE.md, "Backdrop / set-dressing notes", for exactly what's verified vs. a
// labelled stylistic choice per biome below). Streams, moisture rules and the barrier shape stay
// the same everywhere; only decorative texture detail changes by biome.

/** A small fern frond: three to four short angled blades off a stem, the way sword fern reads
 * at this scale. Grounded: western sword fern (Polystichum munitum) is one of the most common
 * understory plants in westside Pacific Northwest conifer forests (see docs/SCIENCE.md). */
function fern(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number): void {
  g.lineStyle(1, color, 0.85);
  for (const [dx, dy] of [
    [-3, -2],
    [-1, -3],
    [1, -3],
    [3, -2],
  ] as const)
    g.lineBetween(x, y, x + dx, y + dy);
}

/** Headwater forest floor (levels 1-2): the base forest floor plus sword-fern fronds in the
 * shaded understory. */
function drawFloorHeadwater(g: Phaser.GameObjects.Graphics, seed: number): void {
  drawFloor(g, seed);
  const spots =
    seed === 0
      ? [
          [12, 18],
          [25, 6],
        ]
      : [
          [4, 12],
          [20, 25],
        ];
  for (const [x, y] of spots as [number, number][]) fern(g, x, y, 0x3d6b4f);
}

/** End of the Line's upland floor: drier, paler humus with scattered leaf litter instead of
 * ferns — the ground past where the stream network reaches. A stylistic choice (the game does
 * not claim a specific measured moisture gradient here), not a cited fact. */
function drawFloorUpland(g: Phaser.GameObjects.Graphics, seed: number): void {
  g.fillStyle(0x2c3f2e, 1).fillRect(0, 0, 32, 32);
  for (let i = 0; i < 20; i++) {
    const x = Math.floor(hash(seed + 5, i) * 32);
    const y = Math.floor(hash(seed + 55, i) * 32);
    g.fillStyle(hash(seed + 92, i) > 0.5 ? 0x4a4530 : 0x3a3826, 0.6).fillRect(x, y, 2, 2);
  }
  const litter =
    seed === 0
      ? [
          [8, 9],
          [23, 22],
          [16, 14],
        ]
      : [
          [27, 7],
          [5, 24],
          [19, 19],
        ];
  g.fillStyle(0x7a6440, 0.7);
  for (const [x, y] of litter as [number, number][]) g.fillRect(x, y, 2, 1);
  const pebble = seed === 0 ? [21, 20] : [9, 10];
  g.fillStyle(0x4c453a, 0.7).fillCircle(pebble[0]!, pebble[1]!, 1.6);
}

/** Ridge-crossing floor: paler, a little drier at the ridge's edge, a few pale grass tufts
 * instead of ferns — approaching the open crossing on either side. Stylistic set dressing. */
function drawFloorRidge(g: Phaser.GameObjects.Graphics, seed: number): void {
  g.fillStyle(0x33432f, 1).fillRect(0, 0, 32, 32);
  for (let i = 0; i < 22; i++) {
    const x = Math.floor(hash(seed + 7, i) * 32);
    const y = Math.floor(hash(seed + 57, i) * 32);
    g.fillStyle(hash(seed + 93, i) > 0.5 ? 0x4a5c3f : 0x2a3a26, 0.6).fillRect(x, y, 2, 2);
  }
  const tufts =
    seed === 0
      ? [
          [6, 22],
          [22, 7],
        ]
      : [
          [26, 20],
          [11, 5],
        ];
  g.fillStyle(0x9ba86a, 0.7);
  for (const [x, y] of tufts as [number, number][])
    g.fillRect(x, y, 1, 4).fillRect(x + 2, y + 1, 1, 3);
}

/** Floodplain / valley-bottom floor: warmer and a little more open than a shaded headwater
 * floor, with the odd river cobble, consistent with a wider, sunnier lower reach (see
 * docs/SCIENCE.md, Vannote et al. 1980). The exact look is still a stylistic choice. */
function drawFloorFloodplain(g: Phaser.GameObjects.Graphics, seed: number): void {
  g.fillStyle(0x2e4330, 1).fillRect(0, 0, 32, 32);
  for (let i = 0; i < 22; i++) {
    const x = Math.floor(hash(seed + 9, i) * 32);
    const y = Math.floor(hash(seed + 59, i) * 32);
    g.fillStyle(hash(seed + 94, i) > 0.5 ? 0x3c5a3f : 0x24381f, 0.6).fillRect(x, y, 2, 2);
  }
  const cobbles =
    seed === 0
      ? [
          [10, 20, 2.2],
          [24, 10, 1.6],
        ]
      : [
          [18, 24, 2],
          [6, 8, 1.8],
        ];
  for (const [x, y, r] of cobbles as [number, number, number][]) {
    g.fillStyle(0x8a8470, 0.6).fillCircle(x, y, r);
    g.fillStyle(0xa8a28c, 0.4).fillCircle(x - r * 0.3, y - r * 0.3, r * 0.4);
  }
}

/** Headwater moss patches (levels 1-2): heavier, more layered clumps than the plain default,
 * dressed with a couple of pale draping fronds — the look of moss hanging thick off a
 * bigleaf maple's branches, which carries the heaviest moss load of any Pacific Northwest tree
 * (see docs/SCIENCE.md). */
function drawMossHeadwater(g: Phaser.GameObjects.Graphics, seed: number): void {
  drawMossPatch(g, seed);
  g.lineStyle(1, 0x9fb28a, 0.6);
  const drapes =
    seed === 0
      ? [
          [14, 6],
          [24, 14],
        ]
      : [
          [9, 16],
          [22, 5],
        ];
  for (const [x, y] of drapes as [number, number][]) {
    g.lineBetween(x, y, x - 1, y + 6);
    g.lineBetween(x + 2, y, x + 1, y + 7);
  }
}

/** Ridge-saddle moss: thinner soil at the ridgeline, so smaller, sparser clumps than the
 * headwater version. Stylistic. */
function drawMossRidge(g: Phaser.GameObjects.Graphics, seed: number): void {
  g.fillStyle(PALETTE.moss, 1).fillRect(0, 0, 32, 32);
  const clumps =
    seed === 0
      ? [
          [11, 12, 3.2],
          [21, 19, 3.6],
        ]
      : [
          [9, 20, 3],
          [22, 9, 3.4],
        ];
  for (const [x, y, r] of clumps as [number, number, number][]) {
    g.fillStyle(0x4c6244, 0.5).fillCircle(x + 1, y + 1, r);
    g.fillStyle(0x5f7a54, 1).fillCircle(x, y, r);
    g.fillStyle(0x8aa078, 0.8).fillCircle(x - r * 0.3, y - r * 0.3, r * 0.4);
  }
}

/** A sunlit ridge clearing: the default clearing plus a small stump silhouette, read as a
 * disturbance opening. A stylistic choice — the game does not assert a specific logging
 * history for this spot, only that an open, sun-exposed patch like this drains Moss fast. */
function drawClearingRidge(g: Phaser.GameObjects.Graphics, seed: number): void {
  drawClearing(g, seed);
  const stump = seed === 0 ? [9, 22] : [23, 9];
  g.fillStyle(0x6a4e32, 0.8).fillCircle(stump[0]!, stump[1]!, 3.4);
  g.lineStyle(1, 0x4a3420, 0.6).strokeCircle(stump[0]!, stump[1]!, 2);
  g.fillStyle(0x8a6a44, 0.5).fillCircle(stump[0]! - 1, stump[1]! - 1, 1.2);
}

/** A floodplain clearing: brighter and a little cooler than the ridge clearing, with river
 * cobbles instead of a stump — the open ground of a wider valley bottom rather than a cut
 * opening. Stylistic set dressing on top of the verified wider/sunnier-downstream premise. */
function drawClearingFloodplain(g: Phaser.GameObjects.Graphics, seed: number): void {
  g.fillStyle(0xeee7cf, 1).fillRect(0, 0, 32, 32);
  for (let i = 0; i < 10; i++) {
    const x = Math.floor(hash(seed + 11, i) * 32);
    const y = Math.floor(hash(seed + 61, i) * 32);
    g.fillStyle(hash(seed + 96, i) > 0.5 ? 0xdcd4b4 : 0xc7bd98, 0.7).fillRect(x, y, 2, 2);
  }
  const cobbles =
    seed === 0
      ? [
          [21, 20, 2.6],
          [8, 9, 2],
        ]
      : [
          [11, 23, 2.2],
          [25, 8, 1.8],
        ];
  for (const [x, y, r] of cobbles as [number, number, number][]) {
    g.fillStyle(0x9a9078, 0.7).fillCircle(x, y, r);
    g.fillStyle(0xb8ae90, 0.5).fillCircle(x - r * 0.3, y - r * 0.3, r * 0.4);
  }
  g.fillStyle(0xf3ead0, 0.4).fillCircle(seed === 0 ? 20 : 10, seed === 0 ? 20 : 12, 5);
}

export type BiomeName = 'headwater' | 'end-of-stream' | 'ridge' | 'floodplain';
export const BIOMES: BiomeName[] = ['headwater', 'end-of-stream', 'ridge', 'floodplain'];

/** Which texture key a biome-aware tile kind should use. Falls back to the plain default art
 * (used by Beyond the Divide, which has no stated biome) when no biome is given. */
export function biomeTileKey(
  kind: 'floor' | 'moss' | 'clearing',
  biome: BiomeName | undefined,
): string {
  return biome ? `tile-${kind}-${biome}` : `tile-${kind}`;
}

/** The draw function behind each biome's variant of a given tile kind, falling back to the
 * plain default look where this biome has no dedicated decoration for that kind. */
const BIOME_DRAW: Record<
  BiomeName,
  Partial<
    Record<'floor' | 'moss' | 'clearing', (g: Phaser.GameObjects.Graphics, seed: number) => void>
  >
> = {
  headwater: { floor: drawFloorHeadwater, moss: drawMossHeadwater },
  'end-of-stream': { floor: drawFloorUpland },
  ridge: { floor: drawFloorRidge, moss: drawMossRidge, clearing: drawClearingRidge },
  floodplain: {
    floor: drawFloorFloodplain,
    moss: drawMossHeadwater,
    clearing: drawClearingFloodplain,
  },
};

export function makeArt(scene: Phaser.Scene): void {
  for (let step = 0; step < 2; step++) tex(scene, `moss-${step}`, 46, 28, (g) => drawMoss(g, step));

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

  // biome-specific variants for the five campaign levels (see docs/SCIENCE.md for what's
  // verified vs. a stylistic choice in each). Beyond the Divide has no biome and keeps the
  // plain default art above.
  const defaults: Record<
    'floor' | 'moss' | 'clearing',
    (g: Phaser.GameObjects.Graphics, seed: number) => void
  > = {
    floor: drawFloor,
    moss: drawMossPatch,
    clearing: drawClearing,
  };
  for (const biome of BIOMES) {
    for (const kind of ['floor', 'moss', 'clearing'] as const) {
      const draw = BIOME_DRAW[biome][kind] ?? defaults[kind];
      const key = biomeTileKey(kind, biome);
      tex(scene, key, 32, 32, (g) => draw(g, 0));
      tex(scene, `${key}-1`, 32, 32, (g) => draw(g, 1));
    }
  }

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
