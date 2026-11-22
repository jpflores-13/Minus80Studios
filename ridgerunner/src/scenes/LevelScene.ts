import Phaser from 'phaser';
import { PALETTE, ZOOM } from '../config/gameConfig';
import { progress } from '../config/progress';
import { getLevel } from '../levels';
import { biomeTileKey, MOSS_ORIGIN_X, tileVariant } from '../render/art';
import { halo } from '../render/backdrop';
import { generateLevel } from '../systems/procedural';
import { createGame, stepGame, type GameEvent, type GameState, type Input } from '../systems/game';
import { TILE } from '../systems/network';
import { announce } from '../ui/announce';

const TILE_TEXTURES: Record<string, string> = {
  log: 'tile-log',
  barrier: 'tile-barrier',
};
/** These kinds have two stable-by-position variants, picked by tileVariant(). */
const VARIED_KINDS = new Set(['floor', 'moss', 'clearing']);

/** Touch input shared with the HUD's on-screen stick. */
export const touchInput = { dx: 0, dy: 0 };

const STEP = 1 / 60;

// One level (or one Beyond the Divide run). Rules live in systems/game.ts; this draws the
// landscape and Moss, and turns step events into sound, motion and announcements.
export class LevelScene extends Phaser.Scene {
  state!: GameState;
  levelId = 'level-1';
  beyond = false;
  private acc = 0;
  private tiles: Phaser.GameObjects.Image[] = [];
  private moss!: Phaser.GameObjects.Image;
  private vignette!: Phaser.GameObjects.Image;
  private rainFx!: Phaser.GameObjects.Graphics;
  private moteFx!: Phaser.GameObjects.Graphics;
  private haloFx!: Phaser.GameObjects.Graphics;
  private destMarker!: Phaser.GameObjects.Graphics;
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private ended = false;

  constructor() {
    super('Level');
  }

  create(data: { levelId?: string; beyond?: boolean }): void {
    this.beyond = data.beyond ?? false;
    this.levelId = this.beyond ? 'beyond' : (data.levelId ?? 'level-1');
    const level = this.beyond
      ? generateLevel(Math.floor(Math.random() * 1e6), progress().best['beyond']?.stars ?? 1)
      : getLevel(this.levelId);
    this.state = createGame(level, progress().easyMode);
    this.acc = 0;
    this.ended = false;
    this.tiles = [];
    const s = this.state;
    const cam = this.cameras.main;
    cam
      .setBackgroundColor(PALETTE.ink)
      .setZoom(ZOOM)
      .setBounds(0, 0, s.land.cols * TILE, s.land.rows * TILE)
      .setRoundPixels(true);

    for (let ty = 0; ty < s.land.rows; ty++)
      for (let tx = 0; tx < s.land.cols; tx++) {
        const kind = s.land.tiles[ty * s.land.cols + tx] ?? 'floor';
        this.tiles.push(
          this.add
            .image(tx * TILE, ty * TILE, this.tileKey(kind, tx, ty))
            .setOrigin(0)
            .setDepth(0),
        );
      }
    this.destMarker = this.add.graphics().setDepth(1);
    this.haloFx = this.add.graphics().setDepth(3);
    this.moss = this.add
      .image(s.moss.x, s.moss.y, 'moss-0')
      .setDepth(4)
      .setOrigin(MOSS_ORIGIN_X, 0.5);
    this.moteFx = this.add.graphics().setDepth(5);
    this.vignette = this.add.image(0, 0, 'vignette').setDepth(6).setScale(2.2);
    this.rainFx = this.add.graphics().setDepth(7).setScrollFactor(0);
    cam.startFollow(this.moss, true, 0.12, 0.12);

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
      kb.on('keydown-ESC', () => this.pause());
      kb.on('keydown-P', () => this.pause());
      kb.on('keydown-R', () => this.scene.restart({ levelId: this.levelId, beyond: this.beyond }));
    }
    this.scene.launch('Hud', { level: this });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scene.stop('Hud');
      this.input.keyboard?.removeAllListeners();
    });
    announce(
      `${level.name}. ${level.intro.join(' ')} Move with the arrow keys, WASD, or drag. Reach the destination without running dry.`,
    );
  }

  pause(): void {
    if (this.state.status !== 'playing') return;
    this.scene.pause();
    this.scene.launch('Pause', { levelId: this.levelId, beyond: this.beyond });
  }

  /** Which texture a tile should show: an animated frame for water, a stable variant for
   * floor/moss/clearing (so the ground doesn't look like one tile stamped over and over), or
   * the plain texture for everything else. */
  private tileKey(kind: string, tx: number, ty: number, time = 0): string {
    if (kind === 'stream')
      return Math.floor(time / 500) % 2 === 0 ? 'tile-stream' : 'tile-stream-1';
    if (VARIED_KINDS.has(kind)) {
      const base = biomeTileKey(kind as 'floor' | 'moss' | 'clearing', this.state.level.biome);
      return tileVariant(base, tx, ty, 2);
    }
    return TILE_TEXTURES[kind] ?? 'tile-floor';
  }

  private readInput(): Input {
    const k = (n: string) => this.keys[n]?.isDown === true;
    let dx = (k('right') || k('d') ? 1 : 0) - (k('left') || k('a') ? 1 : 0) + touchInput.dx;
    let dy = (k('down') || k('s') ? 1 : 0) - (k('up') || k('w') ? 1 : 0) + touchInput.dy;
    const pad = this.input.gamepad?.pad1;
    if (pad) {
      if (Math.abs(pad.leftStick.x) > 0.2) dx = pad.leftStick.x;
      if (Math.abs(pad.leftStick.y) > 0.2) dy = pad.leftStick.y;
      if (pad.left) dx = -1;
      if (pad.right) dx = 1;
      if (pad.up) dy = -1;
      if (pad.down) dy = 1;
    }
    return { dx, dy };
  }

  override update(time: number): void {
    const s = this.state;
    const reduced = progress().reducedEffects;
    if (s.status === 'playing') {
      this.acc += 1 / 60;
      const input = this.readInput();
      while (this.acc >= STEP && s.status === 'playing') {
        this.acc -= STEP;
        this.handle(stepGame(s, input, STEP));
      }
    } else if (!this.ended) {
      this.ended = true;
      this.time.delayedCall(1200, () =>
        this.scene.start('Results', { levelId: this.levelId, beyond: this.beyond, state: s }),
      );
    }

    for (let i = 0; i < s.land.tiles.length; i++) {
      const img = this.tiles[i];
      const kind = s.land.tiles[i];
      if (img && kind) {
        const key = this.tileKey(kind, i % s.land.cols, Math.floor(i / s.land.cols), time);
        if (img.texture.key !== key) img.setTexture(key);
      }
    }
    this.moss
      .setPosition(s.moss.x, s.moss.y)
      .setRotation(s.moss.heading)
      .setTexture(`moss-${s.moss.moving && !reduced ? Math.floor(time / 160) % 2 : 0}`);
    this.vignette.setPosition(s.moss.x, s.moss.y);

    this.haloFx.clear();
    if (!reduced)
      halo(this.haloFx, s.moss.x, s.moss.y, 34 + Math.sin(time / 260) * 4, PALETTE.gold);

    this.moteFx.clear();
    if (!s.raining && !reduced) {
      const cam = this.cameras.main;
      const cx = cam.midPoint.x;
      const cy = cam.midPoint.y;
      const spread = 460;
      for (let i = 0; i < 12; i++) {
        const x = cx + (((i * 137.2 + time / 40) % spread) - spread / 2);
        const y =
          cy +
          Math.sin(time / 900 + i) * 70 +
          (((i * 71.9 - time / 28) % spread) - spread / 2) * 0.6;
        const a = 0.25 + 0.3 * Math.sin(time / 520 + i * 2);
        this.moteFx.fillStyle(PALETTE.gold, Math.max(0, a)).fillCircle(x, y, 1.6);
      }
    }

    this.destMarker.clear();
    const pulse = reduced ? 6 : 6 + Math.sin(time / 180) * 2;
    const dest = s.land.destination;
    this.destMarker
      .lineStyle(2, PALETTE.gold, 0.9)
      .strokeCircle(dest.tx * TILE + TILE / 2, dest.ty * TILE + TILE / 2, pulse);

    this.rainFx.clear();
    if (s.raining && !reduced) {
      const { width, height } = this.scale;
      for (let i = 0; i < 40; i++) {
        const x = (i * 97 + time / 3) % width;
        const y = (i * 53 + time / 1.5) % height;
        this.rainFx.fillStyle(0x9fc8d8, 0.3).fillRect(x, y, 2, 8);
      }
    }
  }

  private handle(events: GameEvent[]): void {
    for (const e of events) {
      switch (e.type) {
        case 'rainStart':
          announce('Rain begins. The ground gives up its moisture more slowly now.');
          break;
        case 'rainEnd':
          announce('The rain has stopped.');
          break;
        case 'crossing':
          announce('A new stream, one Moss has never swum before.');
          this.events.emit('crossing');
          break;
        case 'dry':
          announce('Too dry to go on.');
          break;
        case 'won':
          announce('Moss has found a way across.');
          break;
        case 'lost':
          announce(e.reason === 'dry' ? 'Out of moisture.' : 'Out of time.');
          break;
      }
    }
  }
}
