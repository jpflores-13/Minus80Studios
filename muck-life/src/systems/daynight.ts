import { MEASURED } from '../config/tuning';

// Time of day, for visuals and for the (small) diel modulation of oxygen release.
// Light period matches the study's growth room: 05:00–19:00.

export function hourOfDay(simHour: number): number {
  return ((simHour % 24) + 24) % 24;
}

export function dayNumber(simHour: number): number {
  return Math.floor(simHour / 24) + 1;
}

export function isNight(simHour: number): boolean {
  const h = hourOfDay(simHour);
  return h < MEASURED.lightOnHour || h >= MEASURED.lightOffHour;
}

/** 0 (night) … 1 (full day), with ~1 h twilight ramps, for sky colour only. */
export function daylight(simHour: number): number {
  const h = hourOfDay(simHour);
  const on = MEASURED.lightOnHour;
  const off = MEASURED.lightOffHour;
  if (h >= on && h < on + 1) return h - on;
  if (h >= on + 1 && h < off - 0.5) return 1;
  if (h >= off - 0.5 && h < off + 0.5) return 1 - (h - (off - 0.5));
  return 0;
}

/**
 * Diel shape in [-1, 1], following the pattern the paper describes for pools around lateral roots:
 * a rise for 2–3 h after lights-on, a slow decline through the day, a sharp drop for ~2 h after
 * lights-off, then a gradual rise through the night. Continuous at both transitions.
 * The amplitude applied to release is small (SIM.dielAmplitude) — growth matters far more.
 */
export function dielShape(simHour: number): number {
  const h = hourOfDay(simHour);
  const on = MEASURED.lightOnHour;
  const off = MEASURED.lightOffHour;
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  if (h >= on && h < off) {
    const t = h - on;
    if (t < 2.5) return lerp(-0.6, 1, t / 2.5);
    return lerp(1, -0.2, (t - 2.5) / (off - on - 2.5));
  }
  const u = (h - off + 24) % 24; // hours since lights-off
  const nightLen = 24 - (off - on);
  if (u < 2) return lerp(-0.2, -1, u / 2);
  return lerp(-1, -0.6, (u - 2) / (nightLen - 2));
}

export function clockLabel(simHour: number): string {
  const h = hourOfDay(simHour);
  const hh = Math.floor(h).toString().padStart(2, '0');
  const mm = Math.floor((h % 1) * 60)
    .toString()
    .padStart(2, '0');
  return `Day ${dayNumber(simHour)} · ${hh}:${mm}`;
}

/** For constant-light levels: time elapsed since the level began, e.g. "+1 d 06 h". */
export function elapsedLabel(hours: number): string {
  const h = Math.max(0, Math.floor(hours));
  return `+${Math.floor(h / 24)} d ${(h % 24).toString().padStart(2, '0')} h`;
}
