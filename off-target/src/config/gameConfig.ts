import Phaser from 'phaser';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
/** World pixels are drawn this many times larger. */
export const ZOOM = 3;

/** Retro palette: navy and purple world, golden heroes, violet and red machines, mint and turquoise power. */
export const PALETTE = {
  night: 0x0d0a1f,
  navy: 0x161235,
  purple: 0x2a1b4d,
  purpleLight: 0x3d2a6e,
  membrane: 0x5a3f8f,
  membraneLight: 0x8a6cc4,
  gold: 0xf2b632,
  goldLight: 0xffe28a,
  amber: 0xe39a3b,
  violet: 0x7a3fc4,
  magenta: 0xb23a6b,
  red: 0xd6334a,
  mint: 0x9ff0d0,
  turquoise: 0x4fe0c0,
  dna1: 0x58c4f0,
  dna2: 0xf06c9b,
  white: 0xf4f0ff,
  ink: 0x080614,
  accent: 0x3d2a6e,
  text: '#f4f0ff',
  textDim: '#b8acd8',
  textGold: '#ffe28a',
  textRed: '#ff8095',
  textMint: '#9ff0d0',
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
    backgroundColor: PALETTE.night,
    pixelArt: true,
    roundPixels: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { gamepad: true },
    scene: scenes,
  };
}
