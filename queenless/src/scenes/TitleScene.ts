import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress } from '../config/progress';
import { LEVELS } from '../levels';
import { Button } from '../ui/Button';
import { toggleFullscreen } from '../ui/fullscreen';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

/** How many levels have a saved best score, used to gate the next one and the title's label. */
export function clearedCount(): number {
  return LEVELS.filter((l) => progress().best[l.id]).length;
}

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.night).fadeIn(300);
    const bee = this.add
      .image(width * 0.18, height * 0.6, 'bee-0')
      .setScale(6)
      .setTint(0xe8b84b);
    if (!progress().reducedEffects)
      this.tweens.add({
        targets: bee,
        angle: -8,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    // Always visible, not just a menu item further down: a one-click way back to the studio.
    new Button(this, 104, 34, 150, 34, '-80 STUDIOS', () => (window.location.href = '../'));
    addCenteredText(this, 120, 'QUEENLESS', { ...TEXT_STYLES.display, fontSize: '80px' });
    addCenteredText(this, 196, 'One colony. No queen. Every bee matters.', {
      ...TEXT_STYLES.hud,
      color: PALETTE.textMoss,
    });

    const cleared = clearedCount();
    const next = LEVELS[Math.min(cleared, LEVELS.length - 1)] ?? LEVELS[0]!;
    const menuItems = [
      {
        label: () => (cleared > 0 ? `CONTINUE: ${next.name.toUpperCase()}` : 'PLAY'),
        action: () =>
          progress().seenIntro
            ? this.scene.start('Level', { levelId: next.id })
            : this.scene.start('Intro'),
      },
      { label: () => 'LEVELS', action: () => this.scene.start('LevelSelect') },
      {
        label: () => {
          const best = progress().bestQueenless;
          return `QUEENLESS MODE${best.score ? `  (best ${best.score}, ${best.seconds}s)` : ''}`;
        },
        help: 'Endless. No queen from the start, and it only gets harder from there.',
        action: () => this.scene.start('Level', { queenlessMode: true }),
      },
      { label: () => 'SETTINGS & ACCESSIBILITY', action: () => this.scene.start('Settings') },
      {
        label: () => 'WATCH THE OPENING',
        action: () => this.scene.start('Intro', { replay: true }),
      },
      { label: () => 'DID YOU KNOW?', action: () => this.scene.start('Ending') },
      // The "-80 STUDIOS" corner button above is now the one-click way back to the studio, so
      // this list no longer repeats it as a "MORE GAMES" row — one fewer item also buys back
      // the vertical room FULL SCREEN needs on shorter displays (see the gap math below).
      ...(this.sys.game.device.fullscreen.available
        ? [{ label: () => 'FULL SCREEN', action: () => toggleFullscreen(this) }]
        : []),
    ];
    // Up to 7 rows (6 + FULL SCREEN) have to fit, with the focused item's help line below them,
    // inside a fixed 720px-tall canvas. A constant 62px gap and 50px button height (fine for
    // the 4-5 item menus elsewhere in this game) pushed the last couple of rows off the bottom
    // edge entirely once this list grew to 7 — never rendered, never clickable. Shrink the
    // button height a little, and the gap only as far as the item count actually requires,
    // instead of guessing constants that only fit today's shortest list.
    const menuTop = 290;
    const btnHeight = menuItems.length >= 7 ? 44 : 50;
    const gap = Math.max(
      btnHeight,
      Math.min(62, Math.floor((height - 100 - menuTop) / menuItems.length)),
    );
    const menu = new Menu(
      this,
      menuItems,
      width / 2 + 120,
      menuTop,
      520,
      gap,
      undefined,
      btnHeight,
    );
    // Stacked below the menu's own measured bottom (not a hardcoded height - 30) so it can
    // never land on top of the last row or its help text, however many rows end up above it.
    addCenteredText(this, menu.bottom + 20, 'A Minus 80 Studios game', TEXT_STYLES.hint);
    sound.playSong('title');
  }
}
