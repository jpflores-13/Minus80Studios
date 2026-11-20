import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { ACHIEVEMENTS, checkAchievements } from '../content/achievements';
import { PALETTE } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import { LEVELS } from '../levels';
import { type GameState } from '../systems/game';
import { announce } from '../ui/announce';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

// WORMAGEDDON's own results screen. It never calls `stars()` (there's no winning this one) and
// never touches LEVELS' `best` record, just its own bestWormageddon high score.
export class WormageddonResultsScene extends Phaser.Scene {
  constructor() {
    super('WormageddonResults');
  }

  create(data: { state: GameState }): void {
    const s = data.state;
    const seconds = Math.floor(s.time);
    const { width } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.charcoal);

    const old = progress().bestWormageddon;
    const isBest = s.score > old.score;
    if (isBest) saveProgress({ bestWormageddon: { score: s.score, seconds } });
    saveProgress({
      lifetimeDug: progress().lifetimeDug + s.diggedTiles,
      lifetimeWormsEaten: progress().lifetimeWormsEaten + (s.eaten.worm ?? 0),
    });
    const newAchievements = checkAchievements({
      state: s,
      progress: progress(),
      levelCount: LEVELS.length,
    });
    if (newAchievements.length)
      saveProgress({ achievements: [...progress().achievements, ...newAchievements] });

    addCenteredText(this, 90, 'THE DIRT WON', {
      ...TEXT_STYLES.title,
      color: PALETTE.textRose,
    });
    addCenteredText(this, 150, `Survived ${seconds}s`, {
      ...TEXT_STYLES.display,
      fontSize: '48px',
    });
    const lines = [
      `Score            ${s.score}${isBest ? '  (new best!)' : ''}`,
      `Best ever        ${Math.max(old.score, s.score)}  (${Math.max(old.seconds, seconds)}s)`,
      `Worms eaten      ${s.eaten.worm ?? 0}`,
      `Best combo       ${s.bestCombo}`,
      `Wrong bites      ${s.wrongBites}`,
    ];
    this.add.text(width / 2 - 200, 230, lines.join('\n'), { ...TEXT_STYLES.hud, lineSpacing: 10 });
    if (newAchievements.length) {
      const names = newAchievements.map((id) => ACHIEVEMENTS[id].name.toUpperCase());
      addCenteredText(this, 400, `ACHIEVEMENT UNLOCKED: ${names.join(', ')}`, {
        ...TEXT_STYLES.hud,
        fontSize: '20px',
        color: PALETTE.textMint,
        wordWrap: { width: width - 80 },
      });
    }
    const again = () => this.scene.start('Level', { wormageddon: true });
    const menu = new Menu(
      this,
      [
        { label: () => 'SURVIVE AGAIN (R)', action: again },
        { label: () => 'BACK TO TITLE', action: () => this.scene.start('Title') },
      ],
      width / 2,
      500,
      420,
      64,
      () => this.scene.start('Title'),
    );
    menu.focus(0, false);
    this.input.keyboard?.on('keydown-R', again);
    sound.playSong('title');
    const achievementLine = newAchievements.length
      ? ` Achievement unlocked: ${newAchievements.map((id) => ACHIEVEMENTS[id].name).join(', ')}.`
      : '';
    announce(
      `You survived ${seconds} seconds. Score ${s.score}.${isBest ? ' A new best.' : ''}${achievementLine} Press R to try again.`,
    );
  }
}
