import Phaser from 'phaser';
import { getCharacter } from '../characters';
import type { CharacterConfig } from '../characters/types';
import { PIXEL } from '../config/gameConfig';
import { TUNING } from '../config/tuning';
import { Reef } from '../entities/Reef';
import { HuntControls } from '../input/HuntControls';
import { vulnerability } from '../systems/fish';
import { createHunt, stepHunt, type HuntEvent, type HuntState } from '../systems/hunt';
import { Hud } from '../ui/Hud';
import { TEXT_STYLES } from '../ui/text';

export interface HuntSceneData {
  characterId?: string;
  seed?: number;
}

/**
 * Thin view over the pure hunt simulation: read input → stepHunt → draw state.
 * All rules live in src/systems/hunt.ts.
 */
export class HuntScene extends Phaser.Scene {
  private state!: HuntState;
  private character!: CharacterConfig;
  private controls!: HuntControls;
  private reef!: Reef;
  private hud!: Hud;
  private snail!: Phaser.GameObjects.Image;
  private fishSprites = new Map<number, Phaser.GameObjects.Image>();
  private fishIcons = new Map<number, Phaser.GameObjects.Text>();
  private fx!: Phaser.GameObjects.Graphics;
  private helpCard!: Phaser.GameObjects.Text;
  private ended = false;

  constructor() {
    super('Hunt');
  }

  create(data: HuntSceneData): void {
    this.character = getCharacter(data.characterId ?? 'atlas');
    const seed = data.seed ?? Math.floor(Math.random() * 1e9);
    this.state = createHunt(this.character, seed, {
      width: this.scale.width,
      height: this.scale.height,
    });
    this.ended = false;
    this.fishSprites.clear();
    this.fishIcons.clear();

    this.reef = new Reef(this, 2026);
    this.fx = this.add.graphics().setDepth(5);
    for (const f of this.state.fish) {
      this.fishSprites.set(
        f.id,
        this.add
          .image(f.pos.x, f.pos.y, `fish-${f.school % 3}`)
          .setScale(PIXEL)
          .setDepth(10),
      );
      this.fishIcons.set(
        f.id,
        this.add.text(f.pos.x, f.pos.y, '', TEXT_STYLES.small).setOrigin(0.5).setDepth(12),
      );
    }
    this.snail = this.add
      .image(this.state.snail.pos.x, this.state.snail.pos.y, `snail-${this.character.id}`)
      .setScale(PIXEL)
      .setDepth(11);

    this.controls = new HuntControls(this);
    this.hud = new Hud(this, this.character);
    this.helpCard = this.add
      .text(
        this.scale.width / 2,
        120,
        [
          `${this.character.name} · ${this.character.title}`,
          `1  [Q] ${this.character.abilities.primary.label}: aim at a school with the mouse`,
          `2  [E] ${this.character.abilities.secondary.label}: on the same fish, so they can't recover`,
          `3  [SPACE] ${this.character.abilities.capture.label}: get close to weakened fish (marked [ ])`,
          'Move: WASD / arrows · Pause: Esc · Restart: R · Help: H',
        ].join('\n'),
        { ...TEXT_STYLES.small, align: 'left', lineSpacing: 6 },
      )
      .setOrigin(0.5, 0)
      .setDepth(110)
      .setBackgroundColor('#06192be6')
      .setPadding(16, 12, 16, 12);
    this.time.delayedCall(12000, () => this.helpCard.setVisible(false));

    const kb = this.input.keyboard;
    kb?.on('keydown-ESC', () => this.pauseHunt());
    kb?.on('keydown-R', () => this.scene.restart({ characterId: this.character.id }));
    kb?.on('keydown-H', () => this.helpCard.setVisible(!this.helpCard.visible));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => kb?.removeAllListeners());
  }

  override update(time: number, deltaMs: number): void {
    // Clamp dt so a backgrounded tab doesn't simulate a giant time step.
    const dt = Math.min(deltaMs / 1000, 0.1);
    const events = stepHunt(this.state, this.controls.read(), dt);
    for (const e of events) this.react(e);
    this.reef.update(time, dt);
    this.draw(time);
    this.hud.update(this.state);
  }

  private react(e: HuntEvent): void {
    switch (e.type) {
      case 'cloud':
        this.helpCard.setVisible(false);
        break;
      case 'capture':
        this.cameras.main.shake(120, 0.002);
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
        this.hud.say(e.fishIds.length > 1 ? `Engulfed ${e.fishIds.length} fish!` : 'Engulfed!');
        break;
      case 'capture-miss':
        this.hud.say('Nothing to engulf: weaken fish first (Q then E)');
        break;
      case 'denied':
        this.hud.say(e.reason === 'cooldown' ? 'Still recovering…' : 'Not enough venom');
        break;
      case 'won':
      case 'lost':
        this.finish(e.type === 'won');
        break;
    }
  }

  private draw(time: number): void {
    const s = this.state;
    this.snail.setPosition(s.snail.pos.x, s.snail.pos.y).setRotation(s.snail.heading);

    const g = this.fx;
    g.clear();
    // Venom clouds: insulin-type = dotted fill; override-type = cross-hatched (shape cue, not just colour).
    for (const c of s.clouds) {
      const fade = 1 - c.age / c.life;
      g.fillStyle(c.effect === 'insulin' ? this.character.palette.cloud : 0xe9dcc0, 0.16 * fade);
      g.fillCircle(c.pos.x, c.pos.y, c.radius);
      g.lineStyle(2, c.effect === 'insulin' ? this.character.palette.cloud : 0xe9dcc0, 0.5 * fade);
      g.strokeCircle(c.pos.x, c.pos.y, c.radius);
      g.fillStyle(0xffffff, 0.35 * fade);
      for (let i = 0; i < 10; i++) {
        const a = i * 0.63 + time / 2000;
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

    // Aim preview: range ring around the snail and cloud footprint at the cursor.
    const primary = this.character.abilities.primary;
    if (primary.kind === 'cloud') {
      const p = this.input.activePointer;
      const dx = p.worldX - s.snail.pos.x;
      const dy = p.worldY - s.snail.pos.y;
      const d = Math.hypot(dx, dy);
      const k = d > primary.range ? primary.range / d : 1;
      g.lineStyle(1, 0xffffff, 0.12);
      g.strokeCircle(s.snail.pos.x, s.snail.pos.y, primary.range);
      g.lineStyle(2, 0xffffff, 0.35);
      g.strokeCircle(s.snail.pos.x + dx * k, s.snail.pos.y + dy * k, primary.radius);
    }
    const engulf = this.character.abilities.capture;
    g.lineStyle(2, this.character.palette.accent, 0.25);
    g.strokeCircle(s.snail.pos.x, s.snail.pos.y, engulf.radius);

    // Fish: posture (wobble), icons, and capture brackets communicate state.
    for (const f of s.fish) {
      const sprite = this.fishSprites.get(f.id);
      const icon = this.fishIcons.get(f.id);
      if (!sprite || !icon || f.mode === 'captured') continue;
      const wobble = f.mode === 'impaired' ? Math.sin(time / 120 + f.id) * 0.5 : 0;
      sprite.setPosition(f.pos.x, f.pos.y).setRotation(f.heading + wobble);
      const catchable = vulnerability(f) >= TUNING.capture.vulnerabilityThreshold;
      icon.setPosition(f.pos.x, f.pos.y - 22);
      icon.setText(
        catchable
          ? ''
          : f.mode === 'fleeing'
            ? '!'
            : f.mode === 'impaired'
              ? '~'
              : f.mode === 'alert'
                ? '?'
                : '',
      );
      if (catchable) {
        const r = 16 + Math.sin(time / 150) * 2;
        g.lineStyle(2, 0xffffff, 0.9);
        g.strokeRect(f.pos.x - r, f.pos.y - r, r * 2, r * 2);
      }
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
    const s = this.state;
    this.time.delayedCall(won ? 900 : 300, () => {
      this.scene.start('Results', {
        won,
        characterId: this.character.id,
        captured: s.captured,
        seconds: s.time,
        venomSpent: s.venom.spent,
      });
    });
  }
}
