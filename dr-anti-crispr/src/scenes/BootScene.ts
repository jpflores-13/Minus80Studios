import Phaser from 'phaser';
import { makeArt } from '../render/art';

// Draws every sprite, then the splash. Dev builds: ?scene=Battle&mode=endless
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    makeArt(this);
    if (import.meta.env.DEV) {
      const params = new URLSearchParams(window.location.search);
      const scene = params.get('scene');
      if (scene) return void this.scene.start(scene, { mode: params.get('mode') ?? 'campaign' });
    }
    this.scene.start('Splash');
  }
}
