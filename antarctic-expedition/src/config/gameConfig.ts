import Phaser from 'phaser';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

/** Southern Ocean palette from the brief. */
export const PALETTE = {
  midnight: 0x071e2d,
  marine: 0x123d55,
  glacier: 0x8ac6d4,
  ice: 0xe6f4f5,
  mint: 0x68e3b2,
  amber: 0xf2c978,
  gold: 0xf2c978,
  coral: 0xe58b78,
  ink: 0x040f17,
  accent: 0x123d55,
  text: '#e6f4f5',
  textDim: '#8ac6d4',
  textAmber: '#f2c978',
  textGold: '#f2c978',
  textCoral: '#e58b78',
  textMint: '#68e3b2',
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
    backgroundColor: PALETTE.midnight,
    antialias: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { gamepad: true },
    scene: scenes,
  };
}
