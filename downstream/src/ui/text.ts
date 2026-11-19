import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';

const SANS = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Shared text styles. Large, high-contrast defaults for readability on any screen. */
export const TEXT_STYLES = {
  display: { fontFamily: 'Georgia, serif', fontSize: '88px', color: PALETTE.textLight },
  title: { fontFamily: 'Georgia, serif', fontSize: '52px', color: PALETTE.text },
  body: { fontFamily: SANS, fontSize: '22px', color: PALETTE.text },
  bodyLight: { fontFamily: SANS, fontSize: '22px', color: PALETTE.textLight },
  small: { fontFamily: SANS, fontSize: '18px', color: PALETTE.text },
  smallLight: { fontFamily: SANS, fontSize: '18px', color: PALETTE.textLight },
  label: { fontFamily: SANS, fontSize: '16px', color: PALETTE.textLight, fontStyle: 'bold' },
  hint: { fontFamily: SANS, fontSize: '20px', color: PALETTE.textDim },
} satisfies Record<string, Phaser.Types.GameObjects.Text.TextStyle>;

export function addCenteredText(
  scene: Phaser.Scene,
  y: number,
  text: string,
  style: Phaser.Types.GameObjects.Text.TextStyle,
): Phaser.GameObjects.Text {
  return scene.add.text(scene.scale.width / 2, y, text, style).setOrigin(0.5);
}
