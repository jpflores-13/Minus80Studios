import { settings, updateSettings } from '../config/settings';

/**
 * Tiny synthesized audio engine (Web Audio API): no audio files, so nothing to
 * license yet. Underwater ambience, ability sounds, and capture feedback.
 * Each character has a base pitch so they sound distinct.
 *
 * Browsers only allow audio after a user gesture, so `unlock()` is called on the
 * first key press or click.
 */
export type SfxName =
  | 'cloud'
  | 'strike'
  | 'miss'
  | 'lock'
  | 'reel'
  | 'snap'
  | 'capture'
  | 'denied'
  | 'select'
  | 'confirm'
  | 'win'
  | 'lose'
  | 'reveal';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambience: AudioNode[] = [];
  private noise: AudioBuffer | null = null;

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
      let last = 0;
      for (let i = 0; i < len; i++) {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; // brown-ish noise
        data[i] = last * 3.5;
      }
    } catch {
      this.ctx = null; // No Web Audio: play silently.
    }
  }

  applyVolume(): void {
    const s = settings();
    if (this.master) this.master.gain.value = s.muted ? 0 : s.volume * 0.6;
  }

  toggleMute(): boolean {
    const muted = !settings().muted;
    updateSettings({ muted });
    this.applyVolume();
    return muted;
  }

  setVolume(volume: number): void {
    updateSettings({ volume: Math.min(1, Math.max(0, volume)) });
    this.applyVolume();
  }

  /** Low, filtered noise with a slow swell: the sound of deep water. */
  startAmbience(): void {
    const { ctx, master, noise } = this;
    if (!ctx || !master || !noise || this.ambience.length > 0) return;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 380;
    const gain = ctx.createGain();
    gain.gain.value = 0.35;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.12;
    lfo.connect(lfoGain).connect(gain.gain);
    src.connect(filter).connect(gain).connect(master);
    const drone = ctx.createOscillator();
    drone.type = 'sine';
    drone.frequency.value = 55;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.05;
    drone.connect(droneGain).connect(master);
    src.start();
    lfo.start();
    drone.start();
    this.ambience = [src, lfo, drone];
  }

  stopAmbience(): void {
    for (const node of this.ambience) {
      try {
        (node as AudioScheduledSourceNode).stop();
      } catch {
        /* already stopped */
      }
    }
    this.ambience = [];
  }

  play(name: SfxName, pitch = 1): void {
    const { ctx, master } = this;
    if (!ctx || !master || settings().muted) return;
    const t = ctx.currentTime;
    switch (name) {
      case 'cloud':
        this.noiseBurst(t, 0.6, 600 * pitch, 0.25);
        this.tone(t, 'sine', 180 * pitch, 90 * pitch, 0.5, 0.15);
        break;
      case 'strike':
        this.tone(t, 'sawtooth', 1400 * pitch, 200 * pitch, 0.12, 0.18);
        this.noiseBurst(t, 0.08, 3000, 0.2);
        break;
      case 'miss':
        this.tone(t, 'triangle', 160, 70, 0.25, 0.2);
        break;
      case 'lock':
        this.tone(t, 'square', 110 * pitch, 110 * pitch, 0.18, 0.08);
        this.tone(t + 0.12, 'square', 82 * pitch, 82 * pitch, 0.22, 0.08);
        break;
      case 'reel':
        this.tone(t, 'triangle', 300 * pitch, 520 * pitch, 0.35, 0.1);
        break;
      case 'snap':
        this.noiseBurst(t, 0.12, 2000, 0.25);
        break;
      case 'capture':
        [0, 0.08, 0.16].forEach((dt, i) =>
          this.tone(t + dt, 'sine', 440 * pitch * [1, 1.25, 1.5][i]!, 0, 0.3, 0.16),
        );
        this.tone(t, 'sine', 90, 50, 0.3, 0.25);
        break;
      case 'denied':
        this.tone(t, 'sine', 220, 200, 0.1, 0.08);
        break;
      case 'select':
        this.tone(t, 'sine', 660 * pitch, 0, 0.08, 0.08);
        break;
      case 'confirm':
        this.tone(t, 'sine', 523 * pitch, 0, 0.12, 0.1);
        this.tone(t + 0.1, 'sine', 784 * pitch, 0, 0.2, 0.1);
        break;
      case 'win':
        [523, 659, 784, 1047].forEach((f, i) =>
          this.tone(t + i * 0.12, 'triangle', f * pitch, 0, 0.4, 0.12),
        );
        break;
      case 'lose':
        [392, 330, 262].forEach((f, i) => this.tone(t + i * 0.18, 'triangle', f, 0, 0.4, 0.1));
        break;
      case 'reveal':
        this.tone(t, 'sine', 196, 0, 2.5, 0.1);
        this.tone(t + 0.4, 'sine', 294, 0, 2.2, 0.08);
        this.tone(t + 0.8, 'sine', 392, 0, 2, 0.06);
        break;
    }
  }

  private tone(
    t: number,
    type: OscillatorType,
    from: number,
    to: number,
    dur: number,
    vol: number,
  ): void {
    const { ctx, master } = this;
    if (!ctx || !master) return;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    if (to > 0) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  private noiseBurst(t: number, dur: number, freq: number, vol: number): void {
    const { ctx, master, noise } = this;
    if (!ctx || !master || !noise) return;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(gain).connect(master);
    src.start(t);
    src.stop(t + dur + 0.05);
  }
}

export const sound = new SoundEngine();

/** Each character's sonic identity: a base pitch multiplier. */
export const CHARACTER_PITCH: Record<string, number> = {
  catalyst: 1.25,
  atlas: 1,
  nightshade: 0.8,
};
