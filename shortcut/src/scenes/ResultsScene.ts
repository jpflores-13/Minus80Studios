import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { recordResult } from '../config/progress';
import { getLevel, LEVELS } from '../levels';
import { drawHeatmap } from '../render/charts';
import { contactMap } from '../systems/contacts';
import type { Layout, Run } from '../systems/run';
import { formatValue, scoreRun, type Score } from '../systems/score';
import { announce } from '../ui/announce';
import { Button } from '../ui/Button';
import { starText } from '../ui/stars';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

interface ResultsData {
  levelId: string;
  layout: Layout;
  run: Run;
}

// End of a level: stars, what happened, and the City Connectivity Map for that minute.
export class ResultsScene extends Phaser.Scene {
  private actions: { key: string; label: string; run: () => void }[] = [];

  constructor() {
    super('Results');
  }

  create(data: ResultsData): void {
    const level = getLevel(data.levelId);
    const score = scoreRun(level, data.run.city);
    recordResult(level.id, score.value, score.stars, data.layout);
    const { width } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.cream);

    addCenteredText(this, 50, `${level.number} · ${level.name}`, {
      ...TEXT_STYLES.title,
      fontSize: '40px',
    });
    addCenteredText(this, 112, starText(score.stars), {
      ...TEXT_STYLES.title,
      fontSize: '56px',
      color: '#a8740f',
    });
    const headline = score.passed
      ? (['Nicely connected.', 'The city hums.', 'Ferngate thanks you.'][score.stars - 1] ?? '')
      : score.tooManyMixups
        ? 'Too many mix-ups between the districts.'
        : score.tooManyWrong
          ? 'Too many wrong connections: shortcuts joined buildings that can’t use each other.'
          : score.someoneLeftOut
            ? 'Somebody was left out: every open building needs its share.'
            : 'Not quite. Try a different plan?';
    addCenteredText(this, 170, headline, TEXT_STYLES.body);

    const lines = [formatValue(level, score.value)];
    if (level.goal.metric === 'service' && score.perConsumer.length > 1)
      for (const c of score.perConsumer)
        lines.push(`${c.name}: running ${pct(c.uptime)} of the time`);
    if (level.goal.maxMixups !== undefined)
      lines.push(`Mix-ups: ${pct(score.mixups)} (limit ${pct(level.goal.maxMixups)})`);
    if (level.goal.maxWrong !== undefined)
      lines.push(`Wrong connections: ${pct(score.wrong)} (limit ${pct(level.goal.maxWrong)})`);
    lines.push(
      `Machines that came and went: ${data.run.engine.released + data.run.engine.machines.length}`,
    );
    this.add.text(110, 230, lines.join('\n'), { ...TEXT_STYLES.body, lineSpacing: 10 });
    this.add.text(
      110,
      230 + lines.length * 36 + 14,
      'Machines are random, so every run is a\nslightly different day, even with the same plan.',
      {
        ...TEXT_STYLES.small,
        color: PALETTE.textDim,
      },
    );

    drawHeatmap(this, contactMap(data.run.engine), width - 420, 230, 300, {
      title: 'City Connectivity Map',
      note: 'darker = those two addresses were joined more often',
      marks: level.buildings.map((b) => ({ bin: b.bin, label: b.name })),
    });

    const index = LEVELS.findIndex((l) => l.id === level.id);
    const next = LEVELS[index + 1];
    this.actions = [
      {
        key: '1',
        label: 'RUN AGAIN',
        run: () =>
          this.scene.start('Level', { levelId: level.id, layout: data.layout, skipBrief: true }),
      },
      { key: '2', label: 'LEVELS', run: () => this.scene.start('LevelSelect') },
    ];
    if (score.passed && next)
      this.actions.push({
        key: '3',
        label: `NEXT: ${next.name.toUpperCase()}`,
        run: () => this.scene.start('Level', { levelId: next.id }),
      });
    if (score.passed && !next)
      this.actions.push({
        key: '3',
        label: 'WHAT WAS I BUILDING?',
        run: () => this.scene.start('Reveal'),
      });

    const w = 300;
    const total = this.actions.length * w + (this.actions.length - 1) * 24;
    this.actions.forEach((a, i) => {
      const last = i === this.actions.length - 1;
      new Button(
        this,
        width / 2 - total / 2 + w / 2 + i * (w + 24),
        660,
        w,
        54,
        `${a.label} (${a.key})`,
        () => this.go(a.run),
        last && score.passed ? PALETTE.goldDark : PALETTE.accent,
      );
    });
    const kb = this.input.keyboard;
    kb?.on('keydown', (e: KeyboardEvent) => {
      const a =
        this.actions.find((x) => x.key === e.key) ??
        (e.key === 'Enter' ? this.actions[this.actions.length - 1] : undefined);
      if (a) this.go(a.run);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => kb?.removeAllListeners());

    sound.play(score.passed ? 'win' : 'lose');
    announce(
      `${level.name}: ${score.stars} of 3 stars. ${headline} ${lines.join('. ')}. ${this.actions.map((a) => `${a.key}: ${a.label}`).join(', ')}.`,
    );
  }

  private go(action: () => void): void {
    sound.play('click');
    action();
  }
}

function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

export type { Score };
