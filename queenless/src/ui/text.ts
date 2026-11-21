import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';

const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Storybook serif for headings and the HUD; plain sans for longer reading. */
export const TEXT_STYLES = {
  display: { fontFamily: SERIF, fontSize: '88px', fontStyle: 'bold', color: PALETTE.textGold },
  title: { fontFamily: SERIF, fontSize: '42px', fontStyle: 'bold', color: PALETTE.text },
  hud: { fontFamily: SERIF, fontSize: '20px', fontStyle: 'bold', color: PALETTE.text },
  body: { fontFamily: SANS, fontSize: '22px', color: PALETTE.text },
  small: { fontFamily: SANS, fontSize: '17px', color: PALETTE.text },
  hint: { fontFamily: SANS, fontSize: '17px', color: PALETTE.textDim },
  label: { fontFamily: SERIF, fontSize: '18px', fontStyle: 'bold', color: PALETTE.text },
} satisfies Record<string, Phaser.Types.GameObjects.Text.TextStyle>;

export function addCenteredText(
  scene: Phaser.Scene,
  y: number,
  text: string,
  style: Phaser.Types.GameObjects.Text.TextStyle,
): Phaser.GameObjects.Text {
  return scene.add.text(scene.scale.width / 2, y, text, style).setOrigin(0.5);
}
