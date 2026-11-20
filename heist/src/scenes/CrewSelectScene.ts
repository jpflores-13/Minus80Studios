import Phaser from 'phaser';
import { CREW, CREW_ORDER, unlockedCrew, type CrewId } from '../content/crew';
import { PALETTE } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import { makeArt, makeThief } from '../render/art';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';
import { clearedCount } from './JobSelectScene';

// Pick who runs the next job. Locked crew members are still listed, so the player knows what's
// coming, but can't be picked yet.
export class CrewSelectScene extends Phaser.Scene {
  constructor() {
    super('CrewSelect');
  }

  create(): void {
    makeArt(this);
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.navy);
    addCenteredText(this, 50, 'CHOOSE YOUR CREW', TEXT_STYLES.title);
    const cleared = clearedCount();
    const unlocked = unlockedCrew(cleared);
    const pick = (id: CrewId) => {
      saveProgress({ crew: id });
      this.scene.start('JobSelect');
    };
    CREW_ORDER.forEach((id, i) => {
      const c = CREW[id];
      const x = width / 2 + (i - (CREW_ORDER.length - 1) / 2) * 220;
      const open = unlocked.includes(id);
      this.add
        .image(x, 190, makeThief(this, c))
        .setScale(open ? 1 : 0.7)
        .setAlpha(open ? 1 : 0.4);
      this.add
        .text(
          x,
          260,
          open
            ? `${c.name}\n\n${c.line}\n\n${c.special}`
            : `${c.name}\n\nUnlocks after Job ${c.unlockedAfter}`,
          { ...TEXT_STYLES.small, align: 'center', color: open ? PALETTE.text : PALETTE.textDim },
        )
        .setOrigin(0.5, 0);
    });
    new Menu(
      this,
      unlocked.map((id) => ({
        label: () => `RUN WITH ${CREW[id].name}`,
        action: () => pick(id),
      })),
      width / 2,
      height - 60 - (unlocked.length - 1) * 54,
      420,
      54,
      () => this.scene.start('JobSelect'),
    ).focus(Math.max(0, unlocked.indexOf(progress().crew)), false);
  }
}
