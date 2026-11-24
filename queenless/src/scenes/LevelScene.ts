import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { CHARACTER_ORDER, CHARACTERS } from '../content/characters';
import { PALETTE, ZOOM } from '../config/gameConfig';
import { progress } from '../config/progress';
import { getLevel } from '../levels';
import type { LevelConfig } from '../levels/types';
import {
  buzzPulse,
  createColony,
  stepColony,
  TUNING,
  type ColonyEvent,
  type ColonyState,
  type Worker,
} from '../systems/colony';
import { createQueenlessState, stepQueenless, type QueenlessState } from '../systems/queenlessMode';
import { announce } from '../ui/announce';

/** Touch input shared with the HUD's on-screen stick and pulse button. */
export const touchInput = { dx: 0, dy: 0, pulse: false };

const STEP = 1 / 30;
const SITE_TEXTURE: Record<string, string> = {
  flower: 'flower-rose',
  broodCell: 'brood-cell',
  debris: 'debris',
  storage: 'storage',
};

export class LevelScene extends Phaser.Scene {
  colony!: ColonyState;
  level: LevelConfig | null = null;
  queenlessMode = false;
  private queenless: QueenlessState | null = null;
  private acc = 0;
  private workerSprites = new Map<number, Phaser.GameObjects.Image>();
  private siteSprites = new Map<string, Phaser.GameObjects.Image>();
  private fx!: Phaser.GameObjects.Graphics;
  pulseCooldown = 0;
  get pulseEnabled(): boolean {
    return this.queenlessMode || (this.level?.buzzPulseEnabled ?? true);
  }
  private pulsePressed = false;
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private ended = false;
  /** Read by HudScene: a visible echo of the game's bigger announce()-only moments, which used
   *  to have no on-screen confirmation at all for a sighted player. */
  toastText = '';
  toastUntil = 0;
  /** The on-screen intro panel's content. HudScene draws it: this scene's camera is zoomed 2x,
   * and a scroll-fixed panel drawn here would be scaled up around the screen centre and pushed
   * mostly off-screen (the bug that made The Daily Buzz look mis-sized). */
  intro: { title: string; lines: string[]; legend: string[]; firstLevel: boolean } = {
    title: '',
    lines: [],
    legend: [],
    firstLevel: false,
  };

  constructor() {
    super('Level');
  }

  create(data: { levelId?: string; queenlessMode?: boolean }): void {
    this.queenlessMode = data.queenlessMode ?? false;
    this.acc = 0;
    this.ended = false;
    this.pulseCooldown = 0;
    this.pulsePressed = false;
    this.workerSprites = new Map();
    this.siteSprites = new Map();
    this.toastText = '';
    this.toastUntil = 0;
    touchInput.dx = 0;
    touchInput.dy = 0;
    touchInput.pulse = false;

    if (this.queenlessMode) {
      this.level = null;
      this.queenless = createQueenlessState(Math.floor(Math.random() * 1e9));
      this.colony = this.queenless.colony;
    } else {
      this.level = getLevel(data.levelId ?? 'level-1');
      this.queenless = null;
      this.colony = createColony(this.level.colony, Math.floor(Math.random() * 1e9));
    }

    const cam = this.cameras.main;
    cam.setBackgroundColor(PALETTE.earth).setZoom(ZOOM).setBounds(-200, -200, 1400, 1100);
    this.drawGround();

    for (const site of this.colony.sites) {
      if (site.kind === 'rest') continue;
      const img = this.add
        .image(site.pos.x, site.pos.y, SITE_TEXTURE[site.kind] ?? 'flower-rose')
        .setDepth(2);
      this.siteSprites.set(site.id, img);
    }
    for (const w of this.colony.workers) {
      const img = this.add.image(w.pos.x, w.pos.y, 'bee-0').setDepth(w.isPlayer ? 10 : 5);
      const char = this.characterFor(w);
      if (char) img.setTint(char.accent);
      this.workerSprites.set(w.id, img);
    }
    const player = this.colony.workers.find((w) => w.isPlayer);
    if (player) {
      const sprite = this.workerSprites.get(player.id);
      if (sprite) cam.startFollow(sprite, true, 0.12, 0.12);
    }

    this.fx = this.add.graphics().setDepth(20);
    this.buildInput();
    this.intro = this.buildIntro();
    this.scene.launch('Hud', { level: this });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scene.stop('Hud');
      this.input.keyboard?.removeAllListeners();
    });
    sound.playSong(this.queenlessMode ? 'colony' : 'title');

    announce(`${this.intro.title}. ${this.intro.lines.join(' ')} ${this.intro.legend.join('. ')}`);
  }

  /**
   * The intro panel's text. Level 1 also gets an icon key, built from the kinds of site that are
   * actually on its map (it used to list brood cells and debris, which Level 1 doesn't have).
   */
  private buildIntro(): LevelScene['intro'] {
    const title = this.queenlessMode ? 'QUEENLESS MODE' : this.level!.name.toUpperCase();
    const lines = this.queenlessMode
      ? ['No queen from the start, and it only gets harder.']
      : this.level!.intro;
    const firstLevel = !this.queenlessMode && this.level?.id === 'level-1';
    const KEY: Record<string, string> = {
      flower: 'FLOWER: walk onto it to gather nectar',
      storage: 'HONEYPOT: bring nectar here to deliver it',
      broodCell: 'BROOD CELL: stand on it to tend the brood',
      debris: 'DEBRIS: stand on it to clear the mess',
    };
    const present = new Set(this.colony.sites.map((x) => x.kind));
    const legend = firstLevel
      ? (['flower', 'storage', 'broodCell', 'debris'] as const)
          .filter((k) => present.has(k))
          .map((k) => KEY[k]!)
      : [];
    return { title, lines, legend, firstLevel };
  }

  private characterFor(w: Worker) {
    const id = CHARACTER_ORDER.find((c) => CHARACTERS[c].name === w.name);
    return id ? CHARACTERS[id] : undefined;
  }

  private drawGround(): void {
    const g = this.add.graphics().setDepth(-5);
    g.fillStyle(PALETTE.earth, 1).fillRect(-200, -200, 1400, 1100);
    g.fillStyle(PALETTE.earthLight, 0.4);
    for (let x = -150; x < 1200; x += 70)
      for (let y = -150; y < 900; y += 70)
        if ((Math.floor(x / 70) + Math.floor(y / 70)) % 2 === 0) g.fillCircle(x, y, 3);
  }

  private buildInput(): void {
    const kb = this.input.keyboard;
    if (kb) {
      const K = Phaser.Input.Keyboard.KeyCodes;
      for (const [n, c] of Object.entries({
        left: K.LEFT,
        right: K.RIGHT,
        up: K.UP,
        down: K.DOWN,
        a: K.A,
        d: K.D,
        w: K.W,
        s: K.S,
      }))
        this.keys[n] = kb.addKey(c, true);
      kb.on('keydown-SPACE', () => (this.pulsePressed = true));
      kb.on('keydown-E', () => (this.pulsePressed = true));
      kb.on('keydown-ESC', () => this.pause());
      kb.on('keydown-P', () => this.pause());
      kb.on('keydown-R', () =>
        this.scene.restart({ levelId: this.level?.id, queenlessMode: this.queenlessMode }),
      );
    }
    this.input.addPointer(2);
    let drag: { x: number; y: number } | null = null;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.x < this.scale.width * 0.7) drag = { x: p.x, y: p.y };
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (drag && p.isDown) {
        touchInput.dx = Phaser.Math.Clamp((p.x - drag.x) / 40, -1, 1);
        touchInput.dy = Phaser.Math.Clamp((p.y - drag.y) / 40, -1, 1);
      }
    });
    const endDrag = () => {
      drag = null;
      touchInput.dx = 0;
      touchInput.dy = 0;
    };
    this.input.on('pointerup', endDrag);
    this.input.on('pointerupoutside', endDrag);
  }

  pause(): void {
    if (this.colony.done || (this.queenless?.collapsed ?? false)) return;
    sound.play('click');
    this.scene.pause();
    this.scene.launch('Pause', { levelId: this.level?.id, queenlessMode: this.queenlessMode });
  }

  /** HudScene reads toastText/toastUntil and shows them in a corner box — a visible counterpart
   *  to announce(), which only ever reached a screen reader. */
  toast(message: string, ms = 2400): void {
    this.toastText = message;
    this.toastUntil = this.time.now + ms;
  }

  private readInput(): { dx: number; dy: number } {
    const k = (n: string) => this.keys[n]?.isDown === true;
    let dx = (k('right') || k('d') ? 1 : 0) - (k('left') || k('a') ? 1 : 0) + touchInput.dx;
    let dy = (k('down') || k('s') ? 1 : 0) - (k('up') || k('w') ? 1 : 0) + touchInput.dy;
    const pad = this.input.gamepad?.pad1;
    if (pad) {
      if (Math.abs(pad.leftStick.x) > 0.2) dx = pad.leftStick.x;
      if (Math.abs(pad.leftStick.y) > 0.2) dy = pad.leftStick.y;
      if (pad.A || pad.B) this.pulsePressed ||= true;
    }
    return { dx: Phaser.Math.Clamp(dx, -1, 1), dy: Phaser.Math.Clamp(dy, -1, 1) };
  }

  override update(time: number, delta: number): void {
    const done = this.colony.done || (this.queenless?.collapsed ?? false);
    if (!done) {
      this.acc += Math.min(delta, 100) / 1000;
      const input = this.readInput();
      this.pulseCooldown = Math.max(0, this.pulseCooldown - delta / 1000);
      const wantPulse = this.pulsePressed || touchInput.pulse;
      this.pulsePressed = false;
      touchInput.pulse = false;
      while (this.acc >= STEP) {
        this.acc -= STEP;
        const events = this.queenless
          ? stepQueenless(this.queenless, input, STEP)
          : stepColony(this.colony, input, STEP);
        this.handle(events);
      }
      if (wantPulse && this.pulseEnabled && this.pulseCooldown <= 0) {
        const player = this.colony.workers.find((w) => w.isPlayer);
        if (player) {
          const affected = buzzPulse(this.colony, player.pos);
          this.pulseCooldown = TUNING.pulseCooldown;
          sound.play('pulse');
          this.events.emit('pulse', player.pos);
          // "Noticed", not "told what to do" — Buzz Pulse never assigns a task, it only raises
          // attention, and that's worth saying again in the moment it's actually used, not
          // just in the level intro text.
          const msg =
            affected > 0
              ? `Buzz Pulse — ${affected} nearby worker${affected === 1 ? '' : 's'} noticed what's needed nearby.`
              : 'Buzz Pulse — nobody nearby to notice.';
          announce(msg);
          this.toast(msg);
        }
      }
    } else if (!this.ended) {
      this.ended = true;
      sound.stopSong();
      sound.play(this.queenlessMode ? 'lose' : 'win');
      this.time.delayedCall(1200, () =>
        this.scene.start('Results', {
          levelId: this.level?.id,
          queenlessMode: this.queenlessMode,
          colony: this.colony,
        }),
      );
    }
    this.draw(time);
  }

  private draw(time: number): void {
    for (const w of this.colony.workers) {
      const sprite = this.workerSprites.get(w.id);
      if (!sprite) continue;
      sprite.setVisible(!w.removed).setPosition(w.pos.x, w.pos.y);
      if (!w.removed)
        sprite.setTexture(w.state === 'resting' ? 'bee-0' : `bee-${Math.floor(time / 110) % 2}`);
      if (w.reproductiveActivation > 0.5) sprite.setAlpha(0.7 + Math.sin(time / 150) * 0.2);
      else sprite.setAlpha(1);
    }
    for (const site of this.colony.sites) {
      const sprite = this.siteSprites.get(site.id);
      if (!sprite || site.kind === 'storage') continue;
      const scale = site.kind === 'debris' ? 0.6 + site.level * 0.6 : 0.5 + site.level * 0.7;
      sprite.setScale(scale).setAlpha(site.kind === 'flower' ? 0.5 + site.level * 0.5 : 1);
    }
    this.fx.clear();
    const player = this.colony.workers.find((w) => w.isPlayer);
    if (player?.carrying) {
      // A small nectar droplet over the player's own sprite — the only visible confirmation
      // that walking onto a flower actually picked something up, and a reminder to head home.
      const bob = Math.sin(time / 200) * 2;
      this.fx.fillStyle(PALETTE.honey, 0.95).fillCircle(player.pos.x, player.pos.y - 16 + bob, 4);
      this.fx
        .lineStyle(1, PALETTE.earth, 0.6)
        .strokeCircle(player.pos.x, player.pos.y - 16 + bob, 4);
    }
    if (this.pulseCooldown > 0) {
      if (player) {
        const t = 1 - this.pulseCooldown / TUNING.pulseCooldown;
        this.fx
          .lineStyle(2, PALETTE.honey, 0.5)
          .strokeCircle(player.pos.x, player.pos.y, TUNING.pulseRadius * t);
      }
    }
  }

  private handle(events: ColonyEvent[]): void {
    const reduced = progress().reducedEffects;
    for (const e of events) {
      switch (e.type) {
        case 'delivered':
          sound.play('deliver');
          break;
        case 'broodCared':
          sound.play('broodCare');
          break;
        case 'debrisCleared':
          sound.play('click');
          break;
        case 'reorganized': {
          const w = this.colony.workers.find((x) => x.id === e.workerId);
          if (w) {
            sound.play('reorganize');
            announce(
              `${w.name} shifts to ${e.into === 'nestMaintenance' ? 'nest maintenance' : e.into}.`,
            );
          }
          break;
        }
        case 'reproductiveCompetition':
          sound.play('disturbance');
          break;
        case 'disturbance': {
          sound.play('disturbance');
          if (!reduced) this.cameras.main.shake(200, 0.004);
          const msg =
            e.kind === 'removeForagers'
              ? 'Some foragers are gone.'
              : e.kind === 'resourceShortage'
                ? 'The flowers have thinned out.'
                : 'Something has changed.';
          announce(msg);
          this.toast(msg);
          break;
        }
        case 'queenLost':
          sound.play('queenLost');
          if (!reduced) this.cameras.main.flash(400, 40, 20, 10);
          announce('The queen is gone.');
          this.toast('The queen is gone — the colony is on its own now.', 3200);
          break;
        case 'done':
          break;
        default:
          break;
      }
    }
  }
}
