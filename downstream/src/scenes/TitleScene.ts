import Phaser from 'phaser';
import { toggleFullscreen } from '../ui/fullscreen';
import { sound } from '../audio/Sound';
import { PALETTE, PIXEL } from '../config/gameConfig';
import { isUnlocked, progress, saveProgress } from '../config/progress';
import { LEVELS } from '../levels';
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
    this.cameras.main.setBackgroundColor(PALETTE.grass);
    this.cameras.main.fadeIn(600);
    this.add.rectangle(0, height * 0.16, width, height * 0.3, PALETTE.water).setOrigin(0);
    for (let x = 30; x < width; x += 90)
      this.add.image(x, height * 0.1, 'tree').setScale(PIXEL * 1.4);
    for (let x = 60; x < width; x += 140)
      this.add.image(x, height * 0.97, 'house').setScale(PIXEL * 1.4);
    const bottle = this.add.image(-40, height * 0.36, 'gps').setScale(PIXEL * 1.5);
    if (!progress().reducedEffects)
      this.tweens.add({ targets: bottle, x: width + 40, duration: 14000, repeat: -1 });

    addCenteredText(this, height * 0.26, 'DOWNSTREAM!', TEXT_STYLES.display);
    addCenteredText(this, height * 0.4, 'Everything flows somewhere.', TEXT_STYLES.bodyLight);

    const ids = LEVELS.map((l) => l.id);
    const targets = LEVELS.map((l) => l.target);
    const nextLevel =
      LEVELS.find((_, i) => isUnlocked(ids, i, targets) && !progress().levels[ids[i]!]) ??
      LEVELS[0]!;
    const menu: Item[] = [
      {
        label: () => (progress().levels['level-1'] ? `CONTINUE: ${nextLevel.name}` : 'PLAY'),
        action: () => this.scene.start('Level', { levelId: nextLevel.id }),
      },
      { label: () => 'CHOOSE A LEVEL', action: () => this.scene.start('LevelSelect') },
      { label: () => 'DID YOU KNOW?', action: () => this.scene.start('Ending') },
      {
        label: () =>
          `SOUND: ${progress().muted ? 'OFF' : `${Math.round(progress().volume * 100)}%`}  (M mute, − / + volume)`,
        action: () => sound.toggleMute(),
      },
      {
        label: () => `EFFECTS: ${progress().reducedEffects ? 'REDUCED' : 'FULL'}`,
        action: () => saveProgress({ reducedEffects: !progress().reducedEffects }),
      },
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
      const text = addCenteredText(this, height * 0.47 + i * 40, '', {
        ...TEXT_STYLES.body,
        backgroundColor: '#2d2a26aa',
        padding: { x: 12, y: 4 },
      })
        .setColor(PALETTE.textLight)
        .setInteractive({ useHandCursor: true });
      text.on('pointerover', () => this.select(i));
      text.on('pointerup', () => this.activate());
      return { item, text };
    });
    this.select(0);
    addCenteredText(
      this,
      height * 0.86,
      '↑ ↓ choose · ENTER select   ·   A -80 Studios game',
      TEXT_STYLES.smallLight,
    );

    const kb = this.input.keyboard;
    kb?.on('keydown-UP', () => this.select(this.index - 1));
    kb?.on('keydown-DOWN', () => this.select(this.index + 1));
    kb?.on('keydown-ENTER', () => this.activate());
    kb?.on('keydown-SPACE', () => this.activate());
    kb?.on('keydown-M', () => {
      sound.toggleMute();
      this.refresh();
    });
    const vol = (d: number) => {
      sound.unlock();
      sound.setVolume(progress().volume + d);
      sound.play('click');
      this.refresh();
    };
    kb?.on('keydown-MINUS', () => vol(-0.1));
    kb?.on('keydown-PLUS', () => vol(0.1));
    kb?.on('keydown-EQUALS', () => vol(0.1));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => kb?.removeAllListeners());
  }

  private select(i: number): void {
    this.index = (i + this.items.length) % this.items.length;
    this.refresh();
  }

  private refresh(): void {
    this.items.forEach(({ item, text }, i) => {
      text.setText(i === this.index ? `▸ ${item.label()} ◂` : item.label());
      text.setAlpha(i === this.index ? 1 : 0.75);
    });
  }

  private activate(): void {
    sound.unlock();
    sound.play('click');
    this.items[this.index]?.item.action();
    this.refresh();
  }
}
