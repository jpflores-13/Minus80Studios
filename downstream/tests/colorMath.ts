// WCAG contrast ratio and a colour-blindness check (Machado et al. 2009 simulation, CIE76 colour difference).
const channels = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const linear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function luminance(h: string): number {
  const [r = 0, g = 0, b = 0] = channels(h).map(linear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const MATRICES = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

function simulate(h: string, m: number[][]): number[] {
  const c = channels(h).map(linear);
  return m.map((row) =>
    gamma(
      Math.min(
        1,
        Math.max(
          0,
          (row[0] ?? 0) * (c[0] ?? 0) + (row[1] ?? 0) * (c[1] ?? 0) + (row[2] ?? 0) * (c[2] ?? 0),
        ),
      ),
    ),
  );
}

function lab(rgb: number[]): number[] {
  const [r = 0, g = 0, b = 0] = rgb.map(linear);
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047);
  const y = f(0.2126 * r + 0.7152 * g + 0.0722 * b);
  const z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

const deltaE = (a: number[], b: number[]) => Math.hypot(...a.map((v, i) => v - (b[i] ?? 0)));

// "Distinct" = a CIE76 difference of at least 20 under each type of colour blindness.
export function distinctForColourBlindness(a: string, b: string, minDelta = 20): boolean {
  return Object.values(MATRICES).every(
    (m) => deltaE(lab(simulate(a, m)), lab(simulate(b, m))) >= minDelta,
  );
}
