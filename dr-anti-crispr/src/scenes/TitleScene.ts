import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import { dailySeed } from '../content/waves';
import { DIFFICULTY, type Difficulty } from '../systems/world';
import { Button } from '../ui/Button';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

const ORDER: Difficulty[] = ['gentle', 'normal', 'fierce'];

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.night).fadeIn(300);
    const reduced = progress().reducedEffects;
    const doc = this.add.image(width / 2, 380, 'doc-4-0').setScale(7);
    if (!reduced)
      this.tweens.add({
        targets: doc,
        y: 360,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    // Always visible, not buried in MORE: a one-click way back to the rest of the studio.
    new Button(this, 104, 34, 150, 34, '-80 STUDIOS', () => (window.location.href = '../'));
    addCenteredText(this, 110, 'DR. ANTI-CRISPR', { ...TEXT_STYLES.display, fontSize: '64px' });
    addCenteredText(this, 175, 'One phage. An entire army.', {
      ...TEXT_STYLES.hud,
      color: PALETTE.textMint,
    });
    const best = progress();
    const today = best.daily[String(dailySeed())] ?? 0;
    new Menu(
      this,
      [
        {
          label: () => `CAMPAIGN${best.bestCampaign ? `  (best ${best.bestCampaign})` : ''}`,
          action: () => this.scene.start('Battle', { mode: 'campaign' }),
        },
        {
          label: () => `ENDLESS SURVIVAL${best.bestEndless ? `  (best ${best.bestEndless})` : ''}`,
          action: () => this.scene.start('Battle', { mode: 'endless' }),
        },
        {
          label: () => `DAILY CHALLENGE${today ? `  (today ${today})` : ''}`,
          help: 'Everyone gets the same waves today. Your best is saved on this device.',
          action: () => this.scene.start('Battle', { mode: 'daily' }),
        },
        {
          label: () => `DIFFICULTY: ${DIFFICULTY[progress().difficulty].name.toUpperCase()}`,
          action: () =>
            saveProgress({
              difficulty: ORDER[(ORDER.indexOf(progress().difficulty) + 1) % 3] ?? 'normal',
            }),
        },
        { label: () => 'SETTINGS & ACCESSIBILITY', action: () => this.scene.start('Settings') },
        { label: () => 'DID YOU KNOW?', action: () => this.scene.start('Ending') },
        { label: () => 'MORE', action: () => this.scene.start('More') },
      ],
      width / 2,
      600,
      560,
      78,
    );
    addCenteredText(this, height - 36, 'A Minus 80 Studios game', TEXT_STYLES.hint);
    sound.playSong('title');
  }
}
