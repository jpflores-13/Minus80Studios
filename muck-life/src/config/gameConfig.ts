import Phaser from 'phaser';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

/** The MUCK LIFE palette (flexible guidelines from the art direction brief). */
export const PALETTE = {
  mud: 0x28231f,
  sediment: 0x5b4839,
  cattail: 0x688c55,
  root: 0xc6ad84,
  mint: 0x70dab8,
  cyan: 0x80dce3,
  amber: 0xe8bd72,
  cream: 0xf4e8ce,
  ink: 0x14110e,
  panel: 0x1f1b17,
  coral: 0xe0866e,
  text: '#f4e8ce',
  textDim: '#c6ad84',
  textAmber: '#e8bd72',
  textMint: '#70dab8',
  textCyan: '#80dce3',
  textCoral: '#e0866e',
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
    backgroundColor: PALETTE.mud,
    antialias: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { gamepad: true, activePointers: 2 },
    scene: scenes,
  };
}
