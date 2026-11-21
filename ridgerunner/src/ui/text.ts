import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';

const SANS = 'system-ui, -apple-system, "Segoe UI", sans-serif';

export const TEXT_STYLES = {
  display: { fontFamily: SANS, fontSize: '72px', fontStyle: 'bold', color: PALETTE.textGold },
  title: { fontFamily: SANS, fontSize: '40px', fontStyle: 'bold', color: PALETTE.text },
  hud: { fontFamily: SANS, fontSize: '20px', fontStyle: 'bold', color: PALETTE.text },
  body: { fontFamily: SANS, fontSize: '22px', color: PALETTE.text },
  small: { fontFamily: SANS, fontSize: '17px', color: PALETTE.text },
  hint: { fontFamily: SANS, fontSize: '17px', color: PALETTE.textDim },
} satisfies Record<string, Phaser.Types.GameObjects.Text.TextStyle>;

export function addCenteredText(
  scene: Phaser.Scene,
  y: number,
  text: string,
  style: Phaser.Types.GameObjects.Text.TextStyle,
): Phaser.GameObjects.Text {
  return scene.add.text(scene.scale.width / 2, y, text, style).setOrigin(0.5);
}
