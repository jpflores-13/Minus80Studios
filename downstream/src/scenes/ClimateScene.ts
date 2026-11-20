import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import { CLIMATE_ORDER, CLIMATES, type Climate } from '../levels/climates';
import { announce } from '../ui/announce';
import { drawMonthIcon } from '../ui/calendar';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

export interface ClimateData {
  /** Scene to go to after choosing, e.g. the first level or back to level select. */
  next?: { scene: string; data?: object };
}

// "Choose your climate": the town is made up, but its year follows a real kind of climate.
export class ClimateScene extends Phaser.Scene {
  private index = 0;
  private frames: Phaser.GameObjects.Rectangle[] = [];
  private next: NonNullable<ClimateData['next']> = { scene: 'Title' };

  constructor() {
    super('Climate');
  }

  create(data: ClimateData): void {
    this.next = data.next ?? { scene: 'Title' };
    this.index = Math.max(0, CLIMATE_ORDER.indexOf(progress().climate));
    this.frames = [];
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.cream);
    addCenteredText(this, 56, 'CHOOSE YOUR CLIMATE', TEXT_STYLES.title);
    addCenteredText(
      this,
      104,
      'Millbrook is a made-up town. Pick the kind of year it has.',
      TEXT_STYLES.hint,
    );

    const cardW = 520;
    CLIMATE_ORDER.forEach((id, i) => {
      const c = CLIMATES[id];
      const x = width / 2 + (i - 0.5) * (cardW + 30);
      const top = 150;
      const frame = this.add
        .rectangle(x, top, cardW, 320, PALETTE.creamDark)
        .setOrigin(0.5, 0)
        .setStrokeStyle(3, PALETTE.ink)
        .setInteractive({ useHandCursor: true });
      frame.on('pointerover', () => this.pick(i));
      frame.on('pointerup', () => {
        this.pick(i);
        this.confirm();
      });
      this.frames.push(frame);
      this.add
        .text(x, top + 24, c.name.toUpperCase(), { ...TEXT_STYLES.title, fontSize: '36px' })
        .setOrigin(0.5, 0);
      this.add
        .text(x, top + 76, `(${c.basedOn})`, { ...TEXT_STYLES.hint, fontStyle: 'italic' })
        .setOrigin(0.5, 0);
      this.add
        .text(x, top + 120, c.summary, {
          ...TEXT_STYLES.body,
          align: 'center',
          wordWrap: { width: cardW - 50 },
        })
        .setOrigin(0.5, 0);
      this.drawYear(c, x - cardW / 2 + 20, top + 210, cardW - 40);
    });

    addCenteredText(this, height - 40, '← → choose · ENTER confirm · ESC back', TEXT_STYLES.hint);
    const kb = this.input.keyboard;
    kb?.on('keydown-LEFT', () => this.pick(this.index - 1));
    kb?.on('keydown-RIGHT', () => this.pick(this.index + 1));
    kb?.on('keydown-ONE', () => this.pick(0));
    kb?.on('keydown-TWO', () => this.pick(1));
    kb?.on('keydown-ENTER', () => this.confirm());
    kb?.on('keydown-SPACE', () => this.confirm());
    kb?.on('keydown-ESC', () => this.scene.start('Title'));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => kb?.removeAllListeners());
    this.highlight();
    this.describe();
  }

  // A mini calendar: twelve months, each with its weather icon.
  private drawYear(c: Climate, x: number, y: number, w: number): void {
    const cell = w / 12;
    const g = this.add.graphics();
    c.months.forEach((rain, i) => {
      const cx = x + i * cell + cell / 2;
      g.fillStyle(PALETTE.cream, 1);
      g.fillRect(x + i * cell + 1, y, cell - 2, 70);
      drawMonthIcon(g, cx, y + 22, rain);
      this.add
        .text(cx, y + 46, c.monthNames[i] ?? '', { ...TEXT_STYLES.small, fontSize: '13px' })
        .setOrigin(0.5, 0);
    });
  }

  private pick(i: number): void {
    const n = CLIMATE_ORDER.length;
    const next = (i + n) % n;
    if (next === this.index) return;
    this.index = next;
    sound.play('click');
    this.highlight();
    this.describe();
  }

  private highlight(): void {
    this.frames.forEach((f, i) =>
      f.setStrokeStyle(i === this.index ? 6 : 2, i === this.index ? PALETTE.warn : PALETTE.ink),
    );
  }

  private describe(): void {
    const c = CLIMATES[CLIMATE_ORDER[this.index]!];
    const wet = c.months
      .map((m, i) =>
        m === 'dry' ? null : `${c.monthNames[i]} ${m === 'heavy' ? 'storm' : `${m} rain`}`,
      )
      .filter(Boolean)
      .join(', ');
    announce(
      `${c.name}, ${c.basedOn}. ${c.summary} Rainy months: ${wet}. ${this.index + 1} of ${CLIMATE_ORDER.length}. Press Enter to choose.`,
    );
  }

  private confirm(): void {
    const id = CLIMATE_ORDER[this.index]!;
    saveProgress({ climate: id, climateChosen: true });
    sound.unlock();
    sound.play('click');
    announce(`${CLIMATES[id].name} chosen.`);
    this.scene.start(this.next.scene, this.next.data);
  }
}
