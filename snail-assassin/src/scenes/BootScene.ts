import Phaser from 'phaser';
import { CHARACTERS } from '../characters';
import type { CharacterConfig } from '../characters/types';
import { PALETTE } from '../config/gameConfig';
import { outlineTexture } from '../utils/outline';

type Draw = (g: Phaser.GameObjects.Graphics) => void;

// Placeholder pixel art drawn in code. Swap in real images later under the same keys.
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    for (const c of CHARACTERS) {
      if (c.id === 'octopus')
        this.makeTexture(`player-${c.id}`, 16, 16, (g) => drawOctopusPlayer(g, c));
      // Glaucus is the same blue shark species that threatens Cipher, now playable: reuse that
      // exact drawing rather than a second, slightly different shark (see docs/SCIENCE.md).
      else if (c.id === 'blueshark') this.makeTexture(`player-${c.id}`, 20, 11, drawSharkThreat);
      else this.makeTexture(`player-${c.id}`, 16, 9, (g) => drawConeSnail(g, c as SnailCharacter));
    }
    const fishColors = [PALETTE.fishA, PALETTE.fishB, PALETTE.fishC];
    fishColors.forEach((color, i) =>
      this.makeTexture(`fish-${i}`, 8, 5, (g) => drawFish(g, color)),
    );
    // Cipher's prey: scattered individual cone snails (see src/systems/hunt.ts: prey: 'snail').
    const preySnailColors = [PALETTE.preySnailA, PALETTE.preySnailB, PALETTE.preySnailC];
    preySnailColors.forEach((color, i) =>
      this.makeTexture(`snailprey-${i}`, 7, 6, (g) => drawConeSnailPrey(g, color)),
    );
    // Glaucus's prey: scattered individual squid (see src/systems/hunt.ts: prey: 'squid').
    const preySquidColors = [PALETTE.preySquidA, PALETTE.preySquidB, PALETTE.preySquidC];
    preySquidColors.forEach((color, i) =>
      this.makeTexture(`squidprey-${i}`, 8, 6, (g) => drawSquidPrey(g, color)),
    );
    // Threat sprites: 'octopus' threatens the three snail characters, 'shark' threatens Cipher,
    // 'orca' threatens Glaucus (drawn once, instantiated up to TUNING.orcaPod.size times).
    this.makeTexture('octopus', 16, 16, drawOctopusThreat);
    this.makeTexture('shark', 20, 11, drawSharkThreat);
    this.makeTexture('orca', 30, 16, drawOrcaThreat);
    this.makeTexture('px', 1, 1, (g) => {
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 1, 1);
    });
    for (const key of [
      ...CHARACTERS.map((c) => `player-${c.id}`),
      'fish-0',
      'fish-1',
      'fish-2',
      'snailprey-0',
      'snailprey-1',
      'snailprey-2',
      'squidprey-0',
      'squidprey-1',
      'squidprey-2',
      'octopus',
      'shark',
      'orca',
    ]) {
      outlineTexture(this, key);
    }
    const { scene, data } = this.devStart();
    this.scene.start(scene, data);
  }

  private makeTexture(key: string, w: number, h: number, draw: Draw): void {
    const g = this.add.graphics();
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  // Dev shortcuts like ?scene=Hunt&char=catalyst. Production always starts at the splash.
  private devStart(): { scene: string; data: object } {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('scene');
    const known = requested !== null && this.scene.get(requested) !== null;
    if (!import.meta.env.DEV || !known) return { scene: 'Splash', data: {} };
    return {
      scene: requested,
      data: { characterId: params.get('char') ?? 'atlas', mode: 'gallery' },
    };
  }
}

type SnailCharacter = CharacterConfig & { id: 'catalyst' | 'atlas' | 'nightshade' };

// Top-down cone snail facing right: low spire, wide shoulder, tapered shell, siphon in front.
function drawConeSnail(g: Phaser.GameObjects.Graphics, c: SnailCharacter): void {
  const { shell, pattern, body, accent } = c.palette;
  g.fillStyle(body, 1); // foot
  g.fillRect(4, 2, 10, 5);
  g.fillStyle(shell, 1); // shoulder + tapering body whorl
  g.fillRect(2, 1, 4, 7);
  g.fillTriangle(5, 1, 13, 4, 5, 7);
  g.fillRect(5, 1, 6, 7);
  g.fillTriangle(10, 1, 13, 4, 10, 7);
  g.fillStyle(pattern, 1);
  g.fillRect(1, 3, 2, 3); // low spire
  const marks: Record<SnailCharacter['id'], [number, number, number, number][]> = {
    // Catalyst: sharp angular bands.
    catalyst: [
      [3, 1, 1, 7],
      [6, 1, 1, 7],
      [9, 2, 1, 5],
      [4, 4, 4, 1],
    ],
    // Atlas: blotchy "map" markings.
    atlas: [
      [4, 2, 2, 1],
      [7, 2, 2, 1],
      [8, 5, 2, 1],
      [5, 5, 2, 1],
      [10, 3, 2, 1],
      [6, 3, 2, 1],
    ],
    // Nightshade: soft translucent streaks.
    nightshade: [
      [3, 2, 7, 1],
      [4, 5, 6, 1],
      [8, 3, 1, 2],
    ],
  };
  for (const [x, y, w, h] of marks[c.id]) g.fillRect(x, y, w, h);
  g.fillStyle(accent, 1); // siphon
  g.fillRect(14, 4, 2, 1);
}

// Top-down playable octopus facing right: trailing arms, rounded mantle, forward-facing eyes.
function drawOctopusPlayer(g: Phaser.GameObjects.Graphics, c: CharacterConfig): void {
  const { body, pattern, accent } = c.palette;
  g.fillStyle(pattern, 1); // arms trailing behind (to the left)
  for (let i = 0; i < 6; i++) {
    const y = 3 + i * 2;
    g.fillRect(1, y, 7 + ((i * 3) % 4), 1);
  }
  g.fillStyle(body, 1); // mantle
  g.fillEllipse(10, 8, 11, 9);
  g.fillStyle(pattern, 1); // two spots (the species' namesake eyespots)
  g.fillCircle(7, 5, 1);
  g.fillCircle(7, 11, 1);
  g.fillStyle(accent, 1); // forward-facing eyes
  g.fillRect(12, 5, 2, 1);
  g.fillRect(12, 10, 2, 1);
}

function drawFish(g: Phaser.GameObjects.Graphics, color: number): void {
  g.fillStyle(color, 1);
  g.fillEllipse(4.5, 2.5, 6, 4);
  g.fillTriangle(0, 0, 2, 2.5, 0, 5);
  g.fillStyle(0x10202a, 1);
  g.fillRect(6, 2, 1, 1);
}

// Top-down cone snail prey facing right: compact foot, tapering shell wedge, small siphon tip.
// Generic (not one of the three playable species), used only as Cipher's scattered reef prey.
function drawConeSnailPrey(g: Phaser.GameObjects.Graphics, shell: number): void {
  g.fillStyle(0x5f5240, 1); // foot
  g.fillEllipse(2, 3, 3.5, 3.5);
  g.fillStyle(shell, 1); // tapering shell
  g.fillTriangle(2, 0, 6, 3, 2, 6);
  g.fillStyle(0x10202a, 1); // siphon tip
  g.fillRect(6, 2, 1, 2);
}

// Top-down squid prey facing right: tail fin trailing behind (left), torpedo mantle, trailing
// tentacles ahead (right), matching the "front faces right" convention of the other prey
// sprites. Generic (not identified to species), used only as Glaucus's scattered squid prey.
function drawSquidPrey(g: Phaser.GameObjects.Graphics, color: number): void {
  g.fillStyle(color, 1); // tail fin, pointed rearward (left)
  g.fillTriangle(0, 3, 3, 0, 3, 6);
  g.fillStyle(color, 1); // torpedo mantle
  g.fillEllipse(4, 3, 4, 3.5);
  g.fillStyle(0x10202a, 1); // eye
  g.fillRect(5, 2, 1, 1);
  g.fillStyle(color, 1); // trailing tentacles, ahead (to the right)
  for (let i = 0; i < 3; i++) g.fillRect(6 + i, 2 + (i % 2), 1, 1);
}

// Top-down octopus threat: round mantle, two eyes, eight arms. Faces up; HuntScene rotates it by
// heading + 90deg to match.
function drawOctopusThreat(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0x9b3f5a, 1);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.fillRect(Math.round(8 + Math.cos(a) * 5) - 1, Math.round(8 + Math.sin(a) * 5) - 1, 2, 2);
    g.fillRect(Math.round(8 + Math.cos(a) * 7) - 1, Math.round(8 + Math.sin(a) * 7) - 1, 1, 1);
  }
  g.fillStyle(0xc4566f, 1);
  g.fillCircle(8, 8, 4);
  g.fillStyle(0xfff2c8, 1);
  g.fillRect(9, 6, 2, 1);
  g.fillRect(9, 9, 2, 1);
}

// Top-down shark threat facing right: tapered torpedo body with a pointed snout, a swept dorsal
// fin, paired pectoral fins, a heterocercal tail (longer upper lobe), and gill slits behind the
// head, so it reads as a shark rather than a generic fish silhouette. Blue shark palette
// (dark slate-blue back, pale belly) — see docs/SCIENCE.md for the species citation.
function drawSharkThreat(g: Phaser.GameObjects.Graphics): void {
  const back = 0x4a6a82;
  const shade = 0x33495e;
  g.fillStyle(back, 1); // main torpedo body, tapering toward the tail
  g.fillEllipse(9, 5, 12, 5.5);
  g.fillTriangle(14, 2.5, 19, 5, 14, 7.5); // pointed snout
  g.fillStyle(shade, 1); // tail fin: longer upper lobe (heterocercal), like a real shark's
  g.fillTriangle(1, 5, 6, 0, 6, 5);
  g.fillTriangle(1, 5, 5, 8, 6, 5);
  g.fillStyle(shade, 1); // dorsal fin, swept back
  g.fillTriangle(8, 4, 11, 0, 12, 4.5);
  g.fillStyle(back, 1); // pectoral fins, flanking the body
  g.fillTriangle(10, 2.5, 13, 0.5, 11, 3.5);
  g.fillTriangle(10, 7.5, 13, 9.5, 11, 6.5);
  g.fillStyle(0xeef6f3, 1); // pale belly stripe
  g.fillRect(8, 5, 6, 1);
  g.fillStyle(0x10202a, 1); // gill slits, behind the head and ahead of the dorsal fin
  for (let i = 0; i < 3; i++) g.fillRect(11 + i * 1.3, 3, 0.5, 4);
  g.fillStyle(0x10202a, 1); // eye
  g.fillRect(16, 4, 1, 1);
}

// Top-down orca threat facing right, drawn much larger than the shark it threatens (30x16 vs.
// the shark's 20x11 — see HuntScene, where the player's scale is the same for every character,
// so the size difference reads on screen). Iconic black-and-white coloring (saddle patch, eye
// patch, pale belly), a rounded head with no pointed snout, a tall straight dorsal fin, and
// horizontal tail flukes (cetacean, not the shark's vertical tail), so it reads as an orca
// rather than a bigger shark. See docs/SCIENCE.md for the real pack-hunting behaviour this models.
function drawOrcaThreat(g: Phaser.GameObjects.Graphics): void {
  const black = 0x15181c;
  const white = 0xeef6f3;
  const grey = 0x6b7278;
  g.fillStyle(black, 1); // main body, rounded head (no pointed snout, unlike the shark threat)
  g.fillEllipse(15, 8, 24, 9);
  g.fillStyle(white, 1); // pale belly
  g.fillEllipse(14, 10.5, 16, 3);
  g.fillStyle(white, 1); // saddle patch, just behind where the dorsal fin meets the body
  g.fillEllipse(9, 6, 4, 2.2);
  g.fillStyle(white, 1); // eye patch, above and behind the eye
  g.fillEllipse(22, 6, 3, 1.6);
  g.fillStyle(black, 1); // eye
  g.fillRect(23, 6, 1, 1);
  g.fillStyle(grey, 1); // tail flukes: horizontal, like a cetacean's, not vertical like a shark's
  g.fillTriangle(0, 8, 5, 4, 5, 8);
  g.fillTriangle(0, 8, 5, 12, 5, 8);
  g.fillStyle(black, 1); // tall, straight dorsal fin — the single most recognisable orca feature
  g.fillTriangle(11, 4, 13, 0, 16, 4);
  g.fillStyle(black, 1); // pectoral fin, paddle-shaped (not pointed, unlike the shark's)
  g.fillEllipse(17, 12, 5, 2);
}
