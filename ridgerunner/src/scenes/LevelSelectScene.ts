import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { progress } from '../config/progress';
import { LEVELS } from '../levels';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelect');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.forest);
    const { width, height } = this.scale;
    const cleared = LEVELS.filter((l) => progress().best[l.id]).length;
    addCenteredText(this, 60, 'LEVELS', TEXT_STYLES.title);
    new Menu(
      this,
      [
        ...LEVELS.map((l) => {
          const best = progress().best[l.id];
          return {
            label: () =>
              `${l.number}. ${l.name.toUpperCase()}${best ? `  ★${best.stars}  ${best.score}` : ''}`,
            help: l.tagline,
            action: () => this.scene.start('Level', { levelId: l.id }),
          };
        }),
        { label: () => 'BACK', action: () => this.scene.start('Title') },
      ],
      width / 2,
      130,
      640,
      56,
      () => this.scene.start('Title'),
    );
    addCenteredText(
      this,
      height - 30,
      `Arrows choose · Enter play · Esc back · ${LEVELS.length - cleared} not yet crossed`,
      TEXT_STYLES.hint,
    );
  }
}
