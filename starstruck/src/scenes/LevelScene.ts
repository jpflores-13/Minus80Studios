import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE, ZOOM } from '../config/gameConfig';
import { progress } from '../config/progress';
import { OBJECTS } from '../content/objects';
import { getLevel } from '../levels';
import { wormageddon } from '../levels/wormageddon';
import { drawSenses } from '../render/senseView';
import {
  createGame,
  isIdentified,
  NO_INPUT,
  stepGame,
  TILE,
  underNose,
  type GameEvent,
  type GameState,
  type Input,
} from '../systems/game';
import {
  applyWormMagnet,
  chooseWormageddonUpgrade,
  createWormageddonState,
  stepWormageddon,
} from '../systems/wormageddon';
import { announce } from '../ui/announce';

/** Touch input shared with the HUD's on-screen controls. */
export const touchInput = { dx: 0, dy: 0, focus: false, bite: false, sniff: false, special: false };

const STEP = 1 / 120;

// One level. The rules are in systems/game.ts; this draws the dark, the star and its touches.
export class LevelScene extends Phaser.Scene {
  state!: GameState;
  levelId = 'level-1';
  private acc = 0;
  private tiles: Phaser.GameObjects.Image[] = [];
  private mole!: Phaser.GameObjects.Image;
  private glimpse!: Phaser.GameObjects.Graphics;
  private senses!: Phaser.GameObjects.Graphics;
  private vignette!: Phaser.GameObjects.Image;
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private bitePressed = false;
  private sniffPressed = false;
  private specialPressed = false;
  private padPrev = { a: false, start: false, b: false, y: false };
  private ended = false;
  private wormageddonMode = false;
  focusing = false;

  constructor() {
    super('Level');
  }

  create(data: { levelId?: string; wormageddon?: boolean }): void {
    this.wormageddonMode = data.wormageddon ?? false;
    this.levelId = this.wormageddonMode ? 'wormageddon' : (data.levelId ?? 'level-1');
    this.state = createGame(
      this.wormageddonMode ? wormageddon : getLevel(this.levelId),
      progress().character,
      Math.floor(Math.random() * 1e9),
    );
    if (this.wormageddonMode) this.state.wormageddon = createWormageddonState(this.state);
    this.state.memory.memory *= progress().memoryScale;
    this.acc = 0;
    this.ended = false;
    this.tiles = [];
    this.bitePressed = false;
    const s = this.state;
    const cam = this.cameras.main;
    cam
      .setBackgroundColor(PALETTE.charcoal)
      .setZoom(ZOOM)
      .setBounds(0, 0, s.cols * TILE, s.rows * TILE)
      .setRoundPixels(true);

    for (let ty = 0; ty < s.rows; ty++)
      for (let tx = 0; tx < s.cols; tx++) {
        const soil = s.soil[ty * s.cols + tx];
        this.tiles.push(
          this.add
            .image(
              tx * TILE,
              ty * TILE,
              soil === 'water'
                ? 'tile-water'
                : soil === 'tunnel'
                  ? 'tile-tunnel'
                  : soil === 'rock'
                    ? 'tile-rock'
                    : 'tile-soil',
            )
            .setOrigin(0)
            .setDepth(0),
        );
      }
    this.glimpse = this.add.graphics().setDepth(2);
    this.mole = this.add.image(s.mole.x, s.mole.y, 'mole-0').setDepth(4).setOrigin(0.62, 0.5);
    this.vignette = this.add.image(0, 0, 'vignette').setDepth(6);
    this.senses = this.add.graphics().setDepth(8);
    cam.startFollow(this.mole, true, 0.12, 0.12);

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
        shift: K.SHIFT,
        f: K.F,
      }))
        this.keys[n] = kb.addKey(c, true);
      kb.on('keydown-SPACE', () => (this.bitePressed = true));
      kb.on('keydown-E', () => (this.bitePressed = true));
      kb.on('keydown-Q', () => (this.sniffPressed = true));
      kb.on('keydown-C', () => (this.sniffPressed = true));
      kb.on('keydown-X', () => (this.specialPressed = true));
      kb.on('keydown-V', () => (this.specialPressed = true));
      kb.on('keydown-ESC', () => this.pause());
      kb.on('keydown-P', () => this.pause());
      kb.on('keydown-R', () =>
        this.scene.restart({ levelId: this.levelId, wormageddon: this.wormageddonMode }),
      );
    }
    this.scene.launch('Hud', { level: this });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scene.stop('Hud');
      this.input.keyboard?.removeAllListeners();
    });
    sound.playSong('stage');
  }

  pause(): void {
    if (this.state.status !== 'playing') return;
    sound.play('click');
    this.scene.pause();
    this.scene.launch('Pause', { levelId: this.levelId });
  }

  private readInput(): Input {
    const k = (n: string) => this.keys[n]?.isDown === true;
    let dx = (k('right') || k('d') ? 1 : 0) - (k('left') || k('a') ? 1 : 0) + touchInput.dx;
    let dy = (k('down') || k('s') ? 1 : 0) - (k('up') || k('w') ? 1 : 0) + touchInput.dy;
    let focus = k('shift') || k('f') || touchInput.focus;
    const pad = this.input.gamepad?.pad1;
    if (pad) {
      if (Math.abs(pad.leftStick.x) > 0.2) dx = pad.leftStick.x;
      if (Math.abs(pad.leftStick.y) > 0.2) dy = pad.leftStick.y;
      if (pad.left) dx = -1;
      if (pad.right) dx = 1;
      if (pad.up) dy = -1;
      if (pad.down) dy = 1;
      focus ||= pad.L1 > 0.3 || pad.R1 > 0.3 || pad.X;
      if (pad.A && !this.padPrev.a) this.bitePressed = true;
      if (pad.B && !this.padPrev.b) this.sniffPressed = true;
      if (pad.Y && !this.padPrev.y) this.specialPressed = true;
      const start = !!pad.buttons[9]?.pressed;
      if (start && !this.padPrev.start) this.pause();
      this.padPrev = { a: pad.A, start, b: pad.B, y: pad.Y };
    }
    let bite = this.bitePressed || touchInput.bite;
    touchInput.bite = false;
    this.bitePressed = false;
    const sniff = this.sniffPressed || touchInput.sniff;
    touchInput.sniff = false;
    this.sniffPressed = false;
    const special = this.specialPressed || touchInput.special;
    touchInput.special = false;
    this.specialPressed = false;
    // accessibility: bite recognised prey automatically
    if (progress().autoBite) {
      const t = underNose(this.state);
      if (t && OBJECTS[t.material].edible && isIdentified(this.state, t)) bite = true;
    }
    this.focusing = focus;
    return { dx, dy, focus, bite, sniff, special };
  }

  override update(time: number, delta: number): void {
    const s = this.state;
    const reduced = progress().reducedEffects;
    const paused = s.wormageddon?.phase === 'upgrade';
    if (s.status === 'playing' && !paused) {
      this.acc += Math.min(delta, 100) / 1000;
      let input = this.readInput();
      while (this.acc >= STEP && s.status === 'playing') {
        this.acc -= STEP;
        const events = stepGame(s, input, STEP);
        if (s.wormageddon) {
          applyWormMagnet(s, STEP);
          events.push(...stepWormageddon(s));
        }
        this.handle(events);
        input = { ...input, bite: false, sniff: false, special: false };
        if (s.wormageddon?.phase === 'upgrade') break;
      }
    } else if (s.status !== 'playing' && !this.ended) {
      this.ended = true;
      sound.stopSong();
      sound.play(s.status === 'won' ? 'win' : 'lose');
      this.time.delayedCall(1400, () =>
        this.scene.start(this.wormageddonMode ? 'WormageddonResults' : 'Results', {
          levelId: this.levelId,
          state: s,
        }),
      );
    }

    // dug tunnels
    for (let i = 0; i < s.soil.length; i++) {
      const img = this.tiles[i];
      if (img && s.soil[i] === 'tunnel' && img.texture.key === 'tile-soil')
        img.setTexture('tile-dug');
      if (img && s.soil[i] === 'water' && img.texture.key !== 'tile-water')
        img.setTexture('tile-water');
      if (img && s.dig.has(i)) img.setAlpha(1 - (s.dig.get(i) ?? 0) * 0.5);
      else if (img && img.alpha !== 1) img.setAlpha(1);
    }

    this.mole
      .setPosition(s.mole.x, s.mole.y)
      .setRotation(s.mole.heading)
      .setTexture(`mole-${s.mole.moving && !reduced ? Math.floor(time / 140) % 2 : 0}`);

    // a faint glimpse of what's very close; the dark hides the rest
    const g = this.glimpse;
    g.clear();
    for (const t of s.things) {
      if (!t.alive) continue;
      const at = t.shape.kind === 'circle' ? t.shape.c : t.shape.points[0];
      if (!at || Math.hypot(at.x - s.mole.x, at.y - s.mole.y) > 70 * progress().ambient) continue;
      g.lineStyle(2, 0xffffff, 0.12);
      if (t.shape.kind === 'circle') g.strokeCircle(t.shape.c.x, t.shape.c.y, t.shape.r);
      else g.strokePoints(t.shape.points.map((p) => new Phaser.Math.Vector2(p.x, p.y)));
    }
    const ambient = progress().ambient;
    this.vignette.setPosition(s.mole.x, s.mole.y).setScale(2 * ambient);
    drawSenses(this.senses, s, this.focusing, time, reduced, 1);
  }

  private handle(events: GameEvent[]): void {
    const reduced = progress().reducedEffects;
    for (const e of events) {
      switch (e.type) {
        case 'touch': {
          const m = OBJECTS[e.material as keyof typeof OBJECTS]?.mark;
          sound.play(
            m === 'soft' || m === 'segmented'
              ? 'touchSoft'
              : m === 'fibrous'
                ? 'touchFibre'
                : m
                  ? 'touchHard'
                  : 'touchSoil',
          );
          break;
        }
        case 'identified':
          sound.play('identify');
          announce(
            OBJECTS[e.material].edible
              ? `${OBJECTS[e.material].name}. Food! Bite it.`
              : `${OBJECTS[e.material].name}. Not food.`,
          );
          break;
        case 'eat':
          sound.play(e.label ? 'combo' : 'bite');
          if (progress().haptics) navigator.vibrate?.(18);
          this.events.emit('eat', e);
          if (e.label) announce(e.label);
          if (!reduced) this.burst(e.x, e.y);
          break;
        case 'wrongBite':
          sound.play('wrong');
          if (progress().haptics) navigator.vibrate?.([30, 40, 30]);
          if (!reduced) this.cameras.main.shake(120, 0.004);
          announce('Yuck, not food. Combo lost.');
          this.events.emit('wrong');
          break;
        case 'whiff':
          sound.play('whiff');
          break;
        case 'dig':
          sound.play('dig');
          if (!reduced)
            this.burst(
              this.state.mole.x + Math.cos(this.state.mole.heading) * 18,
              this.state.mole.y + Math.sin(this.state.mole.heading) * 18,
              PALETTE.sand,
            );
          break;
        case 'splash':
          sound.play(e.in ? 'splash' : 'splashOut');
          break;
        case 'bubbleOut':
          sound.play('bubbleOut');
          announce('Bubble sent out.');
          break;
        case 'bubbleBack':
          sound.play(e.found ? 'identify' : 'whiff');
          announce(e.found ? 'The bubble found something!' : 'The bubble found nothing.');
          break;
        case 'gasp':
          sound.play('gasp');
          if (progress().haptics) navigator.vibrate?.([20, 30, 20]);
          announce('Out of air! Surface to breathe.');
          if (!reduced) this.cameras.main.shake(100, 0.003);
          break;
        case 'predatorHit':
          sound.play('hit');
          if (progress().haptics) navigator.vibrate?.([40, 50, 40]);
          if (!reduced) this.cameras.main.shake(180, 0.006);
          announce('A predator got you!');
          break;
        case 'special':
          sound.play('special');
          this.events.emit('special', this.state.character.special);
          announce(`${this.state.character.special}!`);
          break;
        case 'upgradeOffer':
          sound.play('identify');
          // Hud renders the offer screen (it runs unzoomed; this scene's camera is zoomed)
          this.events.emit('upgradeOffer', this.state.wormageddon?.offers ?? []);
          break;
        case 'prompt':
          this.events.emit('prompt', e.text);
          announce(e.text);
          break;
        case 'won':
          announce('Level complete!');
          break;
        case 'lost':
          announce(
            e.reason === 'energy'
              ? 'Out of energy.'
              : e.reason === 'predator'
                ? 'Caught by a predator.'
                : 'Out of time.',
          );
          break;
      }
    }
  }

  /** Called by Hud once the player picks one of the offered upgrades. */
  applyWormageddonUpgrade(index: number): void {
    if (this.state.wormageddon?.phase !== 'upgrade') return;
    sound.play('special');
    chooseWormageddonUpgrade(this.state, index);
  }

  private burst(x: number, y: number, color: number = PALETTE.coral): void {
    for (let i = 0; i < 8; i++) {
      const p = this.add.image(x, y, 'particle').setDepth(9).setTint(color);
      const a = (i / 8) * Math.PI * 2;
      this.tweens.add({
        targets: p,
        x: x + Math.cos(a) * 16,
        y: y + Math.sin(a) * 16,
        alpha: 0,
        duration: 350,
        onComplete: () => p.destroy(),
      });
    }
  }
}

export { NO_INPUT };
