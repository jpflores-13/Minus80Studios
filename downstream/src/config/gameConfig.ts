import Phaser from 'phaser';

/** Logical resolution. Phaser scales this to fit any screen (desktop, iPad, cabinet). */
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

/** Placeholder palette — see docs/ART_DIRECTION.md. */
export const PALETTE = {
  land: 0x3d5a3a,
  water: 0x2f6f8f,
  waterLight: 0x5fa3bf,
  bottle: 0xf2f2f2,
  bag: 0xf0c94a,
  fragment: 0xe0715a,
  text: '#f4f7f2',
  textDim: '#cfe0cf',
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
    backgroundColor: PALETTE.land,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: scenes,
  };
}
