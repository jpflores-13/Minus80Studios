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
      else this.makeTexture(`player-${c.id}`, 16, 9, (g) => drawConeSnail(g, c as SnailCharacter));
    }
    const fishColors = [PALETTE.fishA, PALETTE.fishB, PALETTE.fishC];
    fishColors.forEach((color, i) =>
      this.makeTexture(`fish-${i}`, 8, 5, (g) => drawFish(g, color)),
    );
    // Threat sprites: 'octopus' threatens the three snail characters, 'shark' threatens Cipher.
    this.makeTexture('octopus', 16, 16, drawOctopusThreat);
    this.makeTexture('shark', 18, 10, drawSharkThreat);
    this.makeTexture('px', 1, 1, (g) => {
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 1, 1);
    });
    for (const key of [
      ...CHARACTERS.map((c) => `player-${c.id}`),
      'fish-0',
      'fish-1',
      'fish-2',
      'octopus',
      'shark',
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

// Top-down shark threat facing right: torpedo body, dorsal fin, tail fin.
function drawSharkThreat(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0x6b7b85, 1); // body
  g.fillEllipse(8, 5, 13, 5);
  g.fillStyle(0x4d5a62, 1); // dorsal fin
  g.fillTriangle(7, 5, 10, 0, 11, 5);
  g.fillStyle(0x4d5a62, 1); // tail fin
  g.fillTriangle(0, 5, 3, 1, 3, 9);
  g.fillStyle(0xeef6f3, 1); // belly highlight
  g.fillRect(9, 6, 5, 1);
  g.fillStyle(0x10202a, 1); // eye
  g.fillRect(14, 4, 1, 1);
}
