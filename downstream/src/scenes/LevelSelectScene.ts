import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { isUnlocked, progress } from '../config/progress';
import { LEVELS } from '../levels';
import { Button } from '../ui/Button';
import { announce } from '../ui/announce';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelect');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.cream);
    addCenteredText(this, 60, 'CHOOSE A WATERSHED', TEXT_STYLES.title);
    const ids = LEVELS.map((l) => l.id);
    const targets = LEVELS.map((l) => l.target);

    announce(
      'Choose a watershed. ' +
        LEVELS.map((level, i) => {
          const rec = progress().levels[level.id];
          if (!isUnlocked(ids, i, targets)) return `${level.number}, locked`;
          return `${level.number}, ${level.name}${rec ? `, ${rec.bestStars} stars` : ''}`;
        }).join('. ') +
        '. Press a number to play, Escape to go back.',
    );
    LEVELS.forEach((level, i) => {
      const y = 150 + i * 88;
      const open = isUnlocked(ids, i, targets);
      const rec = progress().levels[level.id];
      const starText = rec ? '★'.repeat(rec.bestStars) + '☆'.repeat(3 - rec.bestStars) : '☆☆☆';
      const label = open
        ? `${level.number}. ${level.name}     ${starText}${rec ? `   best ${Math.round(rec.bestPerformance * 100)}%` : ''}`
        : `${level.number}. Locked: pass level ${level.number - 1} first`;
      const b = new Button(
        this,
        width / 2,
        y,
        720,
        70,
        label,
        () => open && this.scene.start('Level', { levelId: level.id }),
        open ? PALETTE.accent : 0x9a9a9a,
      );
      if (!open) b.bg.setAlpha(0.5);
      this.input.keyboard?.on(
        `keydown-${['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'][i]}`,
        () => open && this.scene.start('Level', { levelId: level.id }),
      );
    });

    new Button(
      this,
      width / 2,
      height - 50,
      240,
      52,
      'BACK  [ESC]',
      () => this.scene.start('Title'),
      PALETTE.ink,
    );
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('Title'));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.input.keyboard?.removeAllListeners(),
    );
  }
}
