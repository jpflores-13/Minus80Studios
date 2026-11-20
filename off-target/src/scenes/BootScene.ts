import Phaser from 'phaser';
import { makeArt } from '../render/art';

// Draws every sprite, then goes to the splash. Dev builds can jump ahead:
// ?scene=Stage&stage=stage-2&hero=block
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    makeArt(this);
    if (import.meta.env.DEV) {
      const params = new URLSearchParams(window.location.search);
      const scene = params.get('scene');
      if (scene) {
        this.scene.start(scene, {
          stageId: params.get('stage') ?? 'stage-1',
          ...(params.get('hero') ? { hero: params.get('hero') } : {}),
        });
        return;
      }
    }
    this.scene.start('Splash');
  }
}
