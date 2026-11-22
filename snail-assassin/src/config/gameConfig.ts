import Phaser from 'phaser';

/** Logical resolution. Phaser scales this to fit any screen (desktop, iPad, cabinet). */
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

/** Pixel-art scale: placeholder sprites are drawn tiny and enlarged with crisp nearest-neighbour filtering. */
export const PIXEL = 4;

/** Studio-wide placeholder palette. See docs/ART_DIRECTION.md. */
export const PALETTE = {
  navy: 0x06192b,
  deep: 0x0a2a3f,
  teal: 0x165a66,
  sand: 0xcdb58a,
  sandDark: 0xb39a70,
  sandLight: 0xe2cfa4,
  rock: 0x4a5560,
  rockDark: 0x2c343c,
  coral: 0xe0715a,
  coralPink: 0xf0a08a,
  coralGold: 0xe8b04a,
  seagrass: 0x4f8a4a,
  seagrassLight: 0x79b06a,
  snow: 0xcfe9ef,
  fishA: 0xf2c94c,
  fishB: 0x8ec5e8,
  fishC: 0xf28c6a,
  // Cipher's prey: generic wild cone snails (not any of the three playable species), scattered
  // individually across the reef. Muted/earthy so they read as camouflaged, unlike the bright
  // schooling reef fish above.
  preySnailA: 0xbfa06a,
  preySnailB: 0x9c8a66,
  preySnailC: 0x7e8a6a,
  text: '#eef6f3',
  textDim: '#9fc0c8',
  textWarm: '#f3d9a4',
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
    backgroundColor: PALETTE.navy,
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: scenes,
  };
}
