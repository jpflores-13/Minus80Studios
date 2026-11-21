import Phaser from 'phaser';
import { makeArt } from '../render/art';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    makeArt(this);
    this.scene.start('Splash');
  }
}
