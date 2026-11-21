import Phaser from 'phaser';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const ZOOM = 1.4;

export const PALETTE = {
  forest: 0x213d32,
  moss: 0x78966b,
  stream: 0x629bac,
  slate: 0x52656c,
  terracotta: 0xb57955,
  cream: 0xe9e3d1,
  charcoal: 0x252e2a,
  ink: 0x14201a,
  gold: 0xd9b27c,
  text: '#e9e3d1',
  textDim: '#9fb09a',
  textGold: '#d9b27c',
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
