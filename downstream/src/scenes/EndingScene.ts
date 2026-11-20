import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE, PIXEL } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import { DISCLAIMER, LINKS, RESPONSIBLE, REVEAL, TEAM } from '../content/science';
import { LEVELS } from '../levels';
import { Button } from '../ui/Button';
import { announce } from '../ui/announce';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

type Step = 'results' | 'reveal' | 'team' | 'more';
const STEPS: Step[] = ['results', 'reveal', 'team', 'more'];
const HOLD: Record<Step, number> = { results: 6000, reveal: 11000, team: 10000, more: 0 };

// The ending: campaign results, then the real research behind the game.
// Space/Enter/click moves on, Esc jumps to the last screen.
export class EndingScene extends Phaser.Scene {
  private step = 0;
  private layer!: Phaser.GameObjects.Container;
  private buttons: Button[] = [];
  private timer: Phaser.Time.TimerEvent | undefined;

  constructor() {
    super('Ending');
  }

  create(): void {
    this.step = 0;
    this.buttons = [];
    this.layer = this.add.container(0, 0);
    this.cameras.main.setBackgroundColor(0x1d3b2c);
    const seen = progress().seenEnding;
    addCenteredText(
      this,
      this.scale.height - 20,
      seen ? 'ESC skip · SPACE next' : 'SPACE or click: next · ESC: skip',
      {
        ...TEXT_STYLES.smallLight,
        fontSize: '15px',
      },
    ).setAlpha(0.7);

    const kb = this.input.keyboard;
    kb?.on('keydown-SPACE', () => this.next());
    kb?.on('keydown-ENTER', () => this.next());
    kb?.on('keydown-ESC', () => this.show(STEPS.length - 1));
    kb?.on('keydown', (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (STEPS[this.step] === 'more' && n >= 1 && n <= this.buttons.length)
        this.buttons[n - 1]?.press();
    });
    this.input.on(
      'pointerdown',
      (_p: Phaser.Input.Pointer, over: unknown[]) => over.length === 0 && this.next(),
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      kb?.removeAllListeners();
      this.input.off('pointerdown');
    });
    sound.play('win');
    this.show(0);
  }

  private announceStep(step: Step): void {
    const texts = this.layer.list
      .filter((o): o is Phaser.GameObjects.Text => o instanceof Phaser.GameObjects.Text)
      .map((t) => t.text.trim())
      .filter(Boolean);
    const options =
      step === 'more'
        ? ' Options: ' + this.buttons.map((b) => b.label.text.replace(/\s+/g, ' ')).join('. ') + '.'
        : ' Press Space to continue.';
    announce(texts.join('. ') + options);
  }

  private next(): void {
    if (this.step < STEPS.length - 1) this.show(this.step + 1);
  }

  private show(i: number): void {
    this.step = i;
    this.layer.removeAll(true);
    this.buttons.forEach((b) => b.destroy());
    this.buttons = [];
    this.timer?.remove();
    this.cameras.main.fadeIn(450);
    const step = STEPS[i]!;
    this[step]();
    if (step === 'more') {
      saveProgress({ seenEnding: true });
      // Number the buttons so they work from the keyboard too.
      this.buttons.forEach((b, n) => b.label.setText(`${n + 1}  ${b.label.text}`));
    }
    this.announceStep(step);
    // Relaxed mode: no auto-advance; move on with Space or a tap.
    if (HOLD[step] > 0 && !progress().relaxed) {
      this.timer = this.time.delayedCall(HOLD[step], () => this.next());
    }
  }

  private text(y: number, s: string, style: Phaser.Types.GameObjects.Text.TextStyle) {
    const t = addCenteredText(this, y, s, { ...style, align: 'center' }).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, duration: 700 });
    this.layer.add(t);
    return t;
  }

  // Sequence A: totals from your best run of each level.
  private results(): void {
    const { height } = this.scale;
    const records = LEVELS.map((l) => progress().levels[l.id]).filter((r) => r !== undefined);
    const sum = (k: 'potential' | 'prevented' | 'intercepted' | 'removed' | 'escaped') =>
      records.reduce((s, r) => s + r.bestTally[k], 0);
    const starsEarned = records.reduce((s, r) => s + r.bestStars, 0);
    this.text(height * 0.2, 'EVERYTHING FLOWS SOMEWHERE.', {
      ...TEXT_STYLES.display,
      fontSize: '58px',
    });
    this.text(
      height * 0.52,
      [
        `Watersheds protected: ${records.length} of ${LEVELS.length}`,
        `Litter prevented at the source: ${sum('prevented')}`,
        `Caught or hauled away: ${sum('intercepted') + sum('removed')}`,
        `Reached the ocean: ${sum('escaped')}`,
        `Stars: ${starsEarned} of ${LEVELS.length * 3}`,
      ].join('\n'),
      { ...TEXT_STYLES.bodyLight, fontSize: '28px', lineSpacing: 12 },
    );
    this.text(
      height * 0.84,
      '(best result in each level, all in-game numbers)',
      TEXT_STYLES.smallLight,
    );
  }

  // Sequence B: from the pixel-art river to the real bottles.
  private reveal(): void {
    const { width, height } = this.scale;
    this.text(height * 0.12, REVEAL.title, { ...TEXT_STYLES.display, fontSize: '64px' });
    const water = this.add
      .rectangle(width / 2, height * 0.34, 520, 90, PALETTE.water)
      .setStrokeStyle(4, PALETTE.bank);
    const bottle = this.add.image(width / 2 - 200, height * 0.34, 'gps').setScale(PIXEL * 3);
    this.layer.add([water, bottle]);
    this.tweens.add({
      targets: bottle,
      x: width / 2 + 200,
      duration: 6000,
      ease: 'Sine.easeInOut',
    });
    this.text(height * 0.5, REVEAL.lead, {
      ...TEXT_STYLES.bodyLight,
      fontSize: '26px',
      wordWrap: { width: width * 0.7 },
    });
    this.text(height * 0.68, REVEAL.text, {
      ...TEXT_STYLES.bodyLight,
      wordWrap: { width: width * 0.7 },
      lineSpacing: 6,
    });
    this.text(height * 0.88, REVEAL.illustrationNote, {
      ...TEXT_STYLES.smallLight,
      fontSize: '15px',
    });
  }

  // Sequence C: the research team (institutions only until people approve their profiles).
  private team(): void {
    const { width, height } = this.scale;
    this.text(height * 0.16, TEAM.title, { ...TEXT_STYLES.title, color: PALETTE.textLight });
    this.text(height * 0.44, TEAM.text, {
      ...TEXT_STYLES.bodyLight,
      fontSize: '25px',
      wordWrap: { width: width * 0.7 },
      lineSpacing: 8,
    });
    this.text(height * 0.72, RESPONSIBLE, {
      ...TEXT_STYLES.smallLight,
      wordWrap: { width: width * 0.66 },
    });
    this.text(height * 0.85, TEAM.note, { ...TEXT_STYLES.smallLight, fontSize: '15px' });
  }

  // Sequences D and E: links, replay, and the studio signature.
  private more(): void {
    const { width, height } = this.scale;
    const open = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');
    const links = [LINKS.explore, LINKS.story, LINKS.tracker, LINKS.help];
    links.forEach((l, i) => {
      const x = width / 2 + (i % 2 === 0 ? -240 : 240);
      const y = height * 0.12 + Math.floor(i / 2) * 70;
      this.buttons.push(
        new Button(this, x, y, 440, 56, l.label, () => open(l.url), PALETTE.accent),
      );
    });
    this.text(height * 0.33, LINKS.tracker.note ?? '', {
      ...TEXT_STYLES.smallLight,
      fontSize: '15px',
    });
    const row = height * 0.44;
    this.buttons.push(
      new Button(
        this,
        width / 2 - 300,
        row,
        260,
        52,
        'REPLAY CAMPAIGN',
        () => this.scene.start('Level', { levelId: LEVELS[0]!.id }),
        PALETTE.ink,
      ),
    );
    this.buttons.push(
      new Button(
        this,
        width / 2,
        row,
        260,
        52,
        'CHOOSE A LEVEL',
        () => this.scene.start('LevelSelect'),
        PALETTE.ink,
      ),
    );
    this.buttons.push(
      new Button(
        this,
        width / 2 + 300,
        row,
        260,
        52,
        'MAIN MENU',
        () => this.scene.start('Title'),
        PALETTE.ink,
      ),
    );
    this.text(height * 0.56, DISCLAIMER, {
      ...TEXT_STYLES.smallLight,
      fontSize: '15px',
      wordWrap: { width: width * 0.7 },
    });
    this.text(height * 0.72, '-80', { ...TEXT_STYLES.display, fontSize: '64px' });
    this.text(height * 0.82, 'MINUS 80 STUDIOS', TEXT_STYLES.bodyLight);
    this.text(height * 0.88, 'Inspired by real discoveries.', TEXT_STYLES.smallLight);
  }
}
