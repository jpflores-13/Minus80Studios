import Phaser from 'phaser';
import { makeArt } from '../render/art';

// Draws the art, then the splash. Dev builds: ?scene=Level&levelId=level-1
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    makeArt(this);
    if (import.meta.env.DEV) {
      const params = new URLSearchParams(window.location.search);
      const scene = params.get('scene');
      if (scene)
        return void this.scene.start(scene, { levelId: params.get('levelId') ?? 'level-1' });
    }
    this.scene.start('Splash');
  }
}
