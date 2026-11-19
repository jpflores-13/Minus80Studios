import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { settings, updateSettings } from '../config/settings';
import { PIXEL } from '../config/gameConfig';
import { CHARACTERS } from '../characters';
import { Reef } from '../entities/Reef';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

interface MenuItem {
  label: () => string;
  action: () => void;
}

/** Cinematic title with a keyboard/mouse menu: Hunt, The Science, Sound, Effects. */
export class TitleScene extends Phaser.Scene {
  private reef!: Reef;
  private items: { item: MenuItem; text: Phaser.GameObjects.Text }[] = [];
  private index = 0;

  constructor() {
    super('Title');
  }

  create(): void {
    const { width, height } = this.scale;
    this.reef = new Reef(this, 2026);
    this.add.rectangle(0, 0, width, height, 0x06192b, 0.74).setOrigin(0);
    this.cameras.main.fadeIn(900);

    const title = addCenteredText(
      this,
      height * 0.22,
      'SNAIL ASSASSIN',
      TEXT_STYLES.display,
    ).setAlpha(0);
    const tag = addCenteredText(
      this,
      height * 0.33,
      'Nature’s slowest assassins. Evolution’s most sophisticated arsenal.',
      TEXT_STYLES.warm,
    ).setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, y: '-=10', duration: 1200, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: tag, alpha: 1, duration: 1200, delay: 500 });

    CHARACTERS.forEach((c, i) => {
      const snail = this.add
        .image(width / 2 + (i - 1) * 140, height * 0.46, `snail-${c.id}`)
        .setScale(PIXEL * 1.3)
        .setAlpha(0);
      this.tweens.add({ targets: snail, alpha: 1, duration: 800, delay: 900 + i * 200 });
      if (!settings().reducedEffects) {
        this.tweens.add({
          targets: snail,
          y: '-=6',
          duration: 1600 + i * 300,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    });

    const menu: MenuItem[] = [
      { label: () => 'HUNT', action: () => this.go('Select', { mode: 'hunt' }) },
      { label: () => 'DID YOU KNOW?', action: () => this.go('Select', { mode: 'science' }) },
      {
        label: () =>
          `SOUND: ${settings().muted ? 'OFF' : `${Math.round(settings().volume * 100)}%`}   (M to mute, − / + volume)`,
        action: () => sound.toggleMute(),
      },
      {
        label: () => `EFFECTS: ${settings().reducedEffects ? 'REDUCED' : 'FULL'}`,
        action: () => updateSettings({ reducedEffects: !settings().reducedEffects }),
      },
    ];
    this.items = menu.map((item, i) => {
      const text = addCenteredText(
        this,
        height * 0.6 + i * 46,
        '',
        TEXT_STYLES.body,
      ).setInteractive({ useHandCursor: true });
      text.on('pointerover', () => this.select(i));
      text.on('pointerup', () => this.activate());
      return { item, text };
    });
    this.select(0);
    addCenteredText(
      this,
      height * 0.95,
      '↑ ↓ choose · ENTER select   ·   A -80 Studios game',
      TEXT_STYLES.hint,
    );

    const kb = this.input.keyboard;
    kb?.on('keydown-UP', () => this.select(this.index - 1));
    kb?.on('keydown-DOWN', () => this.select(this.index + 1));
    kb?.on('keydown-W', () => this.select(this.index - 1));
    kb?.on('keydown-S', () => this.select(this.index + 1));
    kb?.on('keydown-ENTER', () => this.activate());
    kb?.on('keydown-SPACE', () => this.activate());
    kb?.on('keydown-M', () => {
      sound.toggleMute();
      this.refresh();
    });
    kb?.on('keydown-MINUS', () => this.nudgeVolume(-0.1));
    kb?.on('keydown-PLUS', () => this.nudgeVolume(0.1));
    kb?.on('keydown-EQUALS', () => this.nudgeVolume(0.1));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => kb?.removeAllListeners());
    this.input.once('pointerdown', () => sound.unlock());
  }

  override update(time: number, delta: number): void {
    this.reef.update(time, delta / 1000);
  }

  private nudgeVolume(d: number): void {
    sound.unlock();
    sound.setVolume(settings().volume + d);
    sound.play('select');
    this.refresh();
  }

  private select(i: number): void {
    const n = this.items.length;
    this.index = (i + n) % n;
    this.refresh();
  }

  private refresh(): void {
    this.items.forEach(({ item, text }, i) => {
      const active = i === this.index;
      text.setText(active ? `▸ ${item.label()} ◂` : item.label());
      text.setAlpha(active ? 1 : 0.6);
    });
  }

  private activate(): void {
    sound.unlock();
    sound.play('confirm');
    this.items[this.index]?.item.action();
    this.refresh();
  }

  private go(scene: string, data: object): void {
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(scene, data));
  }
}
