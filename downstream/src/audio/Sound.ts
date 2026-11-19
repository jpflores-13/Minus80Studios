import { progress, saveProgress } from '../config/progress';

// Small synthesized sound set (Web Audio), so there are no audio files to license.
// Audio can only start after a click or key press, hence unlock().

export type SfxName =
  | 'place'
  | 'pickup'
  | 'catch'
  | 'full'
  | 'gps'
  | 'cleanup'
  | 'deny'
  | 'click'
  | 'win'
  | 'lose'
  | 'star';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private water: { src: AudioBufferSourceNode; gain: GainNode } | null = null;
  private rain: { src: AudioBufferSourceNode; gain: GainNode } | null = null;
  private birdTimer: number | undefined;

  unlock(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    try {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.applyVolume();
      const len = this.ctx.sampleRate * 2;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    } catch {
      this.ctx = null;
    }
  }

  applyVolume(): void {
    const p = progress();
    if (this.master) this.master.gain.value = p.muted ? 0 : p.volume * 0.6;
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

  startAmbience(): void {
    if (!this.ctx || this.water) return;
    this.water = this.loopNoise('lowpass', 700, 0.12);
    this.rain = this.loopNoise('highpass', 2500, 0);
    const chirp = () => {
      this.bird();
      this.birdTimer = window.setTimeout(chirp, 2500 + Math.random() * 5000);
    };
    this.birdTimer = window.setTimeout(chirp, 1500);
  }

  stopAmbience(): void {
    for (const loop of [this.water, this.rain]) {
      try {
        loop?.src.stop();
      } catch {
        // already stopped
      }
    }
    this.water = null;
    this.rain = null;
    window.clearTimeout(this.birdTimer);
  }

  // 0 = dry, 1 = light, 2 = moderate, 3 = heavy
  setRain(level: number): void {
    if (!this.ctx || !this.rain) return;
    this.rain.gain.gain.setTargetAtTime(
      [0, 0.05, 0.12, 0.22][level] ?? 0,
      this.ctx.currentTime,
      0.8,
    );
  }

  play(name: SfxName): void {
    const ctx = this.ctx;
    if (!ctx || progress().muted) return;
    const t = ctx.currentTime;
    switch (name) {
      case 'place':
        this.tone(t, 'triangle', 330, 220, 0.12, 0.15);
        break;
      case 'pickup':
        this.tone(t, 'triangle', 220, 330, 0.1, 0.12);
        break;
      case 'catch':
        this.tone(t, 'sine', 880 + Math.random() * 200, 0, 0.12, 0.06);
        break;
      case 'full':
        this.tone(t, 'square', 440, 0, 0.15, 0.07);
        this.tone(t + 0.18, 'square', 440, 0, 0.15, 0.07);
        break;
      case 'gps':
        this.tone(t, 'sine', 1320, 0, 0.08, 0.08);
        this.tone(t + 0.1, 'sine', 1760, 0, 0.12, 0.08);
        break;
      case 'cleanup':
        this.noiseBurst(t, 0.4, 1200, 0.15);
        this.tone(t + 0.2, 'triangle', 523, 784, 0.25, 0.1);
        break;
      case 'deny':
        this.tone(t, 'sine', 200, 180, 0.12, 0.08);
        break;
      case 'click':
        this.tone(t, 'sine', 660, 0, 0.05, 0.06);
        break;
      case 'star':
        this.tone(t, 'triangle', 1047, 0, 0.3, 0.1);
        break;
      case 'win':
        [523, 659, 784, 1047].forEach((f, i) =>
          this.tone(t + i * 0.12, 'triangle', f, 0, 0.4, 0.12),
        );
        break;
      case 'lose':
        [392, 349, 294].forEach((f, i) => this.tone(t + i * 0.18, 'triangle', f, 0, 0.4, 0.1));
        break;
    }
  }

  private bird(): void {
    const ctx = this.ctx;
    if (!ctx || progress().muted) return;
    const t = ctx.currentTime;
    const base = 2200 + Math.random() * 1200;
    for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
      this.tone(t + i * 0.12, 'sine', base, base * 1.3, 0.08, 0.025);
    }
  }

  private loopNoise(type: BiquadFilterType, freq: number, vol: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter).connect(gain).connect(this.master!);
    src.start();
    return { src, gain };
  }

  private tone(
    t: number,
    type: OscillatorType,
    from: number,
    to: number,
    dur: number,
    vol: number,
  ): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    if (to > 0) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(this.master!);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  private noiseBurst(t: number, dur: number, freq: number, vol: number): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(gain).connect(this.master!);
    src.start(t);
    src.stop(t + dur + 0.05);
  }
}

export const sound = new SoundEngine();
