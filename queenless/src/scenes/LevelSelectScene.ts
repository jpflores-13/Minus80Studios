import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { progress } from '../config/progress';
import { LEVELS } from '../levels';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';
import { clearedCount } from './TitleScene';

// Every level, with its best score and stars. A level opens once the one before it is cleared.
export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelect');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.night);
    const { width, height } = this.scale;
    const cleared = clearedCount();
    addCenteredText(this, 60, 'LEVELS', TEXT_STYLES.title);
    new Menu(
      this,
      [
        ...LEVELS.map((l) => {
          const best = progress().best[l.id];
          return {
            label: () => {
              const score = best
                ? `  ${'★'.repeat(best.stars)}${'☆'.repeat(3 - best.stars)}  ${best.score}`
                : '';
              return `${l.number}. ${l.name.toUpperCase()}${score}`;
            },
            help: l.tagline,
            enabled: () => l.number <= cleared + 1,
            action: () => this.scene.start('Level', { levelId: l.id }),
          };
        }),
        { label: () => 'BACK', action: () => this.scene.start('Title') },
      ],
      width / 2,
      130,
      620,
      56,
      () => this.scene.start('Title'),
    );
    addCenteredText(this, height - 26, 'Arrows choose · Enter select · Esc back', TEXT_STYLES.hint);
  }
}
