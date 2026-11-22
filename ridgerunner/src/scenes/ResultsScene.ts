import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import { getLevel, LEVELS } from '../levels';
import { drawBackdrop } from '../render/backdrop';
import { score, type GameState } from '../systems/game';
import { announce } from '../ui/announce';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

const RANKS = ['Stream Scout', 'Moss Walker', 'Headwater Explorer', 'Ridge Runner'];

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super('Results');
  }

  create(data: { levelId: string; beyond: boolean; state: GameState }): void {
    const s = data.state;
    const won = s.status === 'won';
    const { total, stars } = score(s);
    const { width } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.charcoal);
    drawBackdrop(this);
    const key = data.beyond ? 'beyond' : data.levelId;
    if (won && (!progress().best[key] || total > progress().best[key]!.score))
      saveProgress({ best: { ...progress().best, [key]: { score: total, stars } } });

    addCenteredText(
      this,
      90,
      won ? 'ACROSS THE DIVIDE' : s.lostReason === 'dry' ? 'TOO DRY TO GO ON' : 'OUT OF TIME',
      { ...TEXT_STYLES.title, color: won ? PALETTE.textGold : PALETTE.textTerracotta },
    );
    if (won)
      addCenteredText(this, 150, RANKS[stars - 1] ?? '', {
        ...TEXT_STYLES.hud,
        color: PALETTE.textGold,
      });
    const lines = [
      `Score               ${total}`,
      `Distance in streams  ${Math.round(s.distanceStream)}px`,
      `Distance overland    ${Math.round(s.distanceOverland)}px`,
      `Watershed crossings  ${s.watershedCrossings}`,
      `Moisture left        ${Math.round(s.moisture)}`,
      `Time                 ${Math.floor(s.time)}s`,
    ];
    this.add.text(width / 2 - 220, 200, lines.join('\n'), { ...TEXT_STYLES.hud, lineSpacing: 10 });

    const again = () => this.scene.start('Level', { levelId: data.levelId, beyond: data.beyond });
    const next = data.beyond
      ? null
      : LEVELS.find((l) => l.number === getLevel(data.levelId).number + 1);
    const items = [
      { label: () => 'TRY AGAIN (R)', action: again },
      ...(won && next
        ? [
            {
              label: () => `NEXT: ${next.name.toUpperCase()}`,
              action: () => this.scene.start('Level', { levelId: next.id }),
            },
          ]
        : []),
      ...(won && !next && !data.beyond
        ? [{ label: () => 'WHAT WAS THAT ALL ABOUT?', action: () => this.scene.start('Ending') }]
        : []),
      { label: () => 'TITLE', action: () => this.scene.start('Title') },
    ];
    const menu = new Menu(this, items, width / 2, 460, 420, 62, () => this.scene.start('Title'));
    if (won && items.length > 2) menu.focus(1, false);
    this.input.keyboard?.on('keydown-R', again);
    announce(
      `${won ? `Crossed, ${RANKS[stars - 1]}, score ${total}.` : 'Try again.'} Press R to try again.`,
    );
  }
}
