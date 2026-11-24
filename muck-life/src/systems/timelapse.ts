// A ring buffer of oxygen-field snapshots, like the image series a real optode setup records.
// Plants never lose tissue points, so the roots can be redrawn for any snapshot's sim hour.

export interface Frame {
  simHour: number;
  field: Uint8Array;
}

export class TimeLapse {
  private frames: Frame[] = [];
  private lastAt = -Infinity;

  constructor(
    /** Sim hours between snapshots. */
    readonly interval: number,
    /** Sim hours kept. */
    readonly window: number,
  ) {}

  /** Records a frame if at least `interval` sim hours have passed since the last one. */
  maybeRecord(simHour: number, take: () => Uint8Array): boolean {
    if (simHour - this.lastAt < this.interval) return false;
    this.lastAt = simHour;
    this.frames.push({ simHour, field: take() });
    const cutoff = simHour - this.window;
    while (this.frames.length > 0 && this.frames[0]!.simHour < cutoff) this.frames.shift();
    return true;
  }

  get length(): number {
    return this.frames.length;
  }

  all(): readonly Frame[] {
    return this.frames;
  }

  /** The frame for playback progress t in [0, 1] (oldest → newest). */
  at(t: number): Frame | null {
    if (this.frames.length === 0) return null;
    const i = Math.round(Math.min(1, Math.max(0, t)) * (this.frames.length - 1));
    return this.frames[i] ?? null;
  }

  clear(): void {
    this.frames = [];
    this.lastAt = -Infinity;
  }
}
