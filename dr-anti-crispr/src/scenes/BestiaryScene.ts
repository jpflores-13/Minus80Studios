import Phaser from 'phaser';
import { BESTIARY_ORDER, BEHAVIOUR } from '../content/bestiary';
import { ENEMIES } from '../content/arsenal';
import { PALETTE } from '../config/gameConfig';
import { progress } from '../config/progress';
import { announce } from '../ui/announce';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

const COLS = 2;

// Enemy Intel: what each machine does, unlocked the first time you meet it in a run. A boss
// stays "???" until you've actually faced it, so nothing here spoils a fight ahead of time.
export class BestiaryScene extends Phaser.Scene {
  constructor() {
    super('Bestiary');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.night).fadeIn(200);
    const seen = new Set(progress().encountered);
    addCenteredText(this, 50, 'ENEMY INTEL', TEXT_STYLES.title);
    addCenteredText(this, 88, `${seen.size} / ${BESTIARY_ORDER.length} met`, {
      ...TEXT_STYLES.hud,
      color: PALETTE.textDim,
    });

    const cellW = (width - 120) / COLS;
    const top = 140;
    const cellH = (height - top - 60) / Math.ceil(BESTIARY_ORDER.length / COLS);
    BESTIARY_ORDER.forEach((kind, i) => {
      const def = ENEMIES[kind];
      const known = seen.has(kind);
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = 60 + col * cellW;
      const y = top + row * cellH;
      if (known) this.add.image(x + 30, y + 24, `${kind}-0`).setScale(1.6);
      else
        this.add
          .text(x + 30, y + 24, '?', { ...TEXT_STYLES.title, color: PALETTE.textDim })
          .setOrigin(0.5);
      this.add
        .text(x + 70, y, known ? def.name : '???', {
          ...TEXT_STYLES.hud,
          fontSize: '18px',
          color: known ? PALETTE.text : PALETTE.textDim,
        })
        .setOrigin(0, 0.5);
      this.add
        .text(x + 70, y + 24, known ? BEHAVIOUR[kind] : 'Not encountered yet.', {
          ...TEXT_STYLES.small,
          color: PALETTE.textDim,
          wordWrap: { width: cellW - 90 },
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
      `Enemy intel. ${seen.size} of ${BESTIARY_ORDER.length} met. ${BESTIARY_ORDER.map((k) =>
        seen.has(k) ? `${ENEMIES[k].name}: ${BEHAVIOUR[k]}` : '',
      )
        .filter(Boolean)
        .join(' ')}`,
    );
  }
}
