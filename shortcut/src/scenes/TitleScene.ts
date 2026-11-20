import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { isUnlocked, progress } from '../config/progress';
import { LEVELS } from '../levels';
import { announce } from '../ui/announce';
import { drawBuilding, shortcutCurve } from '../ui/cityArt';
import { toggleFullscreen } from '../ui/fullscreen';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

interface Item {
  label: () => string;
  action: () => void;
}

export class TitleScene extends Phaser.Scene {
  private items: { item: Item; text: Phaser.GameObjects.Text }[] = [];
  private index = 0;

  constructor() {
    super('Title');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.sky);
    this.cameras.main.fadeIn(500);

    // a little street with one golden shortcut that grows and shrinks
    const roadY = height * 0.84;
    const g = this.add.graphics();
    g.fillStyle(PALETTE.sage, 1).fillRect(0, roadY + 16, width, height - roadY);
    g.fillStyle(PALETTE.road, 1).fillRect(0, roadY - 16, width, 32);
    g.lineStyle(2, PALETTE.roadLine, 0.8);
    for (let x = 0; x < width; x += 28) g.lineBetween(x, roadY, x + 14, roadY);
    drawBuilding(g, 'bakery', 140, roadY - 46, true);
    drawBuilding(g, 'cafe', width - 140, roadY - 46, true);
    const arc = this.add.graphics();
    const state = { span: progress().reducedEffects ? 1 : 0 };
    const drawArc = () => {
      arc.clear();
      const half = (width / 2 - 140) * state.span;
      const pts = shortcutCurve(width / 2 - half, width / 2 + half, roadY - 18, 360).getPoints(40);
      arc.lineStyle(10, PALETTE.goldDark, 0.9).strokePoints(pts);
      arc.lineStyle(5, PALETTE.gold, 1).strokePoints(pts);
    };
    drawArc();
    if (!progress().reducedEffects)
      this.tweens.add({
        targets: state,
        span: 1,
        duration: 4000,
        yoyo: true,
        hold: 1500,
        repeat: -1,
        ease: 'Sine.easeInOut',
        onUpdate: drawArc,
      });

    addCenteredText(this, height * 0.2, 'SHORTCUT.', {
      ...TEXT_STYLES.display,
      color: PALETTE.text,
    });
    addCenteredText(this, height * 0.31, 'Every city needs a few.', TEXT_STYLES.body);

    const ids = LEVELS.map((l) => l.id);
    const next =
      LEVELS.find((l, i) => isUnlocked(ids, i) && !progress().levels[l.id]?.passed) ?? LEVELS[0]!;
    const menu: Item[] = [
      {
        label: () => (progress().levels['level-1'] ? `CONTINUE: ${next.name}` : 'PLAY'),
        action: () => this.scene.start('Level', { levelId: next.id }),
      },
      { label: () => 'CHOOSE A LEVEL', action: () => this.scene.start('LevelSelect') },
      ...(progress().revealed
        ? [
            {
              label: () => 'SCIENCE MODE, PLANNER & BLUEPRINT',
              action: () => this.scene.start('Modes'),
            },
          ]
        : []),
      { label: () => 'SETTINGS & ACCESSIBILITY', action: () => this.scene.start('Settings') },
      ...(this.sys.game.device.fullscreen.available
        ? [
            {
              label: () => (this.scale.isFullscreen ? 'EXIT FULL SCREEN' : 'FULL SCREEN'),
              action: () => toggleFullscreen(this),
            },
          ]
        : []),
    ];
    this.items = menu.map((item, i) => {
      const text = addCenteredText(this, height * 0.41 + i * 46, '', {
        ...TEXT_STYLES.body,
        backgroundColor: '#44586b',
        padding: { x: 14, y: 6 },
      })
        .setColor(PALETTE.textLight)
        .setInteractive({ useHandCursor: true });
      text.on('pointerover', () => this.select(i));
      text.on('pointerup', () => {
        this.index = i;
        this.activate();
      });
      return { item, text };
    });
    this.select(0);
    addCenteredText(
      this,
      height * 0.97,
      '↑ ↓ choose · ENTER select   ·   A Minus 80 Studios game',
      { ...TEXT_STYLES.small, color: PALETTE.text },
    );

    const kb = this.input.keyboard;
    kb?.on('keydown-UP', () => this.select(this.index - 1));
    kb?.on('keydown-DOWN', () => this.select(this.index + 1));
    kb?.on('keydown-ENTER', () => this.activate());
    kb?.on('keydown-SPACE', () => this.activate());
    kb?.on('keydown-M', () => {
      sound.toggleMute();
      announce(progress().muted ? 'Sound off' : 'Sound on');
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => kb?.removeAllListeners());
  }

  private select(i: number): void {
    this.index = (i + this.items.length) % this.items.length;
    this.refresh();
    const item = this.items[this.index]?.item;
    if (item) announce(`${item.label()}, ${this.index + 1} of ${this.items.length}`);
  }

  private refresh(): void {
    this.items.forEach(({ item, text }, i) => {
      text.setText(i === this.index ? `▸ ${item.label()} ◂` : item.label());
      text.setAlpha(i === this.index ? 1 : 0.8);
    });
  }

  private activate(): void {
    sound.unlock();
    sound.play('click');
    this.items[this.index]?.item.action();
    this.refresh();
  }
}
