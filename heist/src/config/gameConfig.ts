import Phaser from 'phaser';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const ZOOM = 1.6;

/** Mid-century spy palette from the brief. */
export const PALETTE = {
  navy: 0x14232b,
  sage: 0x829a8d,
  cream: 0xe8e3d3,
  gold: 0xedc77d,
  terracotta: 0xc56553,
  mint: 0x65e3bd,
  ink: 0x0b141a,
  floor: 0x22343d,
  floorLight: 0x2b414b,
  wall: 0x0f1a20,
  corridor: 0x3a3226,
  accent: 0x22343d,
  text: '#e8e3d3',
  textDim: '#829a8d',
  textGold: '#edc77d',
  textRed: '#e88472',
  textMint: '#65e3bd',
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
    antialias: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { gamepad: true },
    scene: scenes,
  };
}
