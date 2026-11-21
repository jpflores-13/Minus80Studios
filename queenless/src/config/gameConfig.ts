import Phaser from 'phaser';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const ZOOM = 2;

/** Honey gold, moss green, warm amber, earthy brown, cream: the storybook palette from the brief. */
export const PALETTE = {
  night: 0x241a10,
  earth: 0x5a3f28,
  earthLight: 0x7a5a3a,
  moss: 0x7a9b5c,
  mossDark: 0x4f6a3c,
  honey: 0xe8b84b,
  honeyLight: 0xf6d98a,
  amber: 0xd98e3f,
  cream: 0xf6ead0,
  ink: 0x1a120a,
  rose: 0xd97a7a,
  sky: 0x8fb9d0,
  accent: 0x5a3f28,
  text: '#f6ead0',
  textDim: '#b89a6e',
  textGold: '#e8b84b',
  textRed: '#d97a7a',
  textMoss: '#9bc27a',
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
    antialias: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { gamepad: true },
    scene: scenes,
  };
}
