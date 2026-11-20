import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress, recordClear } from '../config/progress';
import { STAGES } from '../levels';
import { scoreGame, type GameState } from '../systems/game';
import { announce } from '../ui/announce';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

// After a stage: what happened, the score, and quick ways to go again.
export class ResultsScene extends Phaser.Scene {
  constructor() {
    super('Results');
  }

  create(data: { stageId: string; hero: string; timeTrial: boolean; state: GameState }): void {
    const s = data.state;
    const stage = s.stage;
    const won = s.status === 'won';
    const { width } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.night);
    addCenteredText(this, 60, won ? 'TARGET PROTECTED!' : 'CUT!', {
      ...TEXT_STYLES.title,
      color: won ? PALETTE.textMint : PALETTE.textRed,
    });
    const lines: string[] = [];
    let summary: string;
    if (won) {
      const sc = scoreGame(s);
      const rec = recordClear(stage.id, stage.number, s.difficulty, sc.total, sc.stars, s.time);
      addCenteredText(this, 130, '★'.repeat(sc.stars) + '☆'.repeat(3 - sc.stars), {
        ...TEXT_STYLES.display,
        fontSize: '64px',
      });
      lines.push(
        `Rescue            ${sc.rescue}`,
        `Time left         ${sc.time}`,
        `Accuracy          ${sc.accuracy}`,
        `Collected         ${sc.bits}`,
        `No damage         ${sc.noDamage}`,
        `Route             ${sc.route}`,
        `Penalties        -${sc.penalties}`,
        `TOTAL             ${sc.total}${rec.newScore ? '  NEW BEST!' : ''}`,
        `Clear time        ${s.time.toFixed(2)}s${rec.newTime ? '  NEW RECORD!' : ''}`,
      );
      summary = `Target protected. ${sc.stars} stars. Score ${sc.total}. Time ${s.time.toFixed(1)} seconds.`;
    } else {
      lines.push(
        s.lostReason === 'desired-blocked'
          ? 'You stopped the edit we wanted. Wait until it finishes next time.'
          : 'The countdown ran out before you got there.',
        '',
        'Try a faster route, a different hero, or Casual difficulty.',
      );
      summary = lines[0] ?? '';
    }
    this.add.text(width / 2 - 260, 200, lines.join('\n'), {
      ...TEXT_STYLES.hud,
      fontSize: '22px',
      lineSpacing: 8,
    });

    const next = STAGES.find((x) => x.number === stage.number + 1);
    const again = () =>
      this.scene.start('Stage', { stageId: stage.id, hero: data.hero, timeTrial: data.timeTrial });
    const items = [
      { label: () => 'PLAY AGAIN', action: again },
      ...(won && next
        ? [
            {
              label: () => `NEXT: ${next.name.toUpperCase()}`,
              action: () =>
                this.scene.start(next.chooseHero ? 'HeroSelect' : 'Stage', { stageId: next.id }),
            },
          ]
        : []),
      ...(won && !next
        ? [{ label: () => 'WHAT WAS THAT ALL ABOUT?', action: () => this.scene.start('Ending') }]
        : []),
      { label: () => 'STAGES', action: () => this.scene.start('StageSelect') },
    ];
    const menu = new Menu(this, items, width / 2, 540, 420, 58, () =>
      this.scene.start('StageSelect'),
    );
    if (won && items.length > 2) menu.focus(1, false);
    this.input.keyboard?.on('keydown-R', again);
    sound.playSong('title');
    announce(`${summary} Press R to play again.`);
    void progress;
  }
}
