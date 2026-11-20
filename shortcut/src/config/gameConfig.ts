import Phaser from 'phaser';

/** Logical resolution. Phaser scales this to fit any screen. */
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

/** Cozy city palette: cream, sage, terracotta, golden machines, slate checkpoints. */
export const PALETTE = {
  cream: 0xf3ead8,
  creamDark: 0xe4d6b8,
  sage: 0x9db89a,
  sageDark: 0x6f8f6c,
  terracotta: 0xc8664a,
  terracottaDark: 0x9c4a33,
  road: 0x6e6a63,
  roadLine: 0xf3ead8,
  gold: 0xe0a526,
  goldDark: 0x8a5d08,
  slate: 0x44586b,
  slateLight: 0xc6d2dc,
  ink: 0x2d2a26,
  accent: 0x44586b,
  bread: 0xd9a05b,
  power: 0x3f7fc4,
  oldTown: 0xead9c0,
  works: 0xd3dde2,
  sky: 0xf7f1e4,
  text: '#2d2a26',
  textLight: '#fbf6ea',
  textDim: '#5d564b',
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
    backgroundColor: PALETTE.sky,
    antialias: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: scenes,
  };
}
