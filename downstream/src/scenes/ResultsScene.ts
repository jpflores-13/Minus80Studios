import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress, recordResult } from '../config/progress';
import { DID_YOU_KNOW, randomQuickFact } from '../content/science';
import { getLevel, LEVELS } from '../levels';
import { performance, stars, type Tally } from '../systems/score';
import { Button } from '../ui/Button';
import { announce } from '../ui/announce';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

export interface ResultsData {
  levelId: string;
  tally: Tally;
  used: number;
  total: number;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

// Level results, straight from the simulation's bookkeeping.
export class ResultsScene extends Phaser.Scene {
  constructor() {
    super('Results');
  }

  create(data: ResultsData): void {
    const level = getLevel(data.levelId, progress().climate);
    const t = data.tally;
    const perf = performance(t);
    const earned = stars(perf, level.stars);
    const passed = perf >= level.target;
    recordResult(level.id, perf, earned, t);
    const index = LEVELS.findIndex((l) => l.id === level.id);
    const next = LEVELS[index + 1];
    const isLast = index === LEVELS.length - 1;

    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.cream);
    this.cameras.main.fadeIn(400);
    sound.play(passed ? 'win' : 'lose');

    addCenteredText(
      this,
      60,
      passed ? 'WATERSHED PROTECTED' : 'TOO MUCH REACHED THE OCEAN',
      TEXT_STYLES.title,
    );
    addCenteredText(this, 112, `Level ${level.number} · ${level.name}`, TEXT_STYLES.hint);

    for (let i = 0; i < 3; i++) {
      const star = this.add
        .star(width / 2 + (i - 1) * 80, 190, 5, 16, 36, i < earned ? 0xf2b632 : PALETTE.creamDark)
        .setStrokeStyle(3, PALETTE.ink)
        .setScale(0);
      this.tweens.add({
        targets: star,
        scale: 1,
        duration: 300,
        delay: 300 + i * 250,
        ease: 'Back.easeOut',
        onStart: () => i < earned && sound.play('star'),
      });
    }
    addCenteredText(
      this,
      242,
      `${earned} / 3 stars    ·    ★ ${pct(level.stars.one)}   ★★ ${pct(level.stars.two)}   ★★★ ${pct(level.stars.three)}`,
      TEXT_STYLES.small,
    );
    addCenteredText(
      this,
      288,
      `Kept out of the ocean: ${pct(perf)}   (goal ${pct(level.target)})`,
      {
        ...TEXT_STYLES.body,
        fontSize: '28px',
      },
    );

    const rows: [string, string | number][] = [
      ['Potential litter', t.potential],
      ['Prevented at the source', t.prevented],
      ['Caught by traps and filters', t.intercepted],
      ['Hauled away by cleanup crews', t.removed],
      ['Reached the ocean', t.escaped],
      ['Still out in the environment', t.mobile + t.retained],
      ['Equipment used', `${data.used} / ${data.total}`],
    ];
    rows.forEach(([label, value], i) => {
      this.add.text(width / 2 - 260, 330 + i * 30, label, TEXT_STYLES.body);
      this.add.text(width / 2 + 260, 330 + i * 30, String(value), TEXT_STYLES.body).setOrigin(1, 0);
    });
    announce(
      `${passed ? 'Watershed protected.' : 'Too much reached the ocean.'} Level ${level.number}, ${level.name}. ` +
        `${earned} of 3 stars. Kept ${pct(perf)} of the litter out of the ocean; the goal was ${pct(level.target)}. ` +
        rows.map(([label, value]) => `${label}: ${value}`).join('. ') +
        `. Press ${passed ? 'Enter for the ' + (isLast ? 'ending' : 'next level') + ', ' : 'Enter or '}R to replay, L for levels, H for home.`,
    );
    const best = progress().levels[level.id];
    if (best)
      addCenteredText(this, 548, `Your best: ${pct(best.bestPerformance)}`, TEXT_STYLES.hint);

    const fact = randomQuickFact(Math.floor(perf * 1000) + t.escaped);
    addCenteredText(this, 600, `${DID_YOU_KNOW} ${fact}`, {
      ...TEXT_STYLES.small,
      color: PALETTE.textDim,
      wordWrap: { width: width - 260 },
      align: 'center',
    });

    new Button(this, 70, 36, 110, 40, 'HOME  [H]', () => this.scene.start('Title'), PALETTE.ink);
    this.input.keyboard?.once('keydown-H', () => this.scene.start('Title'));
    const replay = () => this.scene.start('Level', { levelId: level.id });
    const goNext = () =>
      isLast
        ? this.scene.start('Ending', {})
        : next && this.scene.start('Level', { levelId: next.id });
    const y = height - 60;
    new Button(this, width / 2 - 300, y, 240, 56, 'REPLAY  [R]', replay, PALETTE.ink);
    new Button(
      this,
      width / 2,
      y,
      240,
      56,
      'LEVELS  [L]',
      () => this.scene.start('LevelSelect'),
      PALETTE.ink,
    );
    if (passed)
      new Button(
        this,
        width / 2 + 300,
        y,
        240,
        56,
        isLast ? 'THE ENDING  [ENTER]' : 'NEXT LEVEL  [ENTER]',
        goNext,
        PALETTE.warn,
      );

    const kb = this.input.keyboard;
    kb?.once('keydown-R', replay);
    kb?.once('keydown-L', () => this.scene.start('LevelSelect'));
    kb?.once('keydown-ENTER', passed ? goNext : replay);
  }
}
