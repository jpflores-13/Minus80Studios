import Phaser from 'phaser';

/** Logical resolution. Phaser scales this to fit any screen (desktop, iPad, cabinet). */
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

/** Placeholder palette — see docs/ART_DIRECTION.md. */
export const PALETTE = {
  abyss: 0x041a2b,
  seabed: 0x0b2e3f,
  shell: 0xe8c07d,
  shellStripe: 0x7a4b24,
  body: 0xd7746f,
  snow: 0xbfe3ee,
  text: '#e6f4f1',
  textDim: '#7fa8b5',
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
    backgroundColor: PALETTE.abyss,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: scenes,
  };
}
