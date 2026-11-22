import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { saveProgress } from '../config/progress';
import { CLOSING_LINE, DID_YOU_KNOW, ENDING_PAGES } from '../content/science';
import { announce } from '../ui/announce';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

export class EndingScene extends Phaser.Scene {
  private page = -1;
  private items: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('Ending');
  }

  create(): void {
    this.page = -1;
    this.items = [];
    this.cameras.main.setBackgroundColor(PALETTE.ink);
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
    this.next();
  }

  private next(): void {
    for (const i of this.items) i.destroy();
    this.items = [];
    const { width, height } = this.scale;
    this.page++;
    if (this.page === 0) {
      const t = addCenteredText(this, height / 2, DID_YOU_KNOW, {
        ...TEXT_STYLES.display,
        fontSize: '56px',
      });
      this.items.push(t);
      announce(DID_YOU_KNOW);
      return;
    }
    const pageIndex = this.page - 1;
    if (pageIndex < ENDING_PAGES.length) {
      const p = ENDING_PAGES[pageIndex]!;
      const title = addCenteredText(this, 90, p.title, TEXT_STYLES.title);
      const body = this.add
        .text(width / 2, 160, p.body.join('\n\n'), {
          ...TEXT_STYLES.body,
          wordWrap: { width: Math.min(900, width - 160) },
        })
        .setOrigin(0.5, 0);
      this.items.push(title, body);
      let y = body.y + body.height + 20;
      for (const ref of p.research ?? []) {
        const r = this.add
          .text(width / 2, y, ref.url ? `${ref.label}\n${ref.url}` : ref.label, {
            ...TEXT_STYLES.small,
            color: PALETTE.textDim,
            align: 'center',
          })
          .setOrigin(0.5, 0);
        this.items.push(r);
        y += r.height + 10;
      }
      announce(`${p.title}. ${p.body.join(' ')}`);
      return;
    }
    const closing = addCenteredText(this, height / 2, CLOSING_LINE, {
      ...TEXT_STYLES.title,
      color: PALETTE.textGold,
    });
    this.items.push(closing);
    announce(CLOSING_LINE);
    this.page = -2; // next tap returns to title
    this.input.once('pointerup', () => this.scene.start('Title'));
    this.input.keyboard?.once('keydown', () => this.scene.start('Title'));
  }
}
