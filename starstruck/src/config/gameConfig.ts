import Phaser from 'phaser';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
/** World pixels are drawn this much larger. */
export const ZOOM = 2;

/** Underground palette from the brief. */
export const PALETTE = {
  charcoal: 0x171c22,
  soil: 0x49362c,
  sand: 0xc9ab86,
  rose: 0xd98d98,
  coral: 0xf0a9a9,
  amber: 0xebc478,
  green: 0x829e86,
  teal: 0x214b59,
  ink: 0x0c0f13,
  accent: 0x49362c,
  white: 0xf6eee2,
  text: '#f6eee2',
  textDim: '#c9ab86',
  textAmber: '#ebc478',
  textRose: '#f0a9a9',
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
    backgroundColor: PALETTE.charcoal,
    pixelArt: true,
    roundPixels: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { gamepad: true },
    scene: scenes,
  };
}
