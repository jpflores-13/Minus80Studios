import Phaser from 'phaser';
import { CHARACTER_PITCH, sound, type SfxName } from '../audio/Sound';
import { getCharacter, preyNoun, preySpritePrefix, threatNoun } from '../characters';
import type { CharacterConfig } from '../characters/types';
import { PIXEL } from '../config/gameConfig';
import { markOnce, settings } from '../config/settings';
import { TUNING } from '../config/tuning';
import { Reef } from '../entities/Reef';
import { HuntControls } from '../input/HuntControls';
import { TouchControls } from '../input/TouchControls';
import { applyAssist } from '../systems/assist';
import { createHunt, isCatchable, stepHunt, type HuntEvent, type HuntState } from '../systems/hunt';
import { Button } from '../ui/Button';
import { announce } from '../ui/announce';
import { Hud } from '../ui/Hud';
import { TEXT_STYLES } from '../ui/text';

export interface HuntSceneData {
  characterId?: string;
  seed?: number;
}

// The player's chosen keys, shown in the help text.
const slotKeys = () => {
  const k = settings().keys;
  return {
    primary: keyLabel(k.primary),
    secondary: keyLabel(k.secondary),
    capture: keyLabel(k.capture),
  };
};
const keyLabel = (name: string) => ({ SPACE: 'Space', ESC: 'Esc' })[name] ?? name;
const CLOUD_COLORS = { override: 0xe9dcc0 } as const;

// Reads input, steps the hunt, draws the result. Rules live in systems/hunt.ts.
export class HuntScene extends Phaser.Scene {
  private state!: HuntState;
  private character!: CharacterConfig;
  private controls!: HuntControls;
  private touch: TouchControls | null = null;
  private reef!: Reef;
  private hud!: Hud;
  private snail!: Phaser.GameObjects.Image;
  // One sprite/icon per threat. A lone octopus or shark is a pod of one; the orca pod (Glaucus's
  // threat) is several, drawn much bigger — see BootScene's drawOrcaThreat and docs/SCIENCE.md.
  private threatSprites: Phaser.GameObjects.Image[] = [];
  private threatIcons: Phaser.GameObjects.Text[] = [];
  private fishSprites = new Map<number, Phaser.GameObjects.Image>();
  private fishIcons = new Map<number, Phaser.GameObjects.Text>();
  private fx!: Phaser.GameObjects.Graphics;
  private flashes: {
    from: { x: number; y: number };
    to: { x: number; y: number };
    until: number;
    hit: boolean;
  }[] = [];
  private helpCard!: Phaser.GameObjects.Text;
  private tutorial: { primary: boolean; secondary: boolean; capture: boolean } | null = null;
  private ended = false;
  private pitch = 1;

  constructor() {
    super('Hunt');
  }

  create(data: HuntSceneData): void {
    this.character = getCharacter(data.characterId ?? 'atlas');
    this.pitch = CHARACTER_PITCH[this.character.id] ?? 1;
    const seed = data.seed ?? Math.floor(Math.random() * 1e9);
    this.state = createHunt(
      this.character,
      seed,
      { width: this.scale.width, height: this.scale.height },
      { relaxed: settings().relaxed },
    );
    this.ended = false;
    this.flashes = [];
    this.fishSprites.clear();
    this.fishIcons.clear();
    this.tutorial = settings().tutorialDone.includes(this.character.id)
      ? null
      : { primary: false, secondary: false, capture: false };

    this.reef = new Reef(this, 2026);
    this.fx = this.add.graphics().setDepth(5);
    const spritePrefix = preySpritePrefix(this.character);
    for (const f of this.state.fish) {
      this.fishSprites.set(
        f.id,
        this.add
          .image(f.pos.x, f.pos.y, `${spritePrefix}-${f.school % 3}`)
          .setScale(PIXEL)
          .setDepth(10),
      );
      this.fishIcons.set(
        f.id,
        this.add.text(f.pos.x, f.pos.y, '', TEXT_STYLES.small).setOrigin(0.5).setDepth(12),
      );
    }
    this.snail = this.add
      .image(this.state.snail.pos.x, this.state.snail.pos.y, `player-${this.character.id}`)
      .setScale(PIXEL)
      .setDepth(11);

    new Button(
      this,
      this.scale.width - 130,
      30,
      90,
      36,
      'HOME',
      () => this.scene.start('Title'),
      this.character.palette.accent,
    );
    new Button(
      this,
      this.scale.width - 230,
      30,
      90,
      36,
      'PAUSE',
      () => this.pauseHunt(),
      this.character.palette.accent,
    );
    const pod = [this.state.predator, ...this.state.pack];
    this.threatSprites = pod.map((m) =>
      this.add
        .image(m.pos.x, m.pos.y, this.character.threat)
        .setScale(PIXEL)
        .setDepth(11)
        .setVisible(!settings().relaxed),
    );
    this.threatIcons = pod.map((m) =>
      this.add
        .text(m.pos.x, m.pos.y, '', { ...TEXT_STYLES.hud, color: '#ffb3c1' })
        .setOrigin(0.5)
        .setDepth(12),
    );
    this.controls = new HuntControls(this);
    this.touch = this.sys.game.device.input.touch
      ? new TouchControls(this, this.character, () => this.state)
      : null;
    // Some browsers don't report touch support up front; switch on at the first touch.
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.wasTouch && !this.touch) {
        this.touch = new TouchControls(this, this.character, () => this.state);
        this.helpCard.setText(this.helpText());
      }
    });
    this.hud = new Hud(this, this.character);
    this.helpCard = this.add
      .text(this.scale.width / 2, 170, this.helpText(), { ...TEXT_STYLES.small, lineSpacing: 6 })
      .setOrigin(0.5, 0)
      .setDepth(110)
      .setBackgroundColor('#06192be6')
      .setPadding(16, 12, 16, 12);
    this.time.delayedCall(14000, () => this.helpCard.setVisible(false));
    announce(
      `Hunt started as ${this.character.name}. Capture ${TUNING.hunt.objectiveCaptures} ` +
        `${preyNoun(this.character, TUNING.hunt.objectiveCaptures)}. ${this.helpText()}`,
    );

    const kb = this.input.keyboard;
    const mapped = Object.values(settings().keys);
    const bind = (key: string, fn: () => void) => {
      if (!mapped.includes(key)) kb?.on(`keydown-${key}`, fn);
    };
    kb?.on(`keydown-${settings().keys.pause}`, () => this.pauseHunt());
    bind('R', () => this.scene.restart({ characterId: this.character.id }));
    bind('H', () => {
      this.helpCard.setVisible(!this.helpCard.visible);
      if (this.helpCard.visible) announce(this.helpText());
    });
    bind('M', () => this.hud.say(sound.toggleMute() ? 'Sound off' : 'Sound on'));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      kb?.removeAllListeners();
      sound.stopAmbience();
    });
    this.input.once('pointerdown', () => sound.unlock());
    sound.unlock();
    sound.startAmbience();
    this.cameras.main.fadeIn(500);

    if (import.meta.env.DEV) {
      void import('../debug/DebugPanel').then(({ DebugPanel }) =>
        DebugPanel.attach(this, () => this.state),
      );
    }
  }

  override update(time: number, deltaMs: number): void {
    // Clamp dt so a backgrounded tab doesn't simulate a giant time step.
    const dt = Math.min(deltaMs / 1000, 0.1);
    this.touch?.update();
    const keyboard = this.controls.read();
    const raw = this.touch ? this.touch.apply(keyboard) : keyboard;
    const input = settings().assist ? applyAssist(this.state, raw) : raw;
    const before = this.state.captured;
    const events = stepHunt(this.state, input, dt);
    if (this.state.captured > before) {
      announce(
        `${this.state.captured} of ${TUNING.hunt.objectiveCaptures} ` +
          `${preyNoun(this.character, TUNING.hunt.objectiveCaptures)} captured.`,
      );
    }
    for (const e of events) this.react(e);
    this.reef.update(time, dt);
    this.draw(time);
    this.hud.update(this.state, this.tutorial);
  }

  private helpText(): string {
    const c = this.character;
    const lines = (['primary', 'secondary', 'capture'] as const).map(
      (slot, i) =>
        `${i + 1}  [${slotKeys()[slot]}] ${c.abilities[slot].label}: ${c.abilities[slot].blurb}`,
    );
    return [
      `${c.name} · ${c.title}   Signature combo: ${c.combo}`,
      ...lines,
      `Watch out for the ${threatNoun(c)}: it spots you when you move. Hold still to hide.`,
      this.touch
        ? 'Touch: use MOVE (bottom left) or press and hold on the reef to crawl there · quick tap to aim · buttons on the right'
        : `Move ${['up', 'left', 'down', 'right'].map((a) => keyLabel(settings().keys[a as 'up'])).join('')} / arrows · aim with the mouse · Pause ${keyLabel(settings().keys.pause)} · Restart R · Help H · Mute M`,
      settings().relaxed
        ? `Relaxed mode: no timer, and the ${threatNoun(this.character)} won’t grab you.`
        : '',
      settings().assist
        ? 'Assist is on: abilities aim themselves and capture happens on its own.'
        : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  private sfx(name: SfxName): void {
    sound.play(name, this.pitch);
  }

  private tick(step: 'primary' | 'secondary' | 'capture'): void {
    if (!this.tutorial || this.tutorial[step]) return;
    this.tutorial[step] = true;
    if (this.tutorial.primary && this.tutorial.secondary && this.tutorial.capture) {
      markOnce('tutorialDone', this.character.id);
      this.hud.say('Tutorial complete. Now finish the hunt!', 2500);
      this.time.delayedCall(2500, () => (this.tutorial = null));
    }
  }

  private react(e: HuntEvent): void {
    const now = this.time.now;
    switch (e.type) {
      case 'cloud':
        this.helpCard.setVisible(false);
        this.sfx('cloud');
        this.tick(e.effect === this.cloudEffect('primary') ? 'primary' : 'secondary');
        break;
      case 'strike-hit':
        this.helpCard.setVisible(false);
        this.flashes.push({ from: e.from, to: e.to, until: now + 180, hit: true });
        this.sfx('strike');
        this.tick('primary');
        break;
      case 'strike-miss':
        this.flashes.push({ from: e.from, to: e.to, until: now + 180, hit: false });
        this.sfx('miss');
        this.hud.say('Missed! The school is startled.');
        break;
      case 'lock':
        this.sfx('lock');
        this.tick('secondary');
        break;
      case 'reel-start':
        this.sfx('reel');
        break;
      case 'tether-broken':
        this.sfx('snap');
        this.hud.say(
          `The ${preyNoun(this.character, 1)} recovered and broke free. ` +
            `Try ${this.character.abilities.secondary.label} first.`,
        );
        break;
      case 'capture':
        if (!settings().reducedEffects) this.cameras.main.shake(120, 0.002);
        for (const id of e.fishIds) {
          const sprite = this.fishSprites.get(id);
          if (sprite)
            this.tweens.add({
              targets: sprite,
              x: this.snail.x,
              y: this.snail.y,
              scale: 0,
              duration: 350,
            });
          this.fishIcons.get(id)?.setText('');
        }
        this.sfx('capture');
        this.tick('capture');
        this.hud.say(
          e.fishIds.length > 1
            ? `Captured ${e.fishIds.length} ${preyNoun(this.character, e.fishIds.length)}!`
            : 'Captured!',
        );
        break;
      case 'capture-miss':
        this.sfx('denied');
        this.hud.say(
          `Nothing catchable in reach. Weaken ${preyNoun(this.character, 2)} first ` +
            `(${this.character.combo}).`,
        );
        break;
      case 'denied':
        this.sfx('denied');
        this.hud.say(
          e.reason === 'cooldown'
            ? 'Still recovering…'
            : e.reason === 'no-venom'
              ? 'Not enough venom'
              : `${this.character.abilities.primary.label} a ${preyNoun(this.character, 1)} first`,
        );
        break;
      case 'predator-chase':
        if (this.state.options.relaxed) break;
        this.sfx('warn');
        this.hud.say(`A ${threatNoun(this.character)} spotted you! Hold still or get away.`, 2500);
        break;
      case 'grabbed':
        this.sfx('grab');
        if (!settings().reducedEffects) this.cameras.main.shake(250, 0.006);
        this.hud.say(
          `Grabbed by the ${threatNoun(this.character)}! Stunned, and you lost some venom.`,
          2500,
        );
        break;
      case 'won':
      case 'lost':
        this.finish(e.type === 'won');
        break;
    }
  }

  private cloudEffect(slot: 'primary' | 'secondary'): string | undefined {
    const a = this.character.abilities[slot];
    return a.kind === 'cloud' ? a.effect : undefined;
  }

  private draw(time: number): void {
    const s = this.state;
    const reduced = settings().reducedEffects;
    this.snail.setPosition(s.snail.pos.x, s.snail.pos.y).setRotation(s.snail.heading);
    this.snail.setAlpha(s.snail.stunned > 0 && Math.floor(time / 120) % 2 === 0 ? 0.4 : 1);
    // The octopus threat sprite is drawn facing "up"; the shark and orca, like the player
    // sprites, face right, so only the octopus needs the extra quarter turn.
    const threatRotationOffset = this.character.threat === 'octopus' ? Math.PI / 2 : 0;
    const pod = [s.predator, ...s.pack];
    pod.forEach((o, i) => {
      const sprite = this.threatSprites[i];
      const icon = this.threatIcons[i];
      if (!sprite || !icon) return;
      sprite.setPosition(o.pos.x, o.pos.y).setRotation(o.heading + threatRotationOffset);
      sprite.setAlpha(o.mode === 'retreat' ? 0.6 : 1);
      icon
        .setPosition(o.pos.x, o.pos.y - 34)
        .setText(o.mode === 'chase' ? '!!' : o.awareness > 0.3 ? '?' : '');
    });

    const g = this.fx;
    g.clear();
    const accent = this.character.palette.cloud;

    // Venom clouds. Each type has its own pattern (shape cue, not just colour):
    // insulin = dots, override = crosses, dampen = rippling rings.
    for (const c of s.clouds) {
      const fade = 1 - c.age / c.life;
      const color = c.effect === 'override' ? CLOUD_COLORS.override : accent;
      g.fillStyle(color, 0.14 * fade);
      g.fillCircle(c.pos.x, c.pos.y, c.radius);
      g.lineStyle(2, color, 0.5 * fade);
      g.strokeCircle(c.pos.x, c.pos.y, c.radius);
      if (c.effect === 'dampen') {
        for (let k = 1; k <= 3; k++) {
          const r = (c.radius * ((k / 3 + (reduced ? 0 : time / 3000)) % 1)) | 0;
          g.lineStyle(1, 0xffffff, 0.3 * fade);
          g.strokeCircle(c.pos.x, c.pos.y, r);
        }
        continue;
      }
      g.fillStyle(0xffffff, 0.35 * fade);
      for (let i = 0; i < 10; i++) {
        const a = i * 0.63 + (reduced ? 0 : time / 2000);
        const r = c.radius * (0.3 + (0.5 * ((i * 37) % 10)) / 10);
        const x = c.pos.x + Math.cos(a) * r;
        const y = c.pos.y + Math.sin(a) * r;
        if (c.effect === 'insulin') g.fillCircle(x, y, 3);
        else {
          g.fillRect(x - 4, y - 1, 8, 2);
          g.fillRect(x - 1, y - 4, 2, 8);
        }
      }
    }

    this.drawAimPreview(g);

    // Strike flashes: a jagged harpoon line, stylised (no literal electricity).
    this.flashes = this.flashes.filter((f) => f.until > this.time.now);
    for (const f of this.flashes) {
      g.lineStyle(f.hit ? 3 : 2, f.hit ? 0xffe9a8 : 0xffffff, f.hit ? 1 : 0.5);
      g.beginPath();
      g.moveTo(f.from.x, f.from.y);
      for (let i = 1; i < 6; i++) {
        const t = i / 6;
        g.lineTo(
          f.from.x + (f.to.x - f.from.x) * t + (i % 2 ? 6 : -6),
          f.from.y + (f.to.y - f.from.y) * t + (i % 2 ? -6 : 6),
        );
      }
      g.lineTo(f.to.x, f.to.y);
      g.strokePath();
    }

    // Tether: dashed line from proboscis to the struck fish; lock = spinning ring.
    if (s.tether) {
      const f = s.fish.find((x) => x.id === s.tether?.fishId);
      if (f) {
        const steps = 12;
        g.lineStyle(2, 0xffe9a8, 0.9);
        for (let i = 0; i < steps; i += 2) {
          const a = i / steps;
          const b = (i + 1) / steps;
          g.lineBetween(
            s.snail.pos.x + (f.pos.x - s.snail.pos.x) * a,
            s.snail.pos.y + (f.pos.y - s.snail.pos.y) * a,
            s.snail.pos.x + (f.pos.x - s.snail.pos.x) * b,
            s.snail.pos.y + (f.pos.y - s.snail.pos.y) * b,
          );
        }
        if (f.lock > 0.1) {
          g.lineStyle(3, accent, 0.4 + 0.6 * f.lock);
          const spin = reduced ? 0 : time / 300;
          for (let k = 0; k < 4; k++) {
            g.beginPath();
            g.arc(f.pos.x, f.pos.y, 20, spin + k * 1.57, spin + k * 1.57 + 0.9);
            g.strokePath();
          }
        }
      }
    }

    // Fish: posture (wobble, stillness), icons, and capture brackets communicate state.
    for (const f of s.fish) {
      const sprite = this.fishSprites.get(f.id);
      const icon = this.fishIcons.get(f.id);
      if (!sprite || !icon || f.mode === 'captured') continue;
      const wobble = f.mode === 'impaired' && !reduced ? Math.sin(time / 120 + f.id) * 0.5 : 0;
      const twitch =
        (f.mode === 'immobilized' || f.mode === 'tethered') && !reduced
          ? Math.sin(time / 40 + f.id) * 0.15
          : 0;
      sprite.setPosition(f.pos.x, f.pos.y).setRotation(f.heading + wobble + twitch);
      sprite.setAlpha(f.responsiveness < 0.6 ? 0.75 : 1);
      const catchable = isCatchable(s, f);
      icon.setPosition(f.pos.x, f.pos.y - 22);
      icon.setText(
        catchable
          ? ''
          : f.mode === 'fleeing'
            ? '!'
            : f.mode === 'immobilized'
              ? 'x'
              : f.mode === 'impaired'
                ? '~'
                : f.responsiveness < 0.6
                  ? 'z'
                  : f.mode === 'alert'
                    ? '?'
                    : '',
      );
      if (catchable) {
        const r = 16 + (reduced ? 0 : Math.sin(time / 150) * 2);
        g.lineStyle(2, 0xffffff, 0.9);
        g.strokeRect(f.pos.x - r, f.pos.y - r, r * 2, r * 2);
      }
    }
  }

  private drawAimPreview(g: Phaser.GameObjects.Graphics): void {
    const s = this.state;
    const p = this.input.activePointer;
    const primary = this.character.abilities.primary;
    const dx = p.worldX - s.snail.pos.x;
    const dy = p.worldY - s.snail.pos.y;
    const d = Math.hypot(dx, dy) || 1;
    // On touch screens the reticle from TouchControls shows the aim instead.
    if (!this.touch && primary.kind === 'cloud') {
      const k = d > primary.range ? primary.range / d : 1;
      g.lineStyle(1, 0xffffff, 0.12);
      g.strokeCircle(s.snail.pos.x, s.snail.pos.y, primary.range);
      g.lineStyle(2, 0xffffff, 0.35);
      g.strokeCircle(s.snail.pos.x + dx * k, s.snail.pos.y + dy * k, primary.radius);
    } else if (!this.touch && primary.kind === 'strike' && !s.tether) {
      const k = d > primary.range ? primary.range / d : 1;
      const ax = s.snail.pos.x + dx * k;
      const ay = s.snail.pos.y + dy * k;
      const locked = s.fish.some(
        (f) =>
          f.mode !== 'captured' &&
          Math.hypot(f.pos.x - ax, f.pos.y - ay) <= primary.aimTolerance &&
          Math.hypot(f.pos.x - s.snail.pos.x, f.pos.y - s.snail.pos.y) <= primary.range,
      );
      g.lineStyle(1, 0xffffff, 0.12);
      g.strokeCircle(s.snail.pos.x, s.snail.pos.y, primary.range);
      g.lineStyle(2, locked ? 0xffe9a8 : 0xffffff, locked ? 1 : 0.4);
      g.strokeCircle(ax, ay, primary.aimTolerance);
      g.lineBetween(ax - 8, ay, ax + 8, ay);
      g.lineBetween(ax, ay - 8, ax, ay + 8);
    }
    const cap = this.character.abilities.capture;
    if (cap.kind === 'engulf') {
      g.lineStyle(2, this.character.palette.accent, 0.25);
      g.strokeCircle(s.snail.pos.x, s.snail.pos.y, cap.radius);
    }
  }

  private pauseHunt(): void {
    if (this.ended) return;
    this.scene.launch('Pause', { characterId: this.character.id });
    this.scene.pause();
  }

  private finish(won: boolean): void {
    if (this.ended) return;
    this.ended = true;
    this.sfx(won ? 'win' : 'lose');
    const s = this.state;
    this.time.delayedCall(won ? 900 : 300, () => {
      this.scene.start('Results', {
        won,
        characterId: this.character.id,
        captured: s.captured,
        seconds: s.time,
        venomSpent: s.venom.spent,
        capturedSchools: s.capturedIds.map((id) => s.fish.find((f) => f.id === id)?.school ?? 0),
      });
    });
  }
}
