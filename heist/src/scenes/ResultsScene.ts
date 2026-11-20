import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { offerUpgrades, type Upgrade } from '../content/upgrades';
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
    const firstClear = won && !old;
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
    if (won && !m.everSeen)
      saveProgress({ perfectCrime: { ...progress().perfectCrime, [data.jobId]: true } });
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
    this.input.keyboard?.on('keydown-R', again);
    sound.playSong('title');
    announce(
      `${won ? `Clean getaway, ${sc.stars} stars, score ${sc.total}.` : lines[0]} Press R to try again.`,
    );
    if (firstClear) this.showUpgradeOffer(() => this.buildMenu(data.jobId, won));
    else this.buildMenu(data.jobId, won);
  }

  private buildMenu(jobId: string, won: boolean): void {
    const { width } = this.scale;
    const again = () => this.scene.start('Job', { jobId });
    const items = [
      { label: () => 'TRY AGAIN (R)', action: again },
      ...(won
        ? [{ label: () => 'WHAT WAS THAT ALL ABOUT?', action: () => this.scene.start('Ending') }]
        : []),
      { label: () => 'TITLE', action: () => this.scene.start('Title') },
    ];
    new Menu(this, items, width / 2, 560, 420, 70, () => this.scene.start('Title'));
  }

  private showUpgradeOffer(onDone: () => void): void {
    const { width, height } = this.scale;
    const offers = offerUpgrades(progress().upgrades, Math.random);
    if (offers.length === 0) return onDone();
    const shade = this.add
      .rectangle(0, 0, width, height, PALETTE.ink, 0.92)
      .setOrigin(0)
      .setDepth(80)
      .setInteractive();
    const title = this.add
      .text(width / 2, 140, 'FIRST CLEAR: CHOOSE A PERMANENT UPGRADE', TEXT_STYLES.title)
      .setOrigin(0.5)
      .setDepth(81);
    const items: { label: () => string; help?: string; action: () => void }[] = offers.map(
      (u: Upgrade) => ({
        label: () => u.name.toUpperCase(),
        help: u.text,
        action: () => {
          saveProgress({ upgrades: [...progress().upgrades, u.id] });
          shade.destroy();
          title.destroy();
          menu.destroy();
          onDone();
        },
      }),
    );
    const menu = new Menu(this, items, width / 2, 300, 560, 80);
    announce(
      `First clear. Choose a permanent upgrade. ${offers.map((u) => `${u.name}: ${u.text}`).join('. ')}`,
    );
  }
}
