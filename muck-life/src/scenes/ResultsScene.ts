import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { clearLevel, recordLevel, recordRush } from '../config/progress';
import { CAMPAIGN_LENGTH, CAMPAIGN_META } from '../levels/campaign';
import { emit } from '../integration/yeti';
import { efficiency, performanceTitle, stars, type ScoreStats } from '../systems/scoring';
import { announce } from '../ui/announce';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';
import type { PlayData } from './PlayScene';

export interface ResultsData {
  play: PlayData;
  id: string;
  title: string;
  stats: ScoreStats;
  accuracy: number;
  objectives: { label: string; done: boolean; value: number; n: number }[];
  targetScore: number;
  endReason: 'time' | 'gaps' | 'objectives' | null;
  gameSec: number;
}

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super('Results');
  }

  create(d: ResultsData): void {
    const { width } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.mud);
    const s = d.stats;
    const allDone = d.objectives.every((o) => o.done);
    const campaign = d.play.kind === 'campaign' ? d.play : null;
    const title = performanceTitle(s.score, d.targetScore || s.score, d.accuracy);
    const st = stars(s.score, d.targetScore || 1);
    let newBest = false;
    let beaten: string[] = [];
    if (campaign) {
      newBest = recordLevel(d.id, s.score, st, title);
      if (allDone) clearLevel(campaign.index);
      emit({
        type: 'level_complete',
        levelId: d.id,
        score: s.score,
        accuracy: d.accuracy,
        objectivesMet: allDone,
      });
    } else if (d.play.kind === 'rush') {
      beaten = recordRush(d.play.mode, {
        score: s.score,
        accuracy: d.accuracy,
        combo: s.bestStreak,
        observations: s.observations,
        efficiency: efficiency(s),
      });
      emit({
        type: 'mode_complete',
        mode: d.play.mode,
        score: s.score,
        accuracy: d.accuracy,
        observations: s.observations,
      });
    }
    sound.play(allDone || !campaign ? 'win' : 'fail');
    sound.playSong('title');

    addCenteredText(this, 50, d.title.toUpperCase(), {
      ...TEXT_STYLES.title,
      color: PALETTE.textAmber,
    });
    const headline =
      d.endReason === 'gaps'
        ? 'Too many pools faded undocumented.'
        : campaign
          ? allDone
            ? 'Observation record complete!'
            : 'Record incomplete. Try again, or carry on.'
          : 'Run complete.';
    addCenteredText(this, 100, headline, TEXT_STYLES.body);
    addCenteredText(this, 160, s.score.toLocaleString('en-US'), {
      ...TEXT_STYLES.display,
      fontSize: '72px',
    });
    addCenteredText(
      this,
      214,
      `${d.targetScore ? `${'★'.repeat(st)}${'☆'.repeat(3 - st)}  ` : ''}${title.toUpperCase()}${newBest ? '  ·  NEW BEST' : ''}${beaten.length ? `  ·  NEW RECORD: ${beaten.join(', ').toUpperCase()}` : ''}`,
      { ...TEXT_STYLES.hud, color: PALETTE.textMint },
    );
    const lines = [
      `Unique observations: ${s.observations}`,
      `Accuracy: ${Math.round(d.accuracy * 100)}%  (misses ${s.misses}, repeats ${s.duplicates})`,
      `Longest streak: ×${s.bestStreak}`,
      `Tracked growth: ${s.tracked} · Fresh emergences: ${s.fresh} · Persistent plumes: ${s.persistent}`,
      `By tissue: adventitious tips ${s.byOrgan.adventitious} · rhizome apices ${s.byOrgan.rhizome} · lateral plumes ${s.byOrgan.lateral}`,
      `Night observations: ${s.night}${s.roiEvents ? ` · ROI changes recorded: ${s.roiEvents}` : ''}${s.predictions ? ` · Predictions hit: ${s.predictions}` : ''}`,
    ];
    this.add.text(80, 256, lines.join('\n'), { ...TEXT_STYLES.small, lineSpacing: 6 });
    if (d.objectives.length)
      this.add.text(
        720,
        256,
        'OBJECTIVES\n' +
          d.objectives
            .map((o) => `${o.done ? '✓' : '○'} ${o.label} (${Math.min(o.value, o.n)}/${o.n})`)
            .join('\n'),
        { ...TEXT_STYLES.small, lineSpacing: 6, wordWrap: { width: 500 } },
      );
    if (campaign) {
      const note = CAMPAIGN_META[campaign.index]!.scienceNote;
      this.add
        .text(width / 2, 432, `THE SCIENCE  ${note}`, {
          ...TEXT_STYLES.small,
          color: PALETTE.textCyan,
          align: 'center',
          wordWrap: { width: 1050 },
        })
        .setOrigin(0.5, 0);
    }

    const replay = () => this.scene.start('Play', d.play);
    const items = [];
    if (campaign) {
      const last = campaign.index >= CAMPAIGN_LENGTH - 1;
      items.push({
        label: () =>
          last
            ? 'CONTINUE TO THE DISCOVERY'
            : `NEXT: ${CAMPAIGN_META[campaign.index + 1]!.name.toUpperCase()}`,
        help: allDone
          ? undefined
          : 'You can always carry on. The science is never locked behind a score.',
        action: () => {
          if (!allDone) clearLevel(campaign.index);
          if (last) {
            emit({ type: 'campaign_complete' });
            this.scene.start('Ending');
          } else this.scene.start('LevelIntro', { index: campaign.index + 1 });
        },
      });
    }
    items.push({ label: () => 'PLAY AGAIN (R)', action: replay });
    items.push({
      label: () => (campaign ? 'TITLE' : 'O₂ RUSH MODES'),
      action: () => this.scene.start(campaign ? 'Title' : 'RushSelect'),
    });
    new Menu(
      this,
      items.map((i) => ({ ...i, help: i.help ?? '' })),
      width / 2,
      500,
      520,
      56,
      () => this.scene.start('Title'),
    );
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') replay();
    });
    announce(`${headline} Score ${s.score}. ${title}. ${lines.join('. ')}`);
  }
}
