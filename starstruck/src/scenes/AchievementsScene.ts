import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { ACHIEVEMENT_ORDER, ACHIEVEMENTS } from '../content/achievements';
import { PALETTE } from '../config/gameConfig';
import { progress } from '../config/progress';
import { announce } from '../ui/announce';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

const COLS = 2;

// A static grid of all ten milestones, locked or not. No action here beyond going back, so any
// key or tap returns to the title, same as a results or ending page.
export class AchievementsScene extends Phaser.Scene {
  constructor() {
    super('Achievements');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.charcoal).fadeIn(200);
    const have = new Set(progress().achievements);
    addCenteredText(this, 50, 'ACHIEVEMENTS', TEXT_STYLES.title);
    addCenteredText(this, 90, `${have.size} / ${ACHIEVEMENT_ORDER.length} unlocked`, {
      ...TEXT_STYLES.hud,
      color: PALETTE.textDim,
    });

    const cellW = (width - 120) / COLS;
    const cellH = 100;
    const top = 140;
    ACHIEVEMENT_ORDER.forEach((id, i) => {
      const def = ACHIEVEMENTS[id];
      const unlocked = have.has(id);
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = 60 + col * cellW;
      const y = top + row * cellH;
      this.add
        .text(x, y, unlocked ? '★' : '☆', {
          ...TEXT_STYLES.title,
          fontSize: '32px',
          color: unlocked ? PALETTE.textAmber : PALETTE.textDim,
        })
        .setOrigin(0, 0.5);
      this.add
        .text(x + 44, y - 14, def.name.toUpperCase(), {
          ...TEXT_STYLES.hud,
          fontSize: '18px',
          color: unlocked ? PALETTE.text : PALETTE.textDim,
        })
        .setOrigin(0, 0.5);
      this.add
        .text(x + 44, y + 12, def.description, {
          ...TEXT_STYLES.small,
          color: PALETTE.textDim,
          wordWrap: { width: cellW - 60 },
        })
        .setOrigin(0, 0.5);
    });

    addCenteredText(this, height - 30, 'Press any key or tap to go back', TEXT_STYLES.hint);
    const back = () => this.scene.start('Title');
    this.input.once('pointerup', back);
    this.input.keyboard?.once('keydown', back);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.input.keyboard?.removeAllListeners(),
    );
    announce(
      `Achievements. ${have.size} of ${ACHIEVEMENT_ORDER.length} unlocked. ${ACHIEVEMENT_ORDER.map((id) => `${ACHIEVEMENTS[id].name}${have.has(id) ? ', unlocked' : ', locked'}`).join('. ')}.`,
    );
    sound.playSong('title');
  }
}
