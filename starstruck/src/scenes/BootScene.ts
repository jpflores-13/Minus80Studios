import Phaser from 'phaser';
import { makeArt } from '../render/art';

// Draws the art, then the splash. Dev builds: ?scene=Level
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    makeArt(this);
    if (import.meta.env.DEV) {
      const scene = new URLSearchParams(window.location.search).get('scene');
      if (scene) return void this.scene.start(scene, { levelId: 'level-1' });
    }
    this.scene.start('Splash');
  }
}
