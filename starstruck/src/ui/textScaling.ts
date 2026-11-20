import Phaser from 'phaser';

// Large-text setting: every text object the game creates goes through this, so one switch
// makes all of it bigger without touching each scene.
type TextFactory = (
  x: number,
  y: number,
  text: string | string[],
  style?: Phaser.Types.GameObjects.Text.TextStyle,
) => Phaser.GameObjects.Text;

export function installTextScaling(getScale: () => number): void {
  const proto = Phaser.GameObjects.GameObjectFactory.prototype as unknown as { text: TextFactory };
  const original = proto.text;
  proto.text = function (this: unknown, x, y, text, style) {
    const scale = getScale();
    if (scale === 1) return original.call(this, x, y, text, style);
    const scaled = { ...style };
    const size = style?.fontSize ?? '16px';
    const px = typeof size === 'number' ? size : parseFloat(size);
    scaled.fontSize = `${Math.round(px * scale)}px`;
    return original.call(this, x, y, text, scaled);
  };
}
