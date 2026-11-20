import Phaser from 'phaser';
import { CHARACTER_ORDER, CHARACTERS, unlockedCharacters } from '../content/characters';
import { PALETTE } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import { LEVELS } from '../levels';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

/** How many levels have ever been cleared, used to gate both levels and characters. */
export function clearedCount(): number {
  return LEVELS.filter((l) => progress().best[l.id]).length;
}

// Every level, with best score and stars, plus a character toggle. A level is open once the one
// before it has been cleared; a character unlocks the same way (see content/characters.ts).
export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelect');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.charcoal);
    const { width, height } = this.scale;
    const cleared = clearedCount();
    addCenteredText(this, 60, 'LEVELS', TEXT_STYLES.title);
    const menu: Menu = new Menu(
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
            enabled: () => l.number <= cleared + 1,
            action: () => this.scene.start('Level', { levelId: l.id }),
          };
        }),
        {
          label: () => `MOLE: ${CHARACTERS[progress().character].name}`,
          help: CHARACTERS[progress().character].line,
          action: () => {
            const ids = unlockedCharacters(cleared);
            const i = ids.indexOf(progress().character);
            saveProgress({ character: ids[(i + 1) % ids.length] ?? 'diggy' });
            menu.refresh();
          },
        },
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
      height - 26,
      `Arrows choose · Enter play · Esc back · ${CHARACTER_ORDER.length - unlockedCharacters(cleared).length} moles still locked`,
      TEXT_STYLES.hint,
    );
  }
}
