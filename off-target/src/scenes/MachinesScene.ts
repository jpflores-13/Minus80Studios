import Phaser from 'phaser';
import { BOSSES } from '../content/characters';
import type { BossKind } from '../content/characters';
import { PALETTE } from '../config/gameConfig';
import { announce } from '../ui/announce';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

const ORDER: BossKind[] = ['chop', 'snip'];

// What's actually chasing GENE: a short glossary of the cutting machines, since the opening
// cinematic only has time to introduce CHOP.
export class MachinesScene extends Phaser.Scene {
  constructor() {
    super('Machines');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.night).fadeIn(200);
    addCenteredText(this, 60, 'THE MACHINES', TEXT_STYLES.title);

    const rowH = 220;
    ORDER.forEach((kind, i) => {
      const info = BOSSES[kind];
      const y = 150 + i * rowH;
      this.add.image(width / 2 - 280, y, `${kind}-0`).setScale(5);
      this.add
        .text(width / 2 - 150, y - 50, info.name, { ...TEXT_STYLES.title, fontSize: '32px' })
        .setOrigin(0, 0.5);
      this.add
        .text(width / 2 - 150, y, info.blurb, {
          ...TEXT_STYLES.body,
          wordWrap: { width: 560 },
        })
        .setOrigin(0, 0);
    });

    addCenteredText(this, height - 30, 'Press any key or tap to go back', TEXT_STYLES.hint);
    const back = () => this.scene.start('Title');
    this.input.once('pointerup', back);
    this.input.keyboard?.once('keydown', back);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.input.keyboard?.removeAllListeners(),
    );
    announce(
      `The machines. ${ORDER.map((k) => `${BOSSES[k].name}: ${BOSSES[k].blurb}`).join(' ')}`,
    );
  }
}
