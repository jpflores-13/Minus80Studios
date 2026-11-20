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

  constructor() {
    super('Select');
  }

  create(data: SelectData): void {
    this.mode = data.mode ?? 'hunt';
    const preselect = CHARACTERS.findIndex((c) => c.id === data.characterId);
    this.index = preselect >= 0 ? preselect : 1;
    this.cards = [];
    this.frames = [];
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
      `← → or 1 2 3 choose · ENTER ${this.mode === 'hunt' ? 'hunt' : 'view'} · ESC back`,
      TEXT_STYLES.hint,
    );

    new Button(this, 70, height - 26, 110, 36, 'HOME', () => this.scene.start('Title'));
    const cardW = 400;
    CHARACTERS.forEach((c, i) => {
      const x = width / 2 + (i - 1) * (cardW + 16);
      const card = this.buildCard(c, x, 92, cardW, height - 150);
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
    h: number,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(cx, top);
    const frame = this.add
      .rectangle(0, 0, w, h, 0x06192b, 0.95)
      .setOrigin(0.5, 0)
      .setStrokeStyle(2, c.palette.accent, 0.4);
    frame.setInteractive({ useHandCursor: true });
    frame.on('pointerover', () => this.pick(CHARACTERS.indexOf(c), false));
    frame.on('pointerup', () => {
      this.pick(CHARACTERS.indexOf(c), false);
      this.confirm();
    });
    this.frames.push(frame);
    const left = -w / 2 + 18;
    const wrap = { wordWrap: { width: w - 36 } };
    const txt = (y: number, s: string, style: Phaser.Types.GameObjects.Text.TextStyle) =>
      this.add.text(left, y, s, { ...style, ...wrap });

    const portrait = this.add.image(0, 70, `snail-${c.id}`).setScale(PIXEL * 2.2);
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
    const name = this.add
      .text(0, 120, c.name, { ...TEXT_STYLES.title, fontSize: '38px', color: c.palette.ui })
      .setOrigin(0.5, 0);
    const sub = this.add
      .text(0, 164, `${c.title}  ·  ${c.species}`, { ...TEXT_STYLES.small, fontStyle: 'italic' })
      .setOrigin(0.5, 0);
    const tagline = this.add
      .text(0, 192, `“${c.tagline}”`, {
        ...TEXT_STYLES.small,
        color: '#f3d9a4',
        align: 'center',
        ...wrap,
      })
      .setOrigin(0.5, 0);
    if (settings().largeText) {
      // Compact card for large text: names only. Full ability text is read aloud and on the hunt's help card.
      const compact = txt(
        250,
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
      container.add([frame, portrait, name, sub, tagline, compact]);
      return container;
    }

    const personality = txt(240, c.personality, { ...TEXT_STYLES.small, color: '#9fc0c8' });

    const abilityLines = (Object.keys(KEYS) as (keyof typeof KEYS)[])
      .map((slot) => `[${KEYS[slot]}] ${c.abilities[slot].label}: ${c.abilities[slot].blurb}`)
      .join('\n');
    const abilities = txt(272, abilityLines, {
      ...TEXT_STYLES.small,
      fontSize: '15px',
      lineSpacing: 4,
    });

    const attrs = (Object.keys(ATTRIBUTE_LABELS) as (keyof Attributes)[])
      .map(
        (k) =>
          `${ATTRIBUTE_LABELS[k].padEnd(8)} ${'●'.repeat(c.attributes[k])}${'○'.repeat(5 - c.attributes[k])}`,
      )
      .join('\n');
    const attributes = this.add.text(left, 468, attrs, {
      ...TEXT_STYLES.small,
      fontSize: '15px',
      fontFamily: 'monospace',
    });
    const sw = txt(468, '', { ...TEXT_STYLES.small, fontSize: '14px' })
      .setX(left + 170)
      .setWordWrapWidth(w - 200)
      .setText(`+ ${c.strengths.join('\n+ ')}\n− ${c.weaknesses.join('\n− ')}`);

    container.add([frame, portrait, name, sub, tagline, personality, abilities, attributes, sw]);
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
    this.cards.forEach((card, i) => {
      const active = i === this.index;
      card.setAlpha(active ? 1 : 0.55);
      card.setScale(active ? 1 : 0.97);
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
