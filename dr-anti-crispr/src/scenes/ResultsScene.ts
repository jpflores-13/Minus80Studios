import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { WEAPONS, WEAPON_ORDER } from '../content/arsenal';
import { PALETTE } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import { DID_YOU_KNOW, randomQuickFact } from '../content/science';
import { finalScore, type Mode, type World } from '../systems/world';
import { announce } from '../ui/announce';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

// The post-game summary, with a one-tap replay.
export class ResultsScene extends Phaser.Scene {
  constructor() {
    super('Results');
  }

  create(data: { mode: Mode; world: World }): void {
    const w = data.world;
    const won = w.phase === 'won';
    const sc = finalScore(w);
    const { width } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.night);
    const p = progress();
    let best = false;
    if (data.mode === 'campaign' && sc.total > p.bestCampaign) {
      saveProgress({ bestCampaign: sc.total });
      best = true;
    }
    if (data.mode === 'endless' && sc.total > p.bestEndless) {
      saveProgress({ bestEndless: sc.total });
      best = true;
    }
    if (data.mode === 'daily' && sc.total > (p.daily[String(w.seed)] ?? 0)) {
      saveProgress({ daily: { ...p.daily, [String(w.seed)]: sc.total } });
      best = true;
    }
    if (won && data.mode === 'campaign') saveProgress({ campaignWon: true });

    addCenteredText(this, 120, won ? 'HOST TAKEN OVER!' : 'GENOME DESTROYED', {
      ...TEXT_STYLES.title,
      color: won ? PALETTE.textMint : PALETTE.textRed,
    });
    addCenteredText(this, 190, `${sc.total}${best ? '  NEW BEST!' : ''}`, {
      ...TEXT_STYLES.display,
      fontSize: '64px',
    });
    const used = WEAPON_ORDER.filter((id) => w.stats.byWeapon[id] > 0)
      .map((id) => `  ${WEAPONS[id].name}: ${w.stats.byWeapon[id]}`)
      .join('\n');
    const lines = [
      `Waves cleared        ${w.stats.wavesCleared}`,
      `Survived             ${Math.floor(w.time)}s`,
      `Machines inhibited   ${w.stats.inhibited}`,
      used,
      `Bosses shut down     ${w.stats.bossesStopped}`,
      `Matched weapon shots ${Math.round(sc.accuracy * 100)}%`,
      `Close dodges         ${w.stats.dodges}`,
      `Special abilities    ${w.stats.specialUses}`,
      `Genome left          ${Math.ceil(w.hero.integrity)}%`,
    ].filter(Boolean);
    this.add.text(width / 2 - 260, 270, lines.join('\n'), {
      ...TEXT_STYLES.hud,
      fontSize: '22px',
      lineSpacing: 8,
    });
    const fact = randomQuickFact(Math.floor(w.time * 1000) + sc.total);
    addCenteredText(this, 580, `${DID_YOU_KNOW} ${fact}`, {
      ...TEXT_STYLES.small,
      color: PALETTE.textDim,
      wordWrap: { width: width - 160 },
      align: 'center',
    });
    const again = () => this.scene.start('Battle', { mode: data.mode });
    new Menu(
      this,
      [
        { label: () => 'PLAY AGAIN', action: again },
        ...(won && data.mode === 'campaign'
          ? [{ label: () => 'WHAT WAS THAT ALL ABOUT?', action: () => this.scene.start('Ending') }]
          : []),
        { label: () => 'TITLE', action: () => this.scene.start('Title') },
      ],
      width / 2,
      930,
      500,
      90,
      () => this.scene.start('Title'),
    );
    this.input.keyboard?.on('keydown-R', again);
    sound.playSong('title');
    announce(
      `${won ? 'You won.' : 'Your genome was destroyed.'} Score ${sc.total}. ${w.stats.inhibited} machines inhibited. Press R to play again.`,
    );
  }
}
