import { progress, saveProgress } from '../config/progress';

// Chiptune-style sound, synthesized with Web Audio (square and triangle waves, a bit of noise),
// so there are no audio files to license. Audio can only start after a tap or key press.

export type SfxName =
  | 'pulse'
  | 'forage'
  | 'deliver'
  | 'broodCare'
  | 'disturbance'
  | 'queenLost'
  | 'reorganize'
  | 'click'
  | 'deny'
  | 'win'
  | 'lose';

// Two short loops, as note numbers (semitones from A3, null = rest). A gentle, pastoral feel.
const SONGS: Record<string, { tempo: number; lead: (number | null)[]; bass: (number | null)[] }> = {
  title: {
    tempo: 100,
    lead: [12, null, 15, null, 19, null, 17, null, 15, null, 12, null, null, null, null, null],
    bass: [0, null, 5, null, 7, null, 5, null],
  },
  colony: {
    tempo: 110,
    lead: [null, 15, null, 19, null, 17, null, null, 12, null, 15, null, null, null, null, null],
    bass: [0, null, 0, null, 7, null, 5, null],
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
    if (this.musicGain) this.musicGain.gain.value = p.music ? 0.3 : 0;
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
        this.note(this.nextTime, 'triangle', lead + 12, sixteenth * 0.9, 0.05, this.musicGain);
      if (this.step % 2 === 0 && bass !== null && bass !== undefined)
        this.note(this.nextTime, 'sine', bass - 12, sixteenth * 1.8, 0.1, this.musicGain);
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
      type: OscillatorType = 'sine',
      at = 0,
    ) => this.sweep(t + at, type, from, to, dur, vol);
    switch (name) {
      case 'pulse':
        s(500, 900, 0.3, 0.07, 'sine');
        s(900, 500, 0.3, 0.04, 'sine', 0.05);
        break;
      case 'forage':
        s(700, 1000, 0.08, 0.06, 'triangle');
        break;
      case 'deliver':
        [659, 784, 988].forEach((f, i) => s(f, f, 0.1, 0.06, 'triangle', i * 0.06));
        break;
      case 'broodCare':
        s(440, 660, 0.18, 0.05, 'sine');
        break;
      case 'disturbance':
        s(300, 150, 0.3, 0.09, 'sawtooth');
        break;
      case 'queenLost':
        [330, 294, 262, 220].forEach((f, i) => s(f, f, 0.4, 0.08, 'sine', i * 0.28));
        break;
      case 'reorganize':
        [392, 494, 587].forEach((f, i) => s(f, f * 1.02, 0.2, 0.06, 'triangle', i * 0.08));
        break;
      case 'click':
        s(660, 660, 0.03, 0.05);
        break;
      case 'deny':
        s(220, 200, 0.12, 0.08, 'square');
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
}

export const sound = new SoundEngine();
