import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { getLevel } from '../levels';
import { performance, stars, type Tally } from '../systems/score';
import { Button } from '../ui/Button';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

export interface ResultsData {
  levelId: string;
  tally: Tally;
  used: number;
  total: number;
}

/** Level results computed from the actual simulation (never hard-coded). */
export class ResultsScene extends Phaser.Scene {
  constructor() {
    super('Results');
  }

  create(data: ResultsData): void {
    const level = getLevel(data.levelId);
    const t = data.tally;
    const perf = performance(t);
    const earned = stars(perf, level.stars);
    const passed = perf >= level.target;
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.cream);
    this.cameras.main.fadeIn(400);

    addCenteredText(
      this,
      70,
      passed ? 'WATERSHED PROTECTED' : 'TOO MUCH REACHED THE OCEAN',
      TEXT_STYLES.title,
    );
    addCenteredText(this, 128, `Level ${level.number} · ${level.name}`, TEXT_STYLES.hint);

    // Stars: filled vs. outlined shapes (not colour alone), with text.
    for (let i = 0; i < 3; i++) {
      const star = this.add.star(
        width / 2 + (i - 1) * 80,
        210,
        5,
        16,
        36,
        i < earned ? 0xf2b632 : PALETTE.creamDark,
      );
      star.setStrokeStyle(3, PALETTE.ink);
    }
    addCenteredText(
      this,
      262,
      `${earned} / 3 stars   ·   ★ ${pct(level.stars.one)}  ★★ ${pct(level.stars.two)}  ★★★ ${pct(level.stars.three)}`,
      TEXT_STYLES.small,
    );

    addCenteredText(
      this,
      312,
      `Kept out of the ocean: ${pct(perf)}   (goal ${pct(level.target)})`,
      {
        ...TEXT_STYLES.body,
        fontSize: '28px',
      },
    );
    const rows = [
      ['Potential litter generated', t.potential],
      ['Prevented at the source (bins)', t.prevented],
      ['Intercepted (traps)', t.intercepted],
      ['Permanently removed', t.removed],
      ['Reached the ocean', t.escaped],
      ['Still in the environment', t.mobile + t.retained],
      ['Equipment used', `${data.used} / ${data.total}`],
    ] as const;
    rows.forEach(([label, value], i) => {
      this.add.text(width / 2 - 250, 360 + i * 32, label, TEXT_STYLES.body);
      this.add.text(width / 2 + 250, 360 + i * 32, String(value), TEXT_STYLES.body).setOrigin(1, 0);
    });

    new Button(this, width / 2 - 150, height - 70, 240, 60, 'REPLAY LEVEL  [R]', () =>
      this.replay(),
    );
    new Button(
      this,
      width / 2 + 150,
      height - 70,
      240,
      60,
      'TITLE  [T]',
      () => this.scene.start('Title'),
      PALETTE.ink,
    );
    this.input.keyboard?.once('keydown-R', () => this.replay());
    this.input.keyboard?.once('keydown-ENTER', () => this.replay());
    this.input.keyboard?.once('keydown-T', () => this.scene.start('Title'));
  }

  private replay(): void {
    this.scene.start('Level', { levelId: (this.scene.settings.data as ResultsData).levelId });
  }
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
