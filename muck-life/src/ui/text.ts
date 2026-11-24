import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';

// Rounded, organic display type for headings; plain sans for reading.
const DISPLAY =
  '"Trebuchet MS", "Avenir Next Rounded", "Arial Rounded MT Bold", system-ui, sans-serif';
const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export const TEXT_STYLES = {
  display: { fontFamily: DISPLAY, fontSize: '96px', fontStyle: 'bold', color: PALETTE.text },
  title: { fontFamily: DISPLAY, fontSize: '42px', fontStyle: 'bold', color: PALETTE.text },
  hud: { fontFamily: DISPLAY, fontSize: '22px', fontStyle: 'bold', color: PALETTE.text },
  body: { fontFamily: SANS, fontSize: '21px', color: PALETTE.text, lineSpacing: 6 },
  small: { fontFamily: SANS, fontSize: '17px', color: PALETTE.text, lineSpacing: 4 },
  hint: { fontFamily: SANS, fontSize: '16px', color: PALETTE.textDim },
  label: { fontFamily: DISPLAY, fontSize: '18px', fontStyle: 'bold', color: PALETTE.text },
} satisfies Record<string, Phaser.Types.GameObjects.Text.TextStyle>;

export function addCenteredText(
  scene: Phaser.Scene,
  y: number,
  text: string,
  style: Phaser.Types.GameObjects.Text.TextStyle,
): Phaser.GameObjects.Text {
  return scene.add.text(scene.scale.width / 2, y, text, style).setOrigin(0.5);
}
