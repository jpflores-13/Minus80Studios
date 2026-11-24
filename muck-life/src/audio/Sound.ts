import { progress, saveProgress } from '../config/progress';

// Everything is synthesized with Web Audio, so there are no audio files to license.
// Three independent buses: SFX, music, ambience. Audio can only start after a tap or key press.
//
// Music is a slightly funky loop in layers. `setIntensity` (0–1, driven by how many roots are
// growing) brings in hats, clav stabs and a lead; `setQuiet` drops to a hush for Night Shift.

export type SfxName =
  | 'capture'
  | 'combo'
  | 'miss'
  | 'duplicate'
  | 'emerge'
  | 'lateral'
  | 'imaging'
  | 'scan'
  | 'timelapse'
  | 'tick'
  | 'roi'
  | 'win'
  | 'fail'
  | 'click'
  | 'deny'
  | 'twist';

interface Song {
  tempo: number;
  bass: (number | null)[];
  stab: (number | null)[];
  lead: (number | null)[];
  swing: number;
}

// Semitones from A2. Sixteenth-note steps.
const SONGS: Record<string, Song> = {
  title: {
    tempo: 92,
    bass: [0, null, null, 0, null, null, 7, null, 5, null, null, 3, null, 5, null, null],
    stab: [null, null, 12, null, null, null, 15, null, null, null, 12, null, null, 17, null, null],
    lead: [24, null, 27, null, 29, null, null, 27, 24, null, 22, null, 24, null, null, null],
    swing: 0.12,
  },
  muck: {
    tempo: 100,
    bass: [0, null, 0, null, null, 3, null, 5, 7, null, null, 5, null, 3, null, null],
    stab: [null, null, 12, null, null, 12, null, null, null, null, 15, null, null, 12, null, null],
    lead: [null, null, null, null, 24, null, 27, null, null, null, 29, null, 27, null, 24, null],
    swing: 0.14,
  },
  rush: {
    tempo: 118,
    bass: [0, null, 12, 0, null, 10, null, 7, 0, null, 12, null, 3, null, 5, null],
    stab: [null, 15, null, null, 15, null, null, 15, null, 17, null, null, 15, null, 12, null],
    lead: [24, null, 27, 29, null, 31, null, 29, 27, null, 24, null, 22, null, 24, null],
    swing: 0.1,
  },
  night: {
    tempo: 84,
    bass: [0, null, null, null, 7, null, null, null, 5, null, null, null, 3, null, null, null],
    stab: [
      null,
      null,
      null,
      null,
      null,
      null,
      15,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      12,
      null,
    ],
    lead: [
      null,
      null,
      24,
      null,
      null,
      null,
      null,
      null,
      22,
      null,
      null,
      null,
      19,
      null,
      null,
      null,
    ],
    swing: 0.18,
  },
  bloom: {
    tempo: 124,
    bass: [0, 0, null, 12, null, 0, 10, null, 5, 5, null, 17, null, 5, 15, null],
    stab: [null, 12, null, 15, null, 12, null, 19, null, 17, null, 15, null, 17, null, 19],
    lead: [31, null, 29, null, 27, null, 29, 31, 34, null, 31, null, 29, 27, 24, null],
    swing: 0.08,
  },
  zen: {
    tempo: 72,
    bass: [
      0,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      5,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ],
    stab: [
      null,
      null,
      null,
      null,
      12,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      15,
      null,
      null,
      null,
    ],
    lead: [
      24,
      null,
      null,
      null,
      null,
      null,
      27,
      null,
      null,
      null,
      null,
      null,
      22,
      null,
      null,
      null,
    ],
    swing: 0.2,
  },
  ending: {
    tempo: 80,
    bass: [0, null, null, null, 5, null, null, null, 7, null, null, null, 3, null, null, null],
    stab: [12, null, null, null, 17, null, null, null, 19, null, null, null, 15, null, null, null],
    lead: [24, null, 27, null, 29, null, 31, null, 29, null, 27, null, 24, null, null, null],
    swing: 0.1,
  },
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private ambBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private song: string | null = null;
  private songTimer: number | undefined;
  private step = 0;
  private nextTime = 0;
  private intensity = 0.3;
  private quiet = false;
  private ambSource: AudioBufferSourceNode | null = null;
  private ambFilter: BiquadFilterNode | null = null;
  private night = false;

  unlock(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    try {
      const ctx = new AudioContext();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.connect(ctx.destination);
      this.sfxBus = ctx.createGain();
      this.musicBus = ctx.createGain();
      this.ambBus = ctx.createGain();
      this.sfxBus.connect(this.master);
      this.musicBus.connect(this.master);
      this.ambBus.connect(this.master);
      const len = ctx.sampleRate * 2;
      this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.applyVolume();
      if (this.song) this.playSong(this.song);
      this.startAmbience();
    } catch {
      this.ctx = null;
    }
  }

  applyVolume(): void {
    const p = progress();
    if (this.master) this.master.gain.value = p.muted ? 0 : 0.6;
    if (this.sfxBus) this.sfxBus.gain.value = p.sfxVolume;
    if (this.musicBus) this.musicBus.gain.value = p.musicVolume * (this.quiet ? 0.25 : 0.55);
    if (this.ambBus) this.ambBus.gain.value = p.ambience ? 0.5 : 0;
  }

  toggleMute(): boolean {
    saveProgress({ muted: !progress().muted });
    this.applyVolume();
    return progress().muted;
  }

  setIntensity(v: number): void {
    this.intensity = Math.min(1, Math.max(0, v));
  }

  setQuiet(q: boolean): void {
    this.quiet = q;
    this.applyVolume();
  }

  setNight(n: boolean): void {
    if (n === this.night) return;
    this.night = n;
    if (this.ambFilter && this.ctx)
      this.ambFilter.frequency.setTargetAtTime(n ? 500 : 900, this.ctx.currentTime, 1.5);
  }

  playSong(name: string): void {
    if (this.song === name && this.songTimer !== undefined && this.ctx) return;
    this.song = name;
    window.clearInterval(this.songTimer);
    this.songTimer = undefined;
    if (!this.ctx) return;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.05;
    this.songTimer = window.setInterval(() => this.schedule(), 50);
  }

  stopSong(): void {
    this.song = null;
    window.clearInterval(this.songTimer);
    this.songTimer = undefined;
  }

  private schedule(): void {
    const ctx = this.ctx;
    const song = this.song ? SONGS[this.song] : undefined;
    if (!ctx || !song || !this.musicBus) return;
    const sixteenth = 60 / song.tempo / 4;
    while (this.nextTime < ctx.currentTime + 0.15) {
      const i = this.step % 16;
      const swing = i % 2 === 1 ? sixteenth * song.swing : 0;
      const t = this.nextTime + swing;
      const bus = this.musicBus;
      const bass = song.bass[i];
      if (bass !== null && bass !== undefined) this.pluck(t, bass, sixteenth * 1.6, 0.16, bus);
      if (!this.quiet) {
        if (i % 4 === 0) this.kick(t, bus);
        if (i % 8 === 4) this.snare(t, bus);
        if (this.intensity > 0.25 && i % 2 === 0) this.hat(t, bus, i % 4 === 2 ? 0.035 : 0.018);
        const stab = song.stab[i];
        if (this.intensity > 0.45 && stab !== null && stab !== undefined)
          this.note(t, 'square', stab, sixteenth * 0.5, 0.035, bus);
        const lead = song.lead[i];
        if (this.intensity > 0.7 && lead !== null && lead !== undefined)
          this.note(t, 'triangle', lead, sixteenth * 1.4, 0.05, bus);
      } else if (i === 0) {
        this.note(t, 'sine', 24, sixteenth * 8, 0.04, bus);
      }
      this.nextTime += sixteenth;
      this.step++;
    }
  }

  play(name: SfxName, pitch = 0): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxBus || progress().muted) return;
    const t = ctx.currentTime;
    const bus = this.sfxBus;
    const s = (
      from: number,
      to: number,
      dur: number,
      vol = 0.12,
      type: OscillatorType = 'sine',
      at = 0,
    ) => this.sweep(t + at, type, from, to, dur, vol, bus);
    const up = 2 ** (pitch / 12);
    switch (name) {
      case 'capture':
        // A camera-shutter click and a bright, rising "ping".
        this.burst(t, 0.025, 4500, 0.09, bus);
        this.burst(t + 0.04, 0.02, 3000, 0.06, bus);
        s(660 * up, 1320 * up, 0.12, 0.09, 'triangle', 0.02);
        s(990 * up, 990 * up, 0.18, 0.05, 'sine', 0.08);
        break;
      case 'combo':
        s(1320 * up, 1760 * up, 0.08, 0.05, 'square');
        break;
      case 'miss':
        s(240, 150, 0.16, 0.07, 'sawtooth');
        break;
      case 'duplicate':
        s(520, 520, 0.05, 0.05, 'triangle');
        s(440, 440, 0.07, 0.05, 'triangle', 0.06);
        break;
      case 'emerge':
        // A soft squelch: low bubble rising.
        s(90, 220, 0.18, 0.1, 'sine');
        this.burst(t, 0.08, 600, 0.05, bus);
        break;
      case 'lateral':
        [0, 0.05, 0.1].forEach((d, k) => s(300 + k * 120, 500 + k * 140, 0.09, 0.05, 'sine', d));
        break;
      case 'imaging':
        s(300, 900, 0.22, 0.05, 'sine');
        s(450, 1350, 0.22, 0.03, 'triangle', 0.03);
        break;
      case 'scan':
        s(200, 2000, 0.5, 0.05, 'sine');
        this.burst(t, 0.4, 2500, 0.03, bus);
        break;
      case 'timelapse':
        s(1600, 200, 0.45, 0.05, 'triangle');
        s(200, 1600, 0.45, 0.04, 'sine', 0.45);
        break;
      case 'tick':
        s(1000, 1000, 0.04, 0.06, 'square');
        break;
      case 'roi':
        [784, 988, 1175].forEach((f, k) => s(f, f, 0.1, 0.06, 'triangle', k * 0.07));
        break;
      case 'win':
        [523, 659, 784, 1047, 1319].forEach((f, k) => s(f, f, 0.22, 0.08, 'triangle', k * 0.11));
        break;
      case 'fail':
        [392, 349, 330].forEach((f, k) => s(f, f, 0.28, 0.07, 'triangle', k * 0.18));
        break;
      case 'click':
        s(800, 800, 0.03, 0.05, 'square');
        break;
      case 'deny':
        s(220, 180, 0.12, 0.07, 'square');
        break;
      case 'twist':
        [220, 277, 330, 415].forEach((f, k) => s(f, f, 0.9, 0.05, 'sine', k * 0.25));
        break;
    }
  }

  /** Marsh ambience: slowly breathing filtered noise (water and wind), insects at night. */
  private startAmbience(): void {
    const ctx = this.ctx;
    if (!ctx || !this.noise || !this.ambBus || this.ambSource) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 900;
    const g = ctx.createGain();
    g.gain.value = 0.05;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.09;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.03;
    lfo.connect(lfoGain).connect(g.gain);
    src.connect(f).connect(g).connect(this.ambBus);
    src.start();
    lfo.start();
    this.ambSource = src;
    this.ambFilter = f;
    window.setInterval(() => {
      if (!this.night || !this.ctx || !this.ambBus || Math.random() < 0.4) return;
      const t0 = this.ctx.currentTime;
      const base = 3800 + Math.random() * 1200;
      for (let k = 0; k < 3; k++)
        this.sweep(t0 + k * 0.07, 'sine', base, base * 1.02, 0.04, 0.012, this.ambBus);
    }, 700);
  }

  private note(
    t: number,
    type: OscillatorType,
    semis: number,
    dur: number,
    vol: number,
    out: AudioNode,
  ): void {
    const f = 110 * 2 ** (semis / 12);
    this.sweep(t, type, f, f, dur, vol, out);
  }

  /** Funky plucked bass: a sawtooth through a closing low-pass. */
  private pluck(t: number, semis: number, dur: number, vol: number, out: AudioNode): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 55 * 2 ** (semis / 12);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.Q.value = 6;
    f.frequency.setValueAtTime(1400, t);
    f.frequency.exponentialRampToValueAtTime(180, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(f).connect(g).connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private kick(t: number, out: AudioNode): void {
    this.sweep(t, 'sine', 140, 45, 0.16, 0.2, out);
  }

  private snare(t: number, out: AudioNode): void {
    this.burst(t, 0.1, 1800, 0.06, out);
  }

  private hat(t: number, out: AudioNode, vol: number): void {
    this.burst(t, 0.025, 8000, vol, out);
  }

  private sweep(
    t: number,
    type: OscillatorType,
    from: number,
    to: number,
    dur: number,
    vol: number,
    out: AudioNode,
  ): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private burst(t: number, dur: number, freq: number, vol: number, out: AudioNode): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(out);
    src.start(t, Math.random());
    src.stop(t + dur + 0.02);
  }
}

export const sound = new SoundEngine();
