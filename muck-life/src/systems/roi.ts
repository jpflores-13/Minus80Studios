import { ARCADE } from '../config/tuning';

// Regions of interest: small windows that record the optode reading at one spot over time, the way
// the researchers quantified oxygen pools. An ROI "captures an event" once its record shows a real
// change (a pool arriving or fading), which is the point of watching a spot over time.

export interface Roi {
  id: number;
  x: number;
  y: number;
  series: { simHour: number; value: number }[];
  eventRecorded: boolean;
  placedAt: number;
}

export class RoiRecorder {
  readonly rois: Roi[] = [];
  private nextId = 1;
  private lastSample = -Infinity;

  constructor(readonly maxRois: number = ARCADE.maxRois) {}

  place(x: number, y: number, simHour: number): Roi {
    if (this.rois.length >= this.maxRois) this.rois.shift();
    const roi: Roi = {
      id: this.nextId++,
      x,
      y,
      series: [],
      eventRecorded: false,
      placedAt: simHour,
    };
    this.rois.push(roi);
    return roi;
  }

  /** Samples every ROI once per sim hour. Returns ROIs that just recorded their event. */
  update(simHour: number, read: (x: number, y: number) => number): Roi[] {
    if (simHour - this.lastSample < 1) return [];
    this.lastSample = simHour;
    const done: Roi[] = [];
    for (const r of this.rois) {
      r.series.push({ simHour, value: read(r.x, r.y) });
      if (r.series.length > 96) r.series.shift();
      if (!r.eventRecorded && roiRange(r) >= ARCADE.roiEventDeltaPct) {
        r.eventRecorded = true;
        done.push(r);
      }
    }
    return done;
  }
}

export function roiRange(r: Roi): number {
  if (r.series.length === 0) return 0;
  let lo = Infinity;
  let hi = -Infinity;
  for (const s of r.series) {
    lo = Math.min(lo, s.value);
    hi = Math.max(hi, s.value);
  }
  return hi - lo;
}
