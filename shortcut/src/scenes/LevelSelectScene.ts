import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { isUnlocked, progress } from '../config/progress';
import { LEVELS } from '../levels';
import { announce } from '../ui/announce';
import { starText } from '../ui/stars';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

// Pick a level. Arrow keys or number keys, Enter to play, Esc for the title.
export class LevelSelectScene extends Phaser.Scene {
  private index = 0;
  private cards: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super('LevelSelect');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.cream);
    addCenteredText(this, 70, 'FERNGATE', TEXT_STYLES.title);
    addCenteredText(this, 120, 'Choose a level', TEXT_STYLES.hint);
    const ids = LEVELS.map((l) => l.id);
    this.cards = LEVELS.map((level, i) => {
      const x = width / 2 + (i - 1) * 380;
      const open = isUnlocked(ids, i);
      const record = progress().levels[level.id];
      const card = this.add
        .rectangle(x, height / 2, 340, 300, open ? 0xffffff : PALETTE.creamDark)
        .setStrokeStyle(2, PALETTE.ink);
      this.add
        .text(x, height / 2 - 110, `${level.number}`, { ...TEXT_STYLES.title, fontSize: '48px' })
        .setOrigin(0.5);
      this.add
        .text(x, height / 2 - 50, level.name, {
          ...TEXT_STYLES.body,
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 300 },
        })
        .setOrigin(0.5);
      this.add
        .text(x, height / 2 + 10, level.tagline, {
          ...TEXT_STYLES.small,
          align: 'center',
          wordWrap: { width: 290 },
          color: PALETTE.textDim,
        })
        .setOrigin(0.5);
      this.add
        .text(
          x,
          height / 2 + 95,
          open ? starText(record?.bestStars ?? 0) : 'Locked: pass the level before',
          {
            ...TEXT_STYLES.body,
            fontSize: open ? '34px' : '17px',
            color: open ? '#a8740f' : PALETTE.textDim,
          },
        )
        .setOrigin(0.5);
      if (open) {
        card.setInteractive({ useHandCursor: true });
        card.on('pointerover', () => this.select(i));
        card.on('pointerup', () => this.play(i));
      }
      return card;
    });
    addCenteredText(this, height - 60, '← → choose · ENTER play · ESC back', TEXT_STYLES.hint);
    const back = addCenteredText(this, height - 110, '◂ BACK TO TITLE', {
      ...TEXT_STYLES.body,
      fontStyle: 'bold',
    }).setInteractive({ useHandCursor: true });
    back.on('pointerup', () => this.scene.start('Title'));

    const kb = this.input.keyboard;
    kb?.on('keydown', (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') this.select(this.index - 1);
      else if (e.key === 'ArrowRight') this.select(this.index + 1);
      else if (e.key === 'Enter' || e.key === ' ') this.play(this.index);
      else if (e.key === 'Escape') this.scene.start('Title');
      else if (/^[1-9]$/.test(e.key)) this.play(Number(e.key) - 1);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => kb?.removeAllListeners());
    const firstOpen = LEVELS.findIndex(
      (l, i) => isUnlocked(ids, i) && !progress().levels[l.id]?.passed,
    );
    this.select(firstOpen === -1 ? 0 : firstOpen);
  }

  private select(i: number): void {
    const n = LEVELS.length;
    this.index = (i + n) % n;
    this.cards.forEach((c, j) =>
      c.setStrokeStyle(j === this.index ? 5 : 2, j === this.index ? PALETTE.goldDark : PALETTE.ink),
    );
    const level = LEVELS[this.index];
    if (!level) return;
    const open = isUnlocked(
      LEVELS.map((l) => l.id),
      this.index,
    );
    const stars = progress().levels[level.id]?.bestStars ?? 0;
    announce(
      `Level ${level.number}, ${level.name}. ${level.tagline} ${open ? `${stars} of 3 stars.` : 'Locked.'}`,
    );
  }

  private play(i: number): void {
    const level = LEVELS[i];
    if (
      !level ||
      !isUnlocked(
        LEVELS.map((l) => l.id),
        i,
      )
    ) {
      sound.play('deny');
      announce('That level is locked. Pass the one before it first.');
      return;
    }
    sound.unlock();
    sound.play('click');
    const layout = progress().levels[level.id]?.layout;
    this.scene.start('Level', layout ? { levelId: level.id, layout } : { levelId: level.id });
  }
}
