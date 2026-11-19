import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { getCharacter } from '../characters';
import type { CharacterConfig } from '../characters/types';
import { PIXEL } from '../config/gameConfig';
import { markOnce, settings } from '../config/settings';
import {
  DISCLAIMER,
  DISCOVERIES,
  ILLUSTRATION_NOTE,
  MEDICINE,
  REVIEW_STATUS,
} from '../content/science';
import { Button } from '../ui/Button';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

export interface DiscoveryData {
  characterId?: string;
  /** "ending" after a won hunt; "gallery" from the main menu. */
  mode?: 'ending' | 'gallery';
}

type Step = 'reveal' | 'meet' | 'discovery' | 'medicine' | 'more';
const STEPS: Step[] = ['reveal', 'meet', 'discovery', 'medicine', 'more'];

/**
 * "THE SCIENCE IS REAL": the -80 Studio discovery sequence (docs/ENDING_SEQUENCE.md).
 * B reveal → C discovery → D venom to medicine → E discover more + F studio signature.
 * Space/Enter/click advances; Esc jumps straight to the final screen.
 */
export class DiscoveryScene extends Phaser.Scene {
  private character!: CharacterConfig;
  private step = 0;
  private layer!: Phaser.GameObjects.Container;
  private buttons: Button[] = [];
  private autoTimer: Phaser.Time.TimerEvent | undefined;

  constructor() {
    super('Discovery');
  }

  create(data: DiscoveryData): void {
    this.character = getCharacter(data.characterId ?? 'atlas');
    this.step = 0;
    this.buttons = [];
    this.cameras.main.setBackgroundColor(0x02070c);
    this.layer = this.add.container(0, 0);
    const seen = settings().seenDiscovery.includes(this.character.id);
    addCenteredText(
      this,
      this.scale.height - 22,
      seen ? 'ESC skip · SPACE next' : 'SPACE / click next · ESC skip',
      TEXT_STYLES.hint,
    )
      .setDepth(300)
      .setAlpha(0.7);

    const kb = this.input.keyboard;
    kb?.on('keydown-SPACE', () => this.next());
    kb?.on('keydown-ENTER', () => this.next());
    kb?.on('keydown-RIGHT', () => this.next());
    kb?.on('keydown-ESC', () => this.show(STEPS.length - 1));
    this.input.on('pointerdown', (_p: Phaser.Input.Pointer, over: unknown[]) => {
      if (over.length === 0) this.next();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      kb?.removeAllListeners();
      this.input.off('pointerdown');
    });
    sound.unlock();
    sound.play('reveal');
    this.show(0);
  }

  private next(): void {
    if (this.step < STEPS.length - 1) this.show(this.step + 1);
  }

  private show(i: number): void {
    this.step = i;
    this.layer.removeAll(true);
    this.buttons.forEach((b) => b.destroy());
    this.buttons = [];
    this.autoTimer?.remove();
    const step = STEPS[i]!;
    this.cameras.main.fadeIn(450);
    this[step]();
    if (step === 'more') markOnce('seenDiscovery', this.character.id);
    // Gentle auto-advance keeps the whole sequence to roughly 20–30 s.
    const holds: Record<Step, number> = {
      reveal: 2600,
      meet: 4500,
      discovery: 11000,
      medicine: 9000,
      more: 0,
    };
    if (holds[step] > 0) this.autoTimer = this.time.delayedCall(holds[step], () => this.next());
  }

  private text(
    y: number,
    s: string,
    style: Phaser.Types.GameObjects.Text.TextStyle,
  ): Phaser.GameObjects.Text {
    const t = addCenteredText(this, y, s, style).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, duration: 700 });
    this.layer.add(t);
    return t;
  }

  private reveal(): void {
    this.text(this.scale.height * 0.46, 'THE SCIENCE IS REAL.', {
      ...TEXT_STYLES.display,
      fontSize: '72px',
    });
  }

  /** Sequence B: pixel art gives way to a larger, more detailed rendering of the real species. */
  private meet(): void {
    const { width, height } = this.scale;
    const c = this.character;
    const d = DISCOVERIES[c.id];
    const glow = this.add.circle(width / 2, height * 0.42, 150, c.palette.accent, 0.08);
    const sprite = this.add
      .image(width / 2, height * 0.42, `snail-${c.id}`)
      .setScale(PIXEL)
      .setAlpha(0.9);
    this.layer.add([glow, sprite]);
    this.tweens.add({
      targets: sprite,
      scale: PIXEL * 4.2,
      duration: 1600,
      ease: 'Sine.easeInOut',
    });
    this.text(height * 0.12, d.reveal, { ...TEXT_STYLES.title, color: c.palette.ui });
    this.text(height * 0.7, `${c.species}`, {
      ...TEXT_STYLES.title,
      fontSize: '40px',
      fontStyle: 'italic',
    });
    this.text(height * 0.78, `${c.commonName} · a real cone snail`, TEXT_STYLES.warm);
    this.text(height * 0.86, ILLUSTRATION_NOTE, TEXT_STYLES.hint);
  }

  /** Sequence C: 40–70 words of validated (pending review) species-specific science. */
  private discovery(): void {
    const { width, height } = this.scale;
    const c = this.character;
    const d = DISCOVERIES[c.id];
    this.text(height * 0.14, `What ${c.name} was based on`, {
      ...TEXT_STYLES.title,
      fontSize: '40px',
      color: c.palette.ui,
    });
    this.text(height * 0.42, d.text, {
      ...TEXT_STYLES.body,
      fontSize: '27px',
      align: 'center',
      lineSpacing: 10,
      wordWrap: { width: width * 0.68 },
    });
    if (c.id === 'atlas') this.atlasAnimation(height * 0.7);
    this.text(height * 0.86, REVIEW_STATUS, TEXT_STYLES.hint);
  }

  /** Optional subtle animation: two venom molecules, two effects on the fish's blood sugar. */
  private atlasAnimation(y: number): void {
    const { width } = this.scale;
    const reduced = settings().reducedEffects;
    const items = [
      { x: width / 2 - 180, label: 'venom insulin\nblood sugar ↓', color: 0x5fd3c6 },
      { x: width / 2 + 180, label: 'hormone mimic\nrescue blocked ✕', color: 0xe9dcc0 },
    ];
    for (const it of items) {
      const dot = this.add.circle(it.x, y, 12, it.color);
      const label = this.add
        .text(it.x, y + 26, it.label, { ...TEXT_STYLES.small, align: 'center' })
        .setOrigin(0.5, 0);
      this.layer.add([dot, label]);
      if (!reduced)
        this.tweens.add({ targets: dot, scale: 1.4, duration: 900, yoyo: true, repeat: -1 });
    }
    const plus = this.add.text(width / 2, y - 6, '+', TEXT_STYLES.title).setOrigin(0.5);
    this.layer.add(plus);
  }

  /** Sequence D: translational discovery. Ziconotide's origin species stated explicitly. */
  private medicine(): void {
    const { width, height } = this.scale;
    this.text(height * 0.18, MEDICINE.title, { ...TEXT_STYLES.title, color: '#f3d9a4' });
    this.text(height * 0.46, MEDICINE.text, {
      ...TEXT_STYLES.body,
      fontSize: '26px',
      align: 'center',
      lineSpacing: 10,
      wordWrap: { width: width * 0.68 },
    });
    this.text(height * 0.74, `Source: ${MEDICINE.reference.label}`, TEXT_STYLES.hint);
  }

  /** Sequence E (discover more) + F (studio signature). */
  private more(): void {
    const { width, height } = this.scale;
    const c = this.character;
    const d = DISCOVERIES[c.id];
    const accent = c.palette.accent;
    this.text(height * 0.08, `${c.name} · ${c.species}`, {
      ...TEXT_STYLES.hud,
      color: c.palette.ui,
    });

    const open = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');
    this.buttons.push(
      new Button(
        this,
        width / 2 - 250,
        height * 0.2,
        460,
        52,
        'EXPLORE THE REAL SCIENCE',
        () => open(d.explore.url),
        accent,
      ),
    );
    d.research.forEach((r, i) =>
      this.buttons.push(
        new Button(
          this,
          width / 2 + 250,
          height * 0.2 + i * 62,
          460,
          52,
          `READ: ${r.label}`,
          () => open(r.url),
          accent,
        ),
      ),
    );
    const row = height * 0.48;
    this.buttons.push(
      new Button(
        this,
        width / 2 - 320,
        row,
        280,
        52,
        'CHOOSE ANOTHER ASSASSIN',
        () => this.scene.start('Select', { mode: 'hunt', characterId: c.id }),
        accent,
      ),
    );
    this.buttons.push(
      new Button(
        this,
        width / 2,
        row,
        280,
        52,
        'PLAY AGAIN',
        () => this.scene.start('Hunt', { characterId: c.id }),
        accent,
      ),
    );
    this.buttons.push(
      new Button(
        this,
        width / 2 + 320,
        row,
        280,
        52,
        'MAIN MENU',
        () => this.scene.start('Title'),
        accent,
      ),
    );

    this.text(height * 0.6, DISCLAIMER, {
      ...TEXT_STYLES.hint,
      fontSize: '17px',
      align: 'center',
      wordWrap: { width: width * 0.7 },
    });
    // Sequence F: studio signature.
    this.text(height * 0.74, '-80', { ...TEXT_STYLES.display, fontSize: '64px', color: '#cfe9ef' });
    this.text(height * 0.84, '-80 STUDIO', { ...TEXT_STYLES.hud, color: '#9fc0c8' });
    this.text(height * 0.9, 'Inspired by real discoveries.', TEXT_STYLES.warm);
  }
}
