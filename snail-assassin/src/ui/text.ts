import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';

/** Shared text styles. Large, high-contrast defaults for readability on any screen. */
const SANS = 'system-ui, -apple-system, "Segoe UI", sans-serif';
// A dark outline keeps text readable over the bright reef (it's invisible on dark menus).
const OUTLINE = { stroke: '#06192b', strokeThickness: 4 };
export const TEXT_STYLES = {
  display: { fontFamily: 'Georgia, serif', fontSize: '84px', color: PALETTE.text },
  title: { fontFamily: 'Georgia, serif', fontSize: '56px', color: PALETTE.text },
  body: { ...OUTLINE, fontFamily: SANS, fontSize: '24px', color: PALETTE.text },
  hud: { ...OUTLINE, fontFamily: SANS, fontSize: '22px', color: PALETTE.text },
  small: { ...OUTLINE, fontFamily: SANS, fontSize: '18px', color: PALETTE.text },
  hint: { ...OUTLINE, fontFamily: SANS, fontSize: '20px', color: PALETTE.textDim },
  warm: { ...OUTLINE, fontFamily: SANS, fontSize: '22px', color: PALETTE.textWarm },
} satisfies Record<string, Phaser.Types.GameObjects.Text.TextStyle>;

export function addCenteredText(
  scene: Phaser.Scene,
  y: number,
  text: string,
  style: Phaser.Types.GameObjects.Text.TextStyle,
): Phaser.GameObjects.Text {
  return scene.add.text(scene.scale.width / 2, y, text, style).setOrigin(0.5);
}
