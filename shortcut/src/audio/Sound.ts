import { progress, saveProgress } from '../config/progress';

// Small synthesized sound set (Web Audio), so there are no audio files to license.
// Audio can only start after a click or key press, hence unlock().

export type SfxName =
  | 'place'
  | 'turn'
  | 'remove'
  | 'deny'
  | 'click'
  | 'load'
  | 'deliver'
  | 'stall'
  | 'win'
  | 'lose'
  | 'star';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

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

  play(name: SfxName): void {
    const ctx = this.ctx;
    if (!ctx || progress().muted) return;
    const t = ctx.currentTime;
    switch (name) {
      case 'place':
        this.tone(t, 'triangle', 392, 523, 0.12, 0.14);
        break;
      case 'turn':
        this.tone(t, 'triangle', 523, 392, 0.1, 0.12);
        break;
      case 'remove':
        this.tone(t, 'triangle', 330, 220, 0.12, 0.12);
        break;
      case 'deny':
        this.tone(t, 'sine', 200, 180, 0.12, 0.08);
        break;
      case 'click':
        this.tone(t, 'sine', 660, 0, 0.05, 0.06);
        break;
      case 'load':
        this.tone(t, 'sine', 262, 330, 0.15, 0.05);
        break;
      case 'deliver':
        this.tone(t, 'sine', 988 + Math.random() * 120, 0, 0.1, 0.05);
        break;
      case 'stall':
        this.tone(t, 'square', 180, 0, 0.06, 0.03);
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
}

export const sound = new SoundEngine();
