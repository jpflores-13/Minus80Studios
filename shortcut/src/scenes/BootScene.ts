import Phaser from 'phaser';
import { checkpoint } from '../systems/run';

// Nothing to load yet: all art is drawn in code.
// Dev builds can jump straight to a scene, with an optional plan and a head start:
// ?scene=Level&level=level-2&nobrief&depots=16&cps=6>,25<&warm=20
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    if (import.meta.env.DEV) {
      const params = new URLSearchParams(window.location.search);
      const scene = params.get('scene');
      if (scene) {
        const list = (key: string) => (params.get(key) ?? '').split(',').filter(Boolean);
        this.scene.start(scene, {
          levelId: params.get('level') ?? 'level-1',
          skipBrief: params.has('nobrief'),
          layout: {
            depots: list('depots').map(Number),
            checkpoints: list('cps').map((c) => checkpoint(parseInt(c), c.endsWith('<') ? -1 : 1)),
          },
          warm: Number(params.get('warm') ?? 0),
        });
        return;
      }
    }
    this.scene.start('Splash');
  }
}
