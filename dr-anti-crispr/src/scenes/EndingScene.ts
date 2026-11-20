import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
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
    this.cameras.main.setBackgroundColor(PALETTE.night);
    addCenteredText(
      this,
      this.scale.height - 40,
      'Tap, Enter or A: next · Esc: title',
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
      add(this.add.image(width / 2, height * 0.35, 'doc-4-0').setScale(8));
      add(
        addCenteredText(this, height * 0.6, ENDING_LINE, {
          ...TEXT_STYLES.title,
          fontSize: '34px',
          align: 'center',
          wordWrap: { width: 640 },
        }),
      );
      return announce(ENDING_LINE);
    }

    if (this.page === 1) {
      add(
        addCenteredText(this, height / 2, DID_YOU_KNOW, {
          ...TEXT_STYLES.display,
          fontSize: '56px',
          color: PALETTE.textGold,
        }),
      );
      sound.play('power');
      return announce(DID_YOU_KNOW);
    }

    const p = ENDING_PAGES[this.page - 2];
    if (p) {
      add(
        addCenteredText(this, 160, p.title.toUpperCase(), {
          ...TEXT_STYLES.title,
          fontSize: '30px',
          align: 'center',
          wordWrap: { width: 640 },
        }),
      );
      const bodyY = p.research ? height * 0.42 : height / 2;
      add(
        addCenteredText(this, bodyY, p.body.join('\n\n'), {
          ...TEXT_STYLES.body,
          fontSize: '19px',
          align: 'center',
          wordWrap: { width: 620 },
          lineSpacing: 6,
        }),
      );
      let spoken = `${p.title}. ${p.body.join(' ')}`;
      if (p.research?.length) {
        add(
          addCenteredText(this, height * 0.76, p.research.map((r) => r.label).join('\n'), {
            ...TEXT_STYLES.small,
            fontSize: '14px',
            color: PALETTE.textMint,
            align: 'center',
            wordWrap: { width: 620 },
            lineSpacing: 4,
          }),
        );
        spoken += ` Sources: ${p.research.map((r) => r.label).join('. ')}.`;
      }
      return announce(spoken);
    }

    if (this.page === ENDING_PAGES.length + 2) {
      add(
        addCenteredText(this, height / 2 - 60, CLOSING_LINE, {
          ...TEXT_STYLES.title,
          fontSize: '32px',
          align: 'center',
          wordWrap: { width: 620 },
          color: PALETTE.textGold,
        }),
      );
      add(
        addCenteredText(
          this,
          height / 2 + 60,
          'Produced by Minus 80 Studios.\nPlay the discovery.',
          { ...TEXT_STYLES.hud, align: 'center' },
        ),
      );
      add(
        addCenteredText(this, height / 2 + 180, '-80', {
          ...TEXT_STYLES.display,
          fontSize: '72px',
          color: '#f4f0ff',
        }),
      );
      return announce(`${CLOSING_LINE} Produced by Minus 80 Studios.`);
    }
    this.scene.start('Title');
  }
}
