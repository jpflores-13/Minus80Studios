import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { progress } from '../config/progress';
import { JOBS } from '../levels';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

/** Jobs ever cleared, used to gate both later jobs and crew unlocks. */
export function clearedCount(): number {
  return JOBS.filter((j) => progress().best[j.id]).length;
}

// Every job, with best score, stars and whether it was ever pulled off clean. A job is open
// once the one before it has been cleared.
export class JobSelectScene extends Phaser.Scene {
  constructor() {
    super('JobSelect');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.navy);
    const { width, height } = this.scale;
    const cleared = clearedCount();
    addCenteredText(this, 50, 'JOBS', TEXT_STYLES.title);
    new Menu(
      this,
      [
        ...JOBS.map((j) => {
          const best = progress().best[j.id];
          const clean = progress().perfectCrime[j.id];
          return {
            label: () => {
              const stars = best
                ? `  ${'★'.repeat(best.stars)}${'☆'.repeat(3 - best.stars)}  ${best.score}${clean ? '  PERFECT' : ''}`
                : '';
              return `${j.number}. ${j.name.toUpperCase()}${stars}`;
            },
            enabled: () => j.number <= cleared + 1,
            action: () => this.scene.start('Job', { jobId: j.id }),
          };
        }),
        { label: () => 'CREW', action: () => this.scene.start('CrewSelect') },
        { label: () => 'BACK', action: () => this.scene.start('Title') },
      ],
      width / 2,
      104,
      560,
      54,
      () => this.scene.start('Title'),
    );
    addCenteredText(
      this,
      height - 26,
      'Arrows choose · Enter select · Esc back · A Minus 80 Studios game',
      TEXT_STYLES.hint,
    );
  }
}
