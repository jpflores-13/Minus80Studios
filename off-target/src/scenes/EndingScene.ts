import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { saveProgress } from '../config/progress';
import { CLOSING_LINE, ENDING_LINES, ENDING_PAGES } from '../content/science';
import { announce } from '../ui/announce';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

// The ending: the arcade lines, then the pages from content/science.ts, then the closing card.
export class EndingScene extends Phaser.Scene {
  private page = -1;
  private items: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('Ending');
  }

  create(): void {
    this.page = -1;
    this.items = [];
    this.cameras.main.setBackgroundColor(PALETTE.night);
    saveProgress({ seenEnding: true });
    addCenteredText(
      this,
      this.scale.height - 28,
      'Enter, tap or A: next · Esc: back to title',
      TEXT_STYLES.hint,
    );
    this.input.on('pointerup', () => this.next());
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) =>
      e.key === 'Escape' ? this.scene.start('Title') : this.next(),
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.input.keyboard?.removeAllListeners(),
    );
    sound.playSong('title');
    this.next();
  }

  private next(): void {
    for (const o of this.items) o.destroy();
    this.items = [];
    this.page++;
    const { width, height } = this.scale;
    const add = (o: Phaser.GameObjects.GameObject) => this.items.push(o);
    if (this.page === 0) {
      add(this.add.image(width / 2 - 120, height * 0.32, 'ace-idle').setScale(9));
      add(this.add.image(width / 2 + 120, height * 0.34, 'gene').setScale(5));
      ENDING_LINES.forEach((l, i) =>
        add(
          addCenteredText(this, height * 0.58 + i * 60, l, {
            ...TEXT_STYLES.title,
            color: i ? PALETTE.textMint : PALETTE.textGold,
          }),
        ),
      );
      announce(ENDING_LINES.join(' '));
      return;
    }
    const p = ENDING_PAGES[this.page - 1];
    if (p) {
      add(addCenteredText(this, 90, p.title.toUpperCase(), TEXT_STYLES.title));
      add(
        addCenteredText(this, height / 2, p.body.join('\n\n'), {
          ...TEXT_STYLES.body,
          align: 'center',
          wordWrap: { width: 980 },
          lineSpacing: 6,
        }),
      );
      announce(`${p.title}. ${p.body.join(' ')}`);
      return;
    }
    if (this.page === ENDING_PAGES.length + 1) {
      add(
        addCenteredText(this, height / 2 - 40, CLOSING_LINE, {
          ...TEXT_STYLES.title,
          color: PALETTE.textGold,
        }),
      );
      add(
        addCenteredText(
          this,
          height / 2 + 40,
          'Produced by Minus 80 Studios · Play the discovery.',
          TEXT_STYLES.hud,
        ),
      );
      add(
        addCenteredText(this, height / 2 + 100, '-80', {
          ...TEXT_STYLES.display,
          fontSize: '64px',
          color: '#f4f0ff',
        }),
      );
      announce(`${CLOSING_LINE} Produced by Minus 80 Studios.`);
      return;
    }
    this.scene.start('Title');
  }
}
