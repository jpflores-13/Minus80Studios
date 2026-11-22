import Phaser from 'phaser';
import { makeArt } from '../render/art';

// Dev builds: ?scene=OneDrop to jump straight into a scene while iterating.
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    makeArt(this);
    if (import.meta.env.DEV) {
      const scene = new URLSearchParams(window.location.search).get('scene');
      if (scene) return void this.scene.start(scene, { scale: 'drop' });
    }
    this.scene.start('Title');
  }
}
