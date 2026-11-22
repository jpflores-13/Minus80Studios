import Phaser from 'phaser';
import { CHARACTER_PITCH, sound } from '../audio/Sound';
import { CHARACTERS } from '../characters';
import type { Attributes, CharacterConfig } from '../characters/types';
import { PIXEL } from '../config/gameConfig';
import { settings } from '../config/settings';
import { Button } from '../ui/Button';
import { announce } from '../ui/announce';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

export interface SelectData {
  mode?: 'hunt' | 'science';
  characterId?: string;
}

const ATTRIBUTE_LABELS: Record<keyof Attributes, string> = {
  speed: 'Speed',
  range: 'Range',
  burst: 'Burst',
  area: 'Area',
  stealth: 'Stealth',
};
const KEYS = { primary: 'Q', secondary: 'E', capture: 'SPACE' } as const;

/**
 * "Choose Your Assassin": three cards side by side, all available immediately.
 * In science mode the same screen picks which species' discovery to view.
 */
export class SelectScene extends Phaser.Scene {
  private index = 1;
  private mode: 'hunt' | 'science' = 'hunt';
  private cards: Phaser.GameObjects.Container[] = [];
  private frames: Phaser.GameObjects.Rectangle[] = [];
  // Each card's own fit-to-screen scale (1 unless its content was too tall to fit at full
  // size), applied underneath the focus-based 1 / 0.97 scale in highlight() — the two multiply
  // together rather than one overwriting the other.
  private fitScale: number[] = [];
  // Cards slide so the selected one is always centered, a "windowed" carousel that scales to
  // any roster size (today: three cone snails plus the octopus and blue shark escalation
  // levels). Each card is sized to its own content (see buildCard) rather than a fixed guess,
  // since Cipher's and Glaucus's longer tagline/weakness text doesn't fit the snails' box.
  private readonly cardW = 460;
  private readonly cardSpacing = this.cardW + 16;

  constructor() {
    super('Select');
  }

  create(data: SelectData): void {
    this.mode = data.mode ?? 'hunt';
    const preselect = CHARACTERS.findIndex((c) => c.id === data.characterId);
    this.index = preselect >= 0 ? preselect : 1;
    this.cards = [];
    this.frames = [];
    this.fitScale = [];
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(0x040f1a);
    this.cameras.main.fadeIn(400);

    addCenteredText(
      this,
      44,
      this.mode === 'hunt' ? 'CHOOSE YOUR ASSASSIN' : 'DID YOU KNOW?',
      TEXT_STYLES.title,
    );
    addCenteredText(
      this,
      height - 26,
      `← → or 1–${CHARACTERS.length} choose · ENTER ${this.mode === 'hunt' ? 'hunt' : 'view'} · ESC back`,
      TEXT_STYLES.hint,
    );

    new Button(this, 70, height - 26, 110, 36, 'HOME', () => this.scene.start('Title'));
    CHARACTERS.forEach((c, i) => {
      const x = width / 2 + (i - this.index) * this.cardSpacing;
      const card = this.buildCard(c, x, 74, this.cardW);
      this.cards.push(card);
    });
    this.highlight();

    const kb = this.input.keyboard;
    kb?.on('keydown-LEFT', () => this.move(-1));
    kb?.on('keydown-RIGHT', () => this.move(1));
    kb?.on('keydown-A', () => this.move(-1));
    kb?.on('keydown-D', () => this.move(1));
    kb?.on('keydown-ONE', () => this.pick(0));
    kb?.on('keydown-TWO', () => this.pick(1));
    kb?.on('keydown-THREE', () => this.pick(2));
    kb?.on('keydown-FOUR', () => this.pick(3));
    kb?.on('keydown-FIVE', () => this.pick(4));
    kb?.on('keydown-ENTER', () => this.confirm());
    kb?.on('keydown-SPACE', () => this.confirm());
    kb?.on('keydown-ESC', () => this.scene.start('Title'));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => kb?.removeAllListeners());
  }

  private buildCard(
    c: CharacterConfig,
    cx: number,
    top: number,
    w: number,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(cx, top);
    const left = -w / 2 + 18;
    const wrap = { wordWrap: { width: w - 36 } };
    const txt = (y: number, s: string, style: Phaser.Types.GameObjects.Text.TextStyle) =>
      this.add.text(left, y, s, { ...style, ...wrap });

    const portrait = this.add.image(0, 70, `player-${c.id}`).setScale(PIXEL * 2.2);
    if (!settings().reducedEffects) {
      this.tweens.add({
        targets: portrait,
        y: 64,
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
    // Every block below is stacked off the real, measured height of the one before it — not a
    // guessed fixed gap — so a longer tagline or weakness (Cipher's and Glaucus's, especially)
    // pushes the rest down instead of overlapping it. The card frame itself is sized to the
    // final total afterward, so content can never run past the card's own bottom edge either.
    let y = 118;
    const name = this.add
      .text(0, y, c.name, { ...TEXT_STYLES.title, fontSize: '38px', color: c.palette.ui })
      .setOrigin(0.5, 0);
    y += name.height + 2;
    const sub = this.add
      .text(0, y, `${c.title}  ·  ${c.species}`, { ...TEXT_STYLES.small, fontStyle: 'italic' })
      .setOrigin(0.5, 0);
    y += sub.height + 8;
    const tagline = this.add
      .text(0, y, `“${c.tagline}”`, {
        ...TEXT_STYLES.small,
        color: '#f3d9a4',
        align: 'center',
        ...wrap,
      })
      .setOrigin(0.5, 0);
    y += tagline.height + 12;

    const rest: Phaser.GameObjects.Text[] = [];
    if (settings().largeText) {
      // Compact card for large text: names only. Full ability text is read aloud and on the hunt's help card.
      const compact = txt(
        y,
        [
          ...(Object.keys(KEYS) as (keyof typeof KEYS)[]).map(
            (slot) => `[${KEYS[slot]}] ${c.abilities[slot].label}`,
          ),
          '',
          `+ ${c.strengths.join(', ')}`,
          `− ${c.weaknesses.join(', ')}`,
        ].join('\n'),
        { ...TEXT_STYLES.small, fontSize: '15px', lineSpacing: 4 },
      );
      y += compact.height;
      rest.push(compact);
    } else {
      const personality = txt(y, c.personality, { ...TEXT_STYLES.small, color: '#9fc0c8' });
      y += personality.height + 12;

      const abilityLines = (Object.keys(KEYS) as (keyof typeof KEYS)[])
        .map((slot) => `[${KEYS[slot]}] ${c.abilities[slot].label}: ${c.abilities[slot].blurb}`)
        .join('\n');
      const abilities = txt(y, abilityLines, {
        ...TEXT_STYLES.small,
        fontSize: '15px',
        lineSpacing: 4,
      });
      y += abilities.height + 12;

      const attrs = (Object.keys(ATTRIBUTE_LABELS) as (keyof Attributes)[])
        .map(
          (k) =>
            `${ATTRIBUTE_LABELS[k].padEnd(8)} ${'●'.repeat(c.attributes[k])}${'○'.repeat(5 - c.attributes[k])}`,
        )
        .join('\n');
      const attributes = this.add.text(left, y, attrs, {
        ...TEXT_STYLES.small,
        fontSize: '15px',
        fontFamily: 'monospace',
      });
      y += attributes.height + 12;

      // Full card width, not a half-width side column — a one-sentence weakness (Cipher's,
      // Glaucus's) needs the room, and stacking rather than overlapping a shorter block keeps
      // both readable.
      const sw = txt(y, `+ ${c.strengths.join('\n+ ')}\n− ${c.weaknesses.join('\n− ')}`, {
        ...TEXT_STYLES.small,
        fontSize: '14px',
        lineSpacing: 3,
      });
      y += sw.height;
      rest.push(personality, abilities, attributes, sw);
    }

    const frame = this.add
      .rectangle(0, 0, w, y + 20, 0x06192b, 0.95)
      .setOrigin(0.5, 0)
      .setStrokeStyle(2, c.palette.accent, 0.4);
    frame.setInteractive({ useHandCursor: true });
    frame.on('pointerover', () => this.pick(CHARACTERS.indexOf(c), false));
    frame.on('pointerup', () => {
      this.pick(CHARACTERS.indexOf(c), false);
      this.confirm();
    });
    this.frames.push(frame);

    container.add([frame, portrait, name, sub, tagline, ...rest]);

    // Last resort, not the main fix: if a character's text is simply too long to fit between
    // the title and the footer hint even at full size, shrink the whole card uniformly rather
    // than let it run off the bottom of the screen. Scaling (not clipping) keeps everything
    // inside it legible, just smaller.
    const available = this.scale.height - top - 40;
    const cardH = y + 20;
    const scale = cardH > available ? available / cardH : 1;
    this.fitScale.push(scale);
    container.setScale(scale);

    return container;
  }

  private move(d: number): void {
    this.pick((this.index + d + CHARACTERS.length) % CHARACTERS.length);
  }

  private pick(i: number, withSound = true): void {
    if (i === this.index && !withSound) return;
    this.index = i;
    sound.unlock();
    sound.play('select', CHARACTER_PITCH[CHARACTERS[i]!.id] ?? 1);
    this.highlight();
  }

  private highlight(): void {
    const c = CHARACTERS[this.index];
    if (c) {
      const abilities = (['primary', 'secondary', 'capture'] as const)
        .map((slot) => `${c.abilities[slot].label}: ${c.abilities[slot].blurb}`)
        .join(' ');
      announce(
        `${c.name}, ${c.title}, ${c.species}. ${c.tagline} ${c.personality} ${abilities} Press Enter to choose. ${this.index + 1} of ${CHARACTERS.length}.`,
      );
    }
    const { width } = this.scale;
    this.cards.forEach((card, i) => {
      const active = i === this.index;
      card.setAlpha(active ? 1 : 0.55);
      card.setScale((this.fitScale[i] ?? 1) * (active ? 1 : 0.97));
      this.tweens.add({
        targets: card,
        x: width / 2 + (i - this.index) * this.cardSpacing,
        duration: 250,
        ease: 'Sine.easeOut',
      });
      this.frames[i]?.setStrokeStyle(
        active ? 4 : 2,
        CHARACTERS[i]!.palette.accent,
        active ? 1 : 0.4,
      );
    });
  }

  private confirm(): void {
    const c = CHARACTERS[this.index]!;
    sound.play('confirm', CHARACTER_PITCH[c.id] ?? 1);
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (this.mode === 'hunt') this.scene.start('Hunt', { characterId: c.id });
      else this.scene.start('Discovery', { characterId: c.id, mode: 'gallery' });
    });
  }
}
