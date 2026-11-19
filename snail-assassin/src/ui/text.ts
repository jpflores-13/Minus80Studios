import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';

/** Shared text styles. Large, high-contrast defaults for readability on any screen. */
export const TEXT_STYLES = {
  title: { fontFamily: 'Georgia, serif', fontSize: '72px', color: PALETTE.text },
  body: { fontFamily: 'system-ui, sans-serif', fontSize: '24px', color: PALETTE.text },
  hint: { fontFamily: 'system-ui, sans-serif', fontSize: '20px', color: PALETTE.textDim },
} satisfies Record<string, Phaser.Types.GameObjects.Text.TextStyle>;

export function addCenteredText(
  scene: Phaser.Scene,
  y: number,
  text: string,
  style: Phaser.Types.GameObjects.Text.TextStyle,
): Phaser.GameObjects.Text {
  return scene.add.text(scene.scale.width / 2, y, text, style).setOrigin(0.5);
}
