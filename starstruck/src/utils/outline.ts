import type Phaser from 'phaser';

// Adds a 1-pixel dark outline around a generated sprite texture, so it stands out from any
// background (sand, grass, water) for low-vision and colour-blind players. The texture grows
// by 1 pixel on each side.
export function outlineTexture(scene: Phaser.Scene, key: string, color = '#10202a'): void {
  const source = scene.textures.get(key).getSourceImage() as CanvasImageSource & {
    width: number;
    height: number;
  };
  const w = source.width + 2;
  const h = source.height + 2;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.drawImage(source, 1, 1);
  const img = ctx.getImageData(0, 0, w, h);
  const px = img.data;
  const opaque = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < w && y < h && (px[(y * w + x) * 4 + 3] ?? 0) > 40;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
  const edge: number[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (opaque(x, y)) continue;
      if (opaque(x - 1, y) || opaque(x + 1, y) || opaque(x, y - 1) || opaque(x, y + 1))
        edge.push(y * w + x);
    }
  }
  for (const i of edge) {
    px[i * 4] = r ?? 0;
    px[i * 4 + 1] = g ?? 0;
    px[i * 4 + 2] = b ?? 0;
    px[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  scene.textures.remove(key);
  scene.textures.addCanvas(key, canvas);
}
