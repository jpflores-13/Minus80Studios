import type { Colormap } from '../config/progress';

// Heatmap colour scales for the optode view. The colours are an imaging representation of oxygen
// concentration — oxygen does not glow in mud. All three scales increase monotonically in
// lightness, so they read correctly in greyscale and for colour-blind players.

export const LEGEND_MAX = 40;

type Stop = [number, number, number, number]; // t, r, g, b

const STOPS: Record<Colormap, Stop[]> = {
  // Muck palette: deep mud → deep teal → oxygen mint → optode cyan → warm cream. (Scientific
  // amber is kept for UI markers: it is darker than cyan and would break monotonic lightness.)
  optode: [
    [0, 0x1a, 0x17, 0x14],
    [0.12, 0x1f, 0x3a, 0x40],
    [0.3, 0x2f, 0x8a, 0x96],
    [0.5, 0x70, 0xda, 0xb8],
    [0.7, 0x80, 0xdc, 0xe3],
    [0.85, 0xc8, 0xee, 0xe0],
    [1, 0xfb, 0xf4, 0xe2],
  ],
  // Viridis approximation (perceptually uniform, colour-blind safe).
  viridis: [
    [0, 0x44, 0x01, 0x54],
    [0.25, 0x3b, 0x52, 0x8b],
    [0.5, 0x21, 0x91, 0x8c],
    [0.75, 0x5e, 0xc9, 0x62],
    [1, 0xfd, 0xe7, 0x25],
  ],
  gray: [
    [0, 0x10, 0x10, 0x10],
    [1, 0xf5, 0xf5, 0xf5],
  ],
};

export const COLORMAP_LABEL: Record<Colormap, string> = {
  optode: 'OPTODE',
  viridis: 'VIRIDIS (COLOUR-BLIND SAFE)',
  gray: 'GREYSCALE (HIGH CONTRAST)',
};

/** RGB for an oxygen saturation (%) on the given scale (0 … LEGEND_MAX, clamped). */
export function colorFor(map: Colormap, pct: number): [number, number, number] {
  const t = Math.min(1, Math.max(0, pct / LEGEND_MAX));
  const stops = STOPS[map];
  for (let i = 1; i < stops.length; i++) {
    const b = stops[i]!;
    if (t <= b[0]) {
      const a = stops[i - 1]!;
      const u = (t - a[0]) / (b[0] - a[0] || 1);
      return [
        Math.round(a[1] + (b[1] - a[1]) * u),
        Math.round(a[2] + (b[2] - a[2]) * u),
        Math.round(a[3] + (b[3] - a[3]) * u),
      ];
    }
  }
  const last = stops[stops.length - 1]!;
  return [last[1], last[2], last[3]];
}

/** Relative luminance (0–1), used by tests to check every scale brightens monotonically. */
export function luminance([r, g, b]: [number, number, number]): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export function toHex([r, g, b]: [number, number, number]): number {
  return (r << 16) | (g << 8) | b;
}
