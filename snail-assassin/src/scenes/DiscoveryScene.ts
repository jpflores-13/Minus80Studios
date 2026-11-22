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
  THREAT_DISCOVERY,
} from '../content/science';
import { announce } from '../ui/announce';
import { Button } from '../ui/Button';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

export interface DiscoveryData {
  characterId?: string;
  /** "ending" after a won hunt; "gallery" from the main menu. */
  mode?: 'ending' | 'gallery';
}

type Step = 'reveal' | 'meet' | 'discovery' | 'threat' | 'medicine' | 'more';
// Characters with a THREAT_DISCOVERY entry (Cipher, Glaucus) get an extra step: a reveal about
// the real animal that was hunting them, right after their own discovery. The three cone snails
// don't, because the main campaign's octopus threat is a marked gameplay invention, not modeled
// on the research shown here (see docs/SCIENCE.md, "Predators (for the octopus-vs-snail threat
// in the main campaign)").
const stepsFor = (characterId: string): Step[] =>
  characterId in THREAT_DISCOVERY
    ? ['reveal', 'meet', 'discovery', 'threat', 'medicine', 'more']
    : ['reveal', 'meet', 'discovery', 'medicine', 'more'];

// The "Did you know?" ending. Space/Enter/click moves on, Esc jumps to the last screen.
export class DiscoveryScene extends Phaser.Scene {
  private character!: CharacterConfig;
  private steps: Step[] = [];
  private step = 0;
  private layer!: Phaser.GameObjects.Container;
  private buttons: Button[] = [];
  private autoTimer: Phaser.Time.TimerEvent | undefined;

  constructor() {
    super('Discovery');
  }

  create(data: DiscoveryData): void {
    this.character = getCharacter(data.characterId ?? 'atlas');
    this.steps = stepsFor(this.character.id);
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
    kb?.on('keydown-ESC', () => this.show(this.steps.length - 1));
    kb?.on('keydown', (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (this.steps[this.step] === 'more' && n >= 1 && n <= this.buttons.length)
        this.buttons[n - 1]?.press();
    });
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
    if (this.step < this.steps.length - 1) this.show(this.step + 1);
  }

  private show(i: number): void {
    this.step = i;
    this.layer.removeAll(true);
    this.buttons.forEach((b) => b.destroy());
    this.buttons = [];
    this.autoTimer?.remove();
    const step = this.steps[i]!;
    this.cameras.main.fadeIn(450);
    this[step]();
    if (step === 'more') {
      markOnce('seenDiscovery', this.character.id);
      // Number the buttons so they work from the keyboard too.
      this.buttons.forEach((b, n) => b.label.setText(`${n + 1}  ${b.label.text}`));
    }
    this.announceStep(step);
    // Gentle auto-advance keeps the whole sequence to roughly 20–30 s.
    const holds: Record<Step, number> = {
      reveal: 2600,
      meet: 4500,
      discovery: 11000,
      threat: 9000,
      medicine: 9000,
      more: 0,
    };
    // Relaxed mode: no auto-advance; move on with Space or a tap.
    if (holds[step] > 0 && !settings().relaxed)
      this.autoTimer = this.time.delayedCall(holds[step], () => this.next());
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
    this.text(this.scale.height * 0.46, 'DID YOU KNOW?', {
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
      .image(width / 2, height * 0.42, `player-${c.id}`)
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
    this.text(height * 0.78, `${c.commonName} · ${c.animalLabel}`, TEXT_STYLES.warm);
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

  /** Sequence C.2 (Cipher, Glaucus): the real science behind the animal that was hunting the
   *  player, looked up from THREAT_DISCOVERY (see docs/SCIENCE.md for why only some threats
   *  qualify). Only reached when stepsFor() included 'threat', so this is always set. */
  private threat(): void {
    const { width, height } = this.scale;
    const info = THREAT_DISCOVERY[this.character.id]!;
    const d = DISCOVERIES[info.id];
    this.text(height * 0.14, info.question, {
      ...TEXT_STYLES.title,
      fontSize: '36px',
      color: '#9fc0c8',
    });
    this.text(height * 0.42, d.text, {
      ...TEXT_STYLES.body,
      fontSize: '27px',
      align: 'center',
      lineSpacing: 10,
      wordWrap: { width: width * 0.68 },
    });
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
    // Cipher's and Glaucus's "more" screens also link their threat's own research, since the
    // player just met it (see THREAT_DISCOVERY).
    const threatInfo = THREAT_DISCOVERY[c.id];
    const threat = threatInfo ? DISCOVERIES[threatInfo.id] : null;
    const accent = c.palette.accent;
    this.text(height * 0.08, `${c.name} · ${c.species}`, {
      ...TEXT_STYLES.hud,
      color: c.palette.ui,
    });

    const open = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');
    const exploreLinks = threat ? [d.explore, threat.explore] : [d.explore];
    exploreLinks.forEach((ref, i) =>
      this.buttons.push(
        new Button(
          this,
          width / 2 - 250,
          height * 0.2 + i * 62,
          460,
          52,
          i === 0 ? 'EXPLORE THE REAL SCIENCE' : `EXPLORE: ${threatInfo!.shortLabel}`,
          () => open(ref.url),
          accent,
        ),
      ),
    );
    const research = threat ? [...d.research, ...threat.research] : d.research;
    research.forEach((r, i) =>
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
    const row = height * (threat ? 0.56 : 0.48);
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
    this.text(height * 0.84, 'MINUS 80 STUDIOS', { ...TEXT_STYLES.hud, color: '#9fc0c8' });
    this.text(height * 0.9, 'Inspired by real discoveries.', TEXT_STYLES.warm);
  }
}
