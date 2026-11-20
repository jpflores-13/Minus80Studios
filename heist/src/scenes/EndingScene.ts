import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { saveProgress } from '../config/progress';
import { CLOSING_LINE, DID_YOU_KNOW, ENDING_LINE, ENDING_PAGES } from '../content/science';
import { announce } from '../ui/announce';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

// The ending: one line, a "DID YOU KNOW?" title card, the pages from content/science.ts (with
// their real, checked references), then the closing card.
export class EndingScene extends Phaser.Scene {
  private page = -1;
  private items: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('Ending');
  }

  create(): void {
    this.page = -1;
    this.items = [];
    this.cameras.main.setBackgroundColor(PALETTE.navy);
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
      add(this.add.image(width / 2, height * 0.34, 'diamond').setScale(6));
      add(
        addCenteredText(this, height * 0.58, ENDING_LINE, {
          ...TEXT_STYLES.title,
          fontSize: '32px',
          color: PALETTE.textGold,
          align: 'center',
          wordWrap: { width: 900 },
        }),
      );
      announce(ENDING_LINE);
      return;
    }

    if (this.page === 1) {
      add(
        addCenteredText(this, height / 2, DID_YOU_KNOW, {
          ...TEXT_STYLES.display,
          fontSize: '72px',
          color: PALETTE.textGold,
        }),
      );
      announce(DID_YOU_KNOW);
      sound.play('win');
      return;
    }

    const p = ENDING_PAGES[this.page - 2];
    if (p) {
      add(
        addCenteredText(this, 76, p.title.toUpperCase(), {
          ...TEXT_STYLES.title,
          fontSize: '34px',
        }),
      );
      const bodyY = p.research ? height * 0.42 : height / 2;
      add(
        addCenteredText(this, bodyY, p.body.join('\n\n'), {
          ...TEXT_STYLES.body,
          align: 'center',
          wordWrap: { width: 980 },
          lineSpacing: 6,
        }),
      );
      let spoken = `${p.title}. ${p.body.join(' ')}`;
      if (p.research?.length) {
        const refLines = p.research.map((r) => r.label).join('\n');
        add(
          addCenteredText(this, height * 0.74, refLines, {
            ...TEXT_STYLES.small,
            fontSize: '16px',
            color: PALETTE.textMint,
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 4,
          }),
        );
        spoken += ` Sources: ${p.research.map((r) => r.label).join('. ')}.`;
      }
      announce(spoken);
      return;
    }

    if (this.page === ENDING_PAGES.length + 2) {
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
          color: PALETTE.text,
        }),
      );
      announce(`${CLOSING_LINE} Produced by Minus 80 Studios.`);
      return;
    }
    this.scene.start('Title');
  }
}
