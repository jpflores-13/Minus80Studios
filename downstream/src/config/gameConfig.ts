import Phaser from 'phaser';

/** Logical resolution. Phaser scales this to fit any screen (desktop, iPad, cabinet). */
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
/** Height of the bottom equipment toolbar. The map uses the space above it. */
export const TOOLBAR_HEIGHT = 104;
/** Pixel-art scale for code-generated placeholder sprites. */
export const PIXEL = 3;

/** Placeholder palette: forest greens, river blues, earth tones, cream UI. See docs/ART_DIRECTION.md. */
export const PALETTE = {
  grass: 0x6f9a52,
  grassDark: 0x5c8445,
  grassLight: 0x86b062,
  bank: 0x8a7a55,
  water: 0x3f86b0,
  waterLight: 0x8cc6df,
  ocean: 0x2c6a96,
  road: 0xb9ab8c,
  roof: 0xb5523b,
  wall: 0xf1e3c6,
  tree: 0x3f6b35,
  cream: 0xf4ead2,
  creamDark: 0xe2d3ae,
  ink: 0x2d2a26,
  accent: 0x2f8f6f,
  warn: 0xd9603b,
  gpsPink: 0xff4fa3,
  bottle: 0xf6f6f0,
  bag: 0xf2c94c,
  wrapper: 0xe0715a,
  text: '#2d2a26',
  textLight: '#fbf6ea',
  textDim: '#6b6253',
} as const;

export function createGameConfig(
  parent: string,
  scenes: Phaser.Types.Scenes.SceneType[],
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: PALETTE.grass,
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: scenes,
  };
}
