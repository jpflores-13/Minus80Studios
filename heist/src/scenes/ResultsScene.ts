import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import { score, type Mission } from '../systems/mission';
import { announce } from '../ui/announce';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super('Results');
  }

  create(data: { jobId: string; mission: Mission }): void {
    const m = data.mission;
    const won = m.status === 'won';
    const sc = score(m);
    const { width } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.navy);
    const old = progress().best[data.jobId];
    if (won && (!old || sc.total > old.score))
      saveProgress({
        best: {
          ...progress().best,
          [data.jobId]: {
            score: sc.total,
            stars: Math.max(sc.stars, old?.stars ?? 0),
            time: Math.min(m.time, old?.time ?? Infinity),
          },
        },
      });
    addCenteredText(
      this,
      100,
      won
        ? m.everSeen
          ? 'GOT AWAY WITH IT'
          : 'NOBODY SAW ANYTHING'
        : m.lostReason === 'caught'
          ? 'CAUGHT!'
          : 'TOO SLOW',
      {
        ...TEXT_STYLES.title,
        fontSize: '52px',
        color: won ? PALETTE.textGold : PALETTE.textRed,
      },
    );
    if (won)
      addCenteredText(this, 170, '★'.repeat(sc.stars) + '☆'.repeat(3 - sc.stars), {
        ...TEXT_STYLES.display,
        fontSize: '60px',
        color: PALETTE.textGold,
      });
    const lines = won
      ? [
          `The diamond        ${sc.parts.diamond}`,
          `Extra loot         ${sc.parts.loot}`,
          `Time to spare      ${sc.parts.escape}`,
          `Never seen         ${sc.parts.unseen}`,
          `Used a fold        ${sc.parts.folds}`,
          `TOTAL              ${sc.total}`,
          `Time               ${m.time.toFixed(1)}s`,
        ]
      : [
          m.lostReason === 'caught'
            ? 'Security got you. Try the long way round… or make it shorter.'
            : 'The police arrived. Keep a fold ready for the way out.',
        ];
    this.add.text(width / 2 - 230, 240, lines.join('\n'), {
      ...TEXT_STYLES.small,
      fontSize: '22px',
      lineSpacing: 8,
      fontFamily: 'monospace',
    });
    const again = () => this.scene.start('Job', { jobId: data.jobId });
    new Menu(
      this,
      [
        { label: () => 'TRY AGAIN (R)', action: again },
        { label: () => 'TITLE', action: () => this.scene.start('Title') },
      ],
      width / 2,
      560,
      420,
      70,
      () => this.scene.start('Title'),
    );
    this.input.keyboard?.on('keydown-R', again);
    sound.playSong('title');
    announce(
      `${won ? `Clean getaway, ${sc.stars} stars, score ${sc.total}.` : lines[0]} Press R to try again.`,
    );
  }
}
