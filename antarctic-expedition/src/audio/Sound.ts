import { progress, saveProgress } from '../config/progress';

// Chiptune-style sound, synthesized with Web Audio (square and triangle waves, a bit of noise),
// so there are no audio files to license. Audio can only start after a tap or key press.

export type SfxName =
  | 'shutter'
  | 'capture'
  | 'combo'
  | 'miss'
  | 'discover'
  | 'instrument'
  | 'sample'
  | 'deny'
  | 'click'
  | 'win'
  | 'lose';

// Two short loops, as note numbers (semitones from A3, null = rest).
const SONGS: Record<string, { tempo: number; lead: (number | null)[]; bass: (number | null)[] }> = {
  title: {
    tempo: 86,
    lead: [7, null, null, 10, null, 12, null, null, 14, null, 12, null, 10, null, null, null],
    bass: [0, null, 5, null, 7, null, 3, null],
  },
  dive: {
    tempo: 100,
    lead: [null, null, 12, null, null, 10, null, 7, null, null, null, null, 5, null, 7, null],
    bass: [0, 0, null, 0, 5, null, 3, 0],
  },
  drop: {
    tempo: 128,
    lead: [14, null, 17, null, 19, null, 17, null, 14, null, 12, null, 14, null, null, null],
    bass: [0, 7, 5, 7, 0, 7, 3, 7],
  },
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private song: string | null = null;
  private songTimer: number | undefined;
  private step = 0;
  private nextTime = 0;
  /** ONE DROP speeds the music up as the clock runs down. */
  private urgency = 1;

  unlock(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    try {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.connect(this.master);
      const len = this.ctx.sampleRate;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.applyVolume();
      if (this.song) this.playSong(this.song);
    } catch {
      this.ctx = null;
    }
  }

  applyVolume(): void {
    const p = progress();
    if (this.master) this.master.gain.value = p.muted ? 0 : p.volume * 0.5;
    if (this.musicGain) this.musicGain.gain.value = p.music ? 0.35 : 0;
  }

  toggleMute(): boolean {
    saveProgress({ muted: !progress().muted });
    this.applyVolume();
    return progress().muted;
  }

  setVolume(v: number): void {
    saveProgress({ volume: Math.min(1, Math.max(0, v)) });
    this.applyVolume();
  }

  setUrgency(u: number): void {
    this.urgency = u;
  }

  playSong(name: string): void {
    this.song = name;
    window.clearInterval(this.songTimer);
    if (!this.ctx) return;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.05;
    this.songTimer = window.setInterval(() => this.schedule(), 50);
  }

  stopSong(): void {
    this.song = null;
    window.clearInterval(this.songTimer);
  }

  private schedule(): void {
    const ctx = this.ctx;
    const song = this.song ? SONGS[this.song] : undefined;
    if (!ctx || !song || !this.musicGain) return;
    const sixteenth = 60 / (song.tempo * this.urgency) / 4;
    while (this.nextTime < ctx.currentTime + 0.15) {
      const lead = song.lead[this.step % song.lead.length];
      const bass = song.bass[Math.floor(this.step / 2) % song.bass.length];
      if (lead !== null && lead !== undefined)
        this.note(this.nextTime, 'square', lead + 12, sixteenth * 0.9, 0.05, this.musicGain);
      if (this.step % 2 === 0 && bass !== null && bass !== undefined)
        this.note(this.nextTime, 'triangle', bass - 12, sixteenth * 1.8, 0.12, this.musicGain);
      if (this.step % 4 === 2) this.hat(this.nextTime);
      this.nextTime += sixteenth;
      this.step++;
    }
  }

  play(name: SfxName): void {
    const ctx = this.ctx;
    if (!ctx || progress().muted) return;
    const t = ctx.currentTime;
    const s = (
      from: number,
      to: number,
      dur: number,
      vol = 0.12,
      type: OscillatorType = 'square',
      at = 0,
    ) => this.sweep(t + at, type, from, to, dur, vol);
    switch (name) {
      case 'shutter':
        s(1800, 400, 0.06, 0.1, 'square');
        this.burstNoise(t, 0.03, 3000, 0.05);
        break;
      case 'capture':
        [659, 880, 1047].forEach((f, i) => s(f, f, 0.08, 0.07, 'triangle', i * 0.05));
        break;
      case 'combo':
        s(1000, 1400, 0.05, 0.07, 'square');
        break;
      case 'miss':
        s(220, 160, 0.15, 0.08, 'sawtooth');
        break;
      case 'discover':
        [523, 659, 784, 988, 1318].forEach((f, i) => s(f, f, 0.14, 0.08, 'triangle', i * 0.1));
        break;
      case 'instrument':
        s(400, 900, 0.18, 0.06, 'sine');
        break;
      case 'sample':
        s(300, 700, 0.3, 0.07, 'sine');
        this.burstNoise(t, 0.1, 1200, 0.04);
        break;
      case 'deny':
        s(220, 180, 0.12, 0.07, 'square');
        break;
      case 'click':
        s(700, 700, 0.03, 0.05);
        break;
      case 'win':
        [392, 494, 587, 740, 784].forEach((f, i) => s(f, f, 0.2, 0.08, 'triangle', i * 0.12));
        break;
      case 'lose':
        [392, 370, 349, 330].forEach((f, i) => s(f, f, 0.3, 0.08, 'triangle', i * 0.2));
        break;
    }
  }

  private note(
    t: number,
    type: OscillatorType,
    semis: number,
    dur: number,
    vol: number,
    out: AudioNode,
  ): void {
    const f = 220 * 2 ** (semis / 12);
    this.sweep(t, type, f, f, dur, vol, out);
  }

  private sweep(
    t: number,
    type: OscillatorType,
    from: number,
    to: number,
    dur: number,
    vol: number,
    out?: AudioNode,
  ): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(out ?? this.master!);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private hat(t: number): void {
    this.burstNoise(t, 0.03, 8000, 0.03, this.musicGain ?? undefined);
  }

  private burstNoise(t: number, dur: number, freq: number, vol: number, out?: AudioNode): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src
      .connect(f)
      .connect(g)
      .connect(out ?? this.master!);
    src.start(t);
    src.stop(t + dur + 0.02);
  }
}

export const sound = new SoundEngine();
