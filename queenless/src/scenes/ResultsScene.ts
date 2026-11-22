import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import { DID_YOU_KNOW, randomQuickFact } from '../content/science';
import { getLevel, LEVELS } from '../levels';
import { averageHealth, type ColonyState } from '../systems/colony';
import { announce } from '../ui/announce';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

function starsFor(avgHealth: number, thresholds: [number, number, number]): number {
  const [one, two, three] = thresholds;
  if (avgHealth >= three) return 3;
  if (avgHealth >= two) return 2;
  if (avgHealth >= one) return 1;
  return 0;
}

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super('Results');
  }

  create(data: { levelId?: string; queenlessMode?: boolean; colony: ColonyState }): void {
    const { width } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.night);
    sound.stopSong();
    sound.playSong('title');

    if (data.queenlessMode) this.showQueenless(data.colony);
    else this.showCampaign(data.levelId ?? 'level-1', data.colony);

    const fact = randomQuickFact(Math.floor(data.colony.time * 1000));
    addCenteredText(this, 500, `${DID_YOU_KNOW} ${fact}`, {
      ...TEXT_STYLES.small,
      color: PALETTE.textDim,
      wordWrap: { width: width - 160 },
      align: 'center',
    });
  }

  private showQueenless(colony: ColonyState): void {
    const { width } = this.scale;
    const avg = Math.round(averageHealth(colony));
    const seconds = Math.floor(colony.time);
    const scoreVal = Math.round(colony.time + avg);
    const old = progress().bestQueenless;
    const isBest = scoreVal > old.score;
    if (isBest) saveProgress({ bestQueenless: { score: scoreVal, seconds } });

    addCenteredText(this, 110, 'THE COLONY COLLAPSED', {
      ...TEXT_STYLES.title,
      fontSize: '48px',
      color: PALETTE.textRed,
    });
    if (isBest)
      addCenteredText(this, 170, 'NEW BEST', { ...TEXT_STYLES.hud, color: PALETTE.textGold });
    const lines = [
      `Survived            ${seconds}s`,
      `Average health      ${avg}`,
      `Score               ${scoreVal}`,
      `Best so far         ${Math.max(scoreVal, old.score)}`,
    ];
    this.add.text(width / 2 - 230, 220, lines.join('\n'), {
      ...TEXT_STYLES.small,
      fontSize: '22px',
      lineSpacing: 8,
      fontFamily: 'monospace',
    });
    announce(
      `The colony collapsed after ${seconds} seconds. Score ${scoreVal}. Press R to try again.`,
    );
    this.input.keyboard?.on('keydown-R', () => this.scene.start('Level', { queenlessMode: true }));
    new Menu(
      this,
      [
        {
          label: () => 'TRY AGAIN (R)',
          action: () => this.scene.start('Level', { queenlessMode: true }),
        },
        { label: () => 'EXPLORE THE SCIENCE', action: () => this.scene.start('Ending') },
        { label: () => 'TITLE', action: () => this.scene.start('Title') },
      ],
      width / 2,
      360,
      440,
      70,
      () => this.scene.start('Title'),
    );
  }

  private showCampaign(levelId: string, colony: ColonyState): void {
    const { width } = this.scale;
    const level = getLevel(levelId);
    const avg = Math.round(averageHealth(colony));
    const stars = starsFor(avg, level.stars);
    const old = progress().best[level.id];
    const isNewBest = stars > 0 && (!old || avg > old.score);
    if (isNewBest)
      saveProgress({
        best: {
          ...progress().best,
          [level.id]: { score: avg, stars: Math.max(stars, old?.stars ?? 0) },
        },
      });

    addCenteredText(this, 90, stars > 0 ? 'THE COLONY HELD TOGETHER' : 'THE COLONY STRUGGLED', {
      ...TEXT_STYLES.title,
      fontSize: '42px',
      color: stars > 0 ? PALETTE.textGold : PALETTE.textRed,
    });
    addCenteredText(this, 160, '★'.repeat(stars) + '☆'.repeat(3 - stars), {
      ...TEXT_STYLES.display,
      fontSize: '56px',
      color: PALETTE.textGold,
    });
    const lines = [`Average health      ${avg}`, `Score               ${avg}`];
    this.add.text(width / 2 - 200, 230, lines.join('\n'), {
      ...TEXT_STYLES.small,
      fontSize: '22px',
      lineSpacing: 8,
      fontFamily: 'monospace',
    });
    announce(
      `${stars > 0 ? `Level cleared, ${stars} stars.` : 'The colony struggled.'} Press R to try again.`,
    );
    this.input.keyboard?.on('keydown-R', () => this.scene.start('Level', { levelId: level.id }));

    const nextLevel = LEVELS.find((l) => l.number === level.number + 1);
    new Menu(
      this,
      [
        {
          label: () => 'TRY AGAIN (R)',
          action: () => this.scene.start('Level', { levelId: level.id }),
        },
        ...(stars > 0 && nextLevel
          ? [
              {
                label: () => `NEXT: ${nextLevel.name.toUpperCase()}`,
                action: () => this.scene.start('Level', { levelId: nextLevel.id }),
              },
            ]
          : []),
        ...(stars > 0
          ? [{ label: () => 'EXPLORE THE SCIENCE', action: () => this.scene.start('Ending') }]
          : []),
        { label: () => 'LEVELS', action: () => this.scene.start('LevelSelect') },
        { label: () => 'TITLE', action: () => this.scene.start('Title') },
      ],
      width / 2,
      360,
      460,
      66,
      () => this.scene.start('Title'),
    );
  }
}
