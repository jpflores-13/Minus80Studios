import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress } from '../config/progress';
import { toggleFullscreen } from '../ui/fullscreen';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.navy).fadeIn(300);
    // blueprint grid behind the title
    const g = this.add.graphics();
    g.lineStyle(1, PALETTE.sage, 0.12);
    for (let x = 0; x < width; x += 32) g.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += 32) g.lineBetween(0, y, width, y);
    g.lineStyle(3, PALETTE.gold, 0.6).strokeRect(60, 60, width - 120, height - 120);
    addCenteredText(this, 170, 'HEIST.', {
      ...TEXT_STYLES.display,
      fontSize: '120px',
      color: PALETTE.textGold,
    });
    addCenteredText(this, 255, 'Distance is your greatest weapon.', {
      ...TEXT_STYLES.hud,
      color: PALETTE.text,
    });
    const best1 = progress().best['job-1'];
    const best2 = progress().best['job-2'];
    new Menu(
      this,
      [
        {
          label: () => `JOB 01: THE DIAMOND DISTRICT${best1 ? `  ${'★'.repeat(best1.stars)}` : ''}`,
          action: () => this.scene.start('Job', { jobId: 'job-1' }),
        },
        {
          label: () => `JOB 02: ONE-WAY STREET${best2 ? `  ${'★'.repeat(best2.stars)}` : ''}`,
          action: () => this.scene.start('Job', { jobId: 'job-2' }),
        },
        { label: () => 'SETTINGS & ACCESSIBILITY', action: () => this.scene.start('Settings') },
        {
          label: () => 'WATCH THE OPENING',
          action: () => this.scene.start('Intro', { replay: true }),
        },
        { label: () => 'DID YOU KNOW?', action: () => this.scene.start('Ending') },
        ...(this.sys.game.device.fullscreen.available
          ? [{ label: () => 'FULL SCREEN', action: () => toggleFullscreen(this) }]
          : []),
        { label: () => 'MORE -80 STUDIOS GAMES', action: () => (window.location.href = '../') },
      ],
      width / 2,
      360,
      560,
      70,
    );
    addCenteredText(
      this,
      height - 34,
      'Prototype: Jobs 01–02 · A Minus 80 Studios game',
      TEXT_STYLES.hint,
    );
    sound.playSong('title');
  }
}
