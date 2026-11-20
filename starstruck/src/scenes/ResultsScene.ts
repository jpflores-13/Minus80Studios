import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import { stars, type GameState } from '../systems/game';
import { announce } from '../ui/announce';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super('Results');
  }

  create(data: { levelId: string; state: GameState }): void {
    const s = data.state;
    const won = s.status === 'won';
    const st = stars(s);
    const { width } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.charcoal);
    const old = progress().best[data.levelId];
    if (won && (!old || s.score > old.score))
      saveProgress({
        best: {
          ...progress().best,
          [data.levelId]: { score: s.score, stars: Math.max(st, old?.stars ?? 0) },
        },
      });
    addCenteredText(
      this,
      90,
      won ? 'BELLY FULL!' : s.lostReason === 'energy' ? 'OUT OF ENERGY' : 'OUT OF TIME',
      {
        ...TEXT_STYLES.title,
        color: won ? PALETTE.textAmber : PALETTE.textRose,
      },
    );
    if (won)
      addCenteredText(this, 160, '★'.repeat(st) + '☆'.repeat(3 - st), {
        ...TEXT_STYLES.display,
        fontSize: '64px',
      });
    const lines = [
      `Score            ${s.score}`,
      `Worms eaten      ${s.eaten.worm ?? 0}`,
      `Best combo       ${s.bestCombo}`,
      `Wrong bites      ${s.wrongBites}`,
      `Energy left      ${Math.round(s.energy)}`,
      `Time             ${Math.floor(s.time)}s`,
    ];
    this.add.text(width / 2 - 200, 230, lines.join('\n'), { ...TEXT_STYLES.hud, lineSpacing: 10 });
    const again = () => this.scene.start('Level', { levelId: data.levelId });
    const items = [
      { label: () => 'PLAY AGAIN (R)', action: again },
      ...(won
        ? [{ label: () => 'WHAT WAS THAT ALL ABOUT?', action: () => this.scene.start('Ending') }]
        : []),
      { label: () => 'TITLE', action: () => this.scene.start('Title') },
    ];
    new Menu(this, items, width / 2, 540, 420, 72, () => this.scene.start('Title'));
    this.input.keyboard?.on('keydown-R', again);
    sound.playSong('title');
    announce(
      `${won ? `Level complete, ${st} stars.` : 'Try again.'} Score ${s.score}. Best combo ${s.bestCombo}. Press R to play again.`,
    );
  }
}
