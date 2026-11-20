import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { progress, record } from '../config/progress';
import { DIFFICULTIES } from '../config/tuning';
import { STAGES } from '../levels';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

// Every stage, with best score, stars and fastest time on the current difficulty.
// A stage is open once the one before it has been cleared.
export class StageSelectScene extends Phaser.Scene {
  private timeTrial = false;

  constructor() {
    super('StageSelect');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.night);
    const { width, height } = this.scale;
    const d = progress().difficulty;
    addCenteredText(this, 50, 'STAGES', TEXT_STYLES.title);
    addCenteredText(this, 96, `Difficulty: ${DIFFICULTIES[d].name}`, TEXT_STYLES.hint);
    const menu: Menu = new Menu(
      this,
      [
        ...STAGES.map((s) => ({
          label: () => {
            const r = record(s.id, d);
            const best = r
              ? `  ${'★'.repeat(r.bestStars)}${'☆'.repeat(3 - r.bestStars)}  ${r.bestScore}  ${r.bestTime.toFixed(1)}s`
              : '';
            return `${s.number}. ${s.name.toUpperCase()}${best}`;
          },
          help: s.tagline,
          enabled: () => s.number <= progress().cleared + 1,
          action: () =>
            s.chooseHero
              ? this.scene.start('HeroSelect', { stageId: s.id, timeTrial: this.timeTrial })
              : this.scene.start('Stage', { stageId: s.id, timeTrial: this.timeTrial }),
        })),
        {
          label: () => `TIME TRIAL CLOCK: ${this.timeTrial ? 'ON' : 'OFF'}`,
          help: 'Shows a stopwatch while you play. Your fastest clears are saved either way.',
          action: () => {
            this.timeTrial = !this.timeTrial;
            menu.refresh();
          },
        },
        { label: () => 'BACK', action: () => this.scene.start('Title') },
      ],
      width / 2,
      150,
      760,
      62,
      () => this.scene.start('Title'),
    );
    addCenteredText(this, height - 26, 'Arrows choose · Enter play · Esc back', TEXT_STYLES.hint);
  }
}
