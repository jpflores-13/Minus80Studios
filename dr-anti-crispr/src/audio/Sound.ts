import { progress, saveProgress } from '../config/progress';

// Chiptune-style sound, synthesized with Web Audio (square and triangle waves, a bit of noise),
// so there are no audio files to license. Audio can only start after a tap or key press.

export type SfxName =
  | 'jump'
  | 'land'
  | 'bounce'
  | 'pickup'
  | 'power'
  | 'hurt'
  | 'shield'
  | 'burst'
  | 'stop'
  | 'deny'
  | 'freeze'
  | 'warn'
  | 'shock'
  | 'cut'
  | 'checkpoint'
  | 'swap'
  | 'click'
  | 'win'
  | 'lose'
  | 'tick';

// Two short loops, as note numbers (semitones from A3, null = rest).
const SONGS: Record<string, { tempo: number; lead: (number | null)[]; bass: (number | null)[] }> = {
  title: {
    tempo: 132,
    lead: [
      12,
      null,
      15,
      17,
      19,
      null,
      17,
      15,
      12,
      null,
      10,
      12,
      15,
      null,
      null,
      null,
      12,
      null,
      15,
      17,
      22,
      null,
      19,
      17,
      15,
      null,
      17,
      15,
      12,
      null,
      null,
      null,
    ],
    bass: [0, null, 0, null, 3, null, 3, null, 5, null, 5, null, 3, null, 3, null],
  },
  stage: {
    tempo: 150,
    lead: [
      12,
      12,
      19,
      null,
      17,
      null,
      15,
      17,
      12,
      null,
      10,
      null,
      12,
      15,
      17,
      null,
      12,
      12,
      19,
      null,
      22,
      null,
      19,
      17,
      15,
      null,
      17,
      null,
      19,
      null,
      null,
      null,
    ],
    bass: [0, 0, 7, 0, 5, 5, 3, 5, 0, 0, 7, 0, 10, 10, 7, 5],
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
  /** Music speeds up as the countdown gets short. */
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
      case 'jump':
        s(300, 620, 0.12, 0.08);
        break;
      case 'land':
        s(140, 90, 0.05, 0.05, 'triangle');
        break;
      case 'bounce':
        s(220, 880, 0.2, 0.1);
        break;
      case 'pickup':
        s(880, 1320, 0.08, 0.07);
        s(1320, 1760, 0.08, 0.07, 'square', 0.07);
        break;
      case 'power':
        [523, 659, 784, 1047].forEach((f, i) => s(f, f, 0.08, 0.08, 'square', i * 0.06));
        break;
      case 'hurt':
        s(400, 90, 0.25, 0.14, 'sawtooth');
        break;
      case 'shield':
        s(1200, 300, 0.2, 0.1, 'triangle');
        break;
      case 'burst':
        s(500, 1400, 0.15, 0.08, 'triangle');
        break;
      case 'stop':
        [784, 988, 1175, 1568].forEach((f, i) => s(f, f, 0.1, 0.1, 'square', i * 0.07));
        break;
      case 'deny':
        s(200, 150, 0.15, 0.1);
        s(200, 150, 0.15, 0.1, 'square', 0.18);
        break;
      case 'freeze':
        s(1600, 2400, 0.3, 0.06, 'sine');
        break;
      case 'warn':
        s(880, 880, 0.08, 0.1);
        s(880, 880, 0.08, 0.1, 'square', 0.15);
        break;
      case 'shock':
        this.burstNoise(t, 0.3, 300, 0.25);
        break;
      case 'cut':
        this.burstNoise(t, 0.6, 2000, 0.3);
        s(600, 60, 0.6, 0.15, 'sawtooth');
        break;
      case 'checkpoint':
        s(660, 990, 0.15, 0.08, 'triangle');
        break;
      case 'swap':
        s(330, 660, 0.1, 0.08);
        s(660, 330, 0.1, 0.08, 'square', 0.1);
        break;
      case 'click':
        s(660, 660, 0.04, 0.05);
        break;
      case 'tick':
        s(1500, 1500, 0.03, 0.04);
        break;
      case 'win':
        [523, 659, 784, 1047, 784, 1047].forEach((f, i) => s(f, f, 0.14, 0.1, 'square', i * 0.11));
        break;
      case 'lose':
        [392, 370, 349, 330].forEach((f, i) => s(f, f * 0.98, 0.25, 0.1, 'square', i * 0.22));
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
