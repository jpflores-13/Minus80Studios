import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { JOBS } from '../levels';
import { Button } from '../ui/Button';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';
import { clearedCount } from './JobSelectScene';

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
    // Always visible, not buried in MORE: a one-click way back to the rest of the studio.
    new Button(this, 104, 34, 150, 34, '-80 STUDIOS', () => (window.location.href = '../'));
    addCenteredText(this, 170, 'HEIST.', {
      ...TEXT_STYLES.display,
      fontSize: '120px',
      color: PALETTE.textGold,
    });
    addCenteredText(this, 255, 'Distance is your greatest weapon.', {
      ...TEXT_STYLES.hud,
      color: PALETTE.text,
    });
    const cleared = clearedCount();
    const next = JOBS[Math.min(cleared, JOBS.length - 1)] ?? JOBS[0]!;
    new Menu(
      this,
      [
        {
          label: () => (cleared > 0 ? `CONTINUE: JOB ${next.number}` : 'PLAY'),
          action: () => this.scene.start('Job', { jobId: next.id }),
        },
        { label: () => 'JOBS', action: () => this.scene.start('JobSelect') },
        { label: () => 'CREW', action: () => this.scene.start('CrewSelect') },
        { label: () => 'SETTINGS & ACCESSIBILITY', action: () => this.scene.start('Settings') },
        { label: () => 'DID YOU KNOW?', action: () => this.scene.start('Ending') },
        { label: () => 'MORE', action: () => this.scene.start('More') },
      ],
      width / 2,
      330,
      560,
      62,
    );
    addCenteredText(
      this,
      height - 34,
      'Prototype: Jobs 01–06 · A Minus 80 Studios game',
      TEXT_STYLES.hint,
    );
    sound.playSong('title');
  }
}
