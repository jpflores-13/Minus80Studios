import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE, ZOOM } from '../config/gameConfig';
import { progress } from '../config/progress';
import { getJob } from '../levels';
import { drawBuilding, makeArt, makeThief } from '../render/art';
import { centre, lineOfSight, TILE, type Spot } from '../systems/building';
import { active, links } from '../systems/folder';
import {
  createMission,
  NO_INPUT,
  RULES,
  stepMission,
  type Input,
  type Mission,
  type MissionEvent,
} from '../systems/mission';
import { announce } from '../ui/announce';

/** Touch input from the HUD's on-screen controls. */
export const touch = { dx: 0, dy: 0, sprint: false, fold: false };

const STEP = 1 / 120;

// One job. The rules are in systems/mission.ts; this scene draws the building and the folds.
export class JobScene extends Phaser.Scene {
  m!: Mission;
  jobId = 'job-1';
  briefing = true;
  private acc = 0;
  private fx!: Phaser.GameObjects.Graphics;
  private cones!: Phaser.GameObjects.Graphics;
  private player!: Phaser.GameObjects.Image;
  private guardSprites: Phaser.GameObjects.Image[] = [];
  private cameraSprites: Phaser.GameObjects.Image[] = [];
  private diamond!: Phaser.GameObjects.Image;
  private loot: Phaser.GameObjects.Image[] = [];
  private device: Phaser.GameObjects.Image[] = [];
  private clamps: Phaser.GameObjects.Image[] = [];
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private foldPressed = false;
  private ended = false;

  constructor() {
    super('Job');
  }

  create(data: { jobId?: string }): void {
    this.jobId = data.jobId ?? 'job-1';
    this.m = createMission(getJob(this.jobId), 'ghost', Math.floor(Math.random() * 1e9));
    this.acc = 0;
    this.ended = false;
    this.briefing = true;
    this.guardSprites = [];
    this.cameraSprites = [];
    this.loot = [];
    this.device = [];
    this.clamps = [];
    makeArt(this);
    const m = this.m;
    const cam = this.cameras.main;
    cam
      .setBackgroundColor(PALETTE.navy)
      .setZoom(ZOOM)
      .setBounds(0, 0, m.b.cols * TILE, m.b.rows * TILE);

    const base = this.add.graphics().setDepth(0);
    drawBuilding(base, m.b.tiles, m.b.cols, m.b.rows, TILE);
    // anchors: brass plates set into the corridor floor
    for (const i of m.b.anchors) {
      const c = centre(m.b.path[i] as Spot);
      base.lineStyle(3, PALETTE.gold, 1).strokeRect(c.x - 12, c.y - 12, 24, 24);
      base.fillStyle(PALETTE.gold, 0.3).fillRect(c.x - 12, c.y - 12, 24, 24);
    }
    // one-way security anchors: a chevron pointing the way traffic actually flows through
    for (const a of m.b.oneWayAnchors) {
      const c = centre(m.b.path[a.bin] as Spot);
      const open = -a.facing; // the facing it does NOT hold
      base.lineStyle(3, PALETTE.terracotta, 1).strokeRect(c.x - 12, c.y - 12, 24, 24);
      base.fillStyle(PALETTE.terracotta, 0.25).fillRect(c.x - 12, c.y - 12, 24, 24);
      base
        .fillStyle(PALETTE.terracotta, 1)
        .fillTriangle(c.x - open * 7, c.y - 8, c.x - open * 7, c.y + 8, c.x + open * 7, c.y);
    }
    const van = centre(m.b.van);
    this.add.image(van.x, van.y, 'van').setDepth(2);
    const d = centre(m.b.diamond);
    this.diamond = this.add.image(d.x, d.y, 'diamond').setDepth(3);
    for (const l of m.loot) {
      const c = centre(l.spot);
      this.loot.push(this.add.image(c.x, c.y, 'gold').setDepth(3));
    }
    this.cones = this.add.graphics().setDepth(4);
    this.fx = this.add.graphics().setDepth(5);
    for (const c of m.cameras)
      this.cameraSprites.push(this.add.image(c.x, c.y, 'camera').setDepth(7));
    for (const g of m.guards) this.guardSprites.push(this.add.image(g.x, g.y, 'guard').setDepth(8));
    this.player = this.add.image(m.player.x, m.player.y, makeThief(this, m.crew)).setDepth(9);
    cam.startFollow(this.player, true, 0.1, 0.1);

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
      }))
        this.keys[n] = kb.addKey(c, true);
      kb.on('keydown-SPACE', () => (this.foldPressed = true));
      kb.on('keydown-ESC', () => this.pause());
      kb.on('keydown-R', () => this.scene.restart({ jobId: this.jobId }));
    }
    this.scene.launch('Hud', { job: this });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scene.stop('Hud');
      this.input.keyboard?.removeAllListeners();
    });
    sound.playSong('stage');
  }

  pause(): void {
    if (this.m.status !== 'playing' || this.briefing) return;
    sound.play('click');
    this.scene.pause();
    this.scene.launch('Pause', { jobId: this.jobId });
  }

  private readInput(): Input {
    const k = (n: string) => this.keys[n]?.isDown === true;
    let dx = (k('right') || k('d') ? 1 : 0) - (k('left') || k('a') ? 1 : 0) + touch.dx;
    let dy = (k('down') || k('s') ? 1 : 0) - (k('up') || k('w') ? 1 : 0) + touch.dy;
    let sprint = k('shift') || touch.sprint;
    const pad = this.input.gamepad?.pad1;
    if (pad) {
      if (Math.abs(pad.leftStick.x) > 0.2) dx = pad.leftStick.x;
      if (Math.abs(pad.leftStick.y) > 0.2) dy = pad.leftStick.y;
      sprint ||= pad.R1 > 0.3 || pad.B;
      if (pad.A) this.foldPressed ||= !this.padA;
      this.padA = pad.A;
    }
    const fold = this.foldPressed || touch.fold;
    this.foldPressed = false;
    touch.fold = false;
    return { dx, dy, sprint, fold, interact: false };
  }

  private padA = false;

  override update(time: number, delta: number): void {
    const m = this.m;
    if (this.briefing) return this.draw(time);
    if (m.status === 'playing') {
      this.acc += Math.min(delta, 100) / 1000;
      let input = this.readInput();
      while (this.acc >= STEP && m.status === 'playing') {
        this.acc -= STEP;
        this.handle(stepMission(m, input, STEP));
        input = { ...input, fold: false };
      }
    } else if (!this.ended) {
      this.ended = true;
      sound.stopSong();
      sound.play(m.status === 'won' ? 'win' : m.lostReason === 'caught' ? 'alarm' : 'lose');
      this.time.delayedCall(1500, () =>
        this.scene.start('Results', { jobId: this.jobId, mission: m }),
      );
    }
    this.draw(time);
  }

  private handle(events: MissionEvent[]): void {
    const reduced = progress().reducedEffects;
    for (const e of events) {
      switch (e.type) {
        case 'deployed':
          sound.play('deploy');
          this.events.emit('prompt', 'The Folder is reeling the corridor in from both ends…');
          announce('Folder deployed. Its ends are reeling in the corridor.');
          break;
        case 'deployFailed': {
          sound.play('deny');
          const msg = {
            'not-corridor': 'The Folder only works in the service corridor (the wooden floor).',
            cooldown: 'The Folder is recharging. Give it a moment.',
            empty: 'No charges left.',
            busy: 'Already folded here.',
          }[e.why];
          this.events.emit('prompt', msg);
          announce(msg);
          break;
        }
        case 'linked':
          sound.play('link');
          this.events.emit(
            'prompt',
            'Connected! Step into either glowing doorway to come out of the other.',
          );
          announce('The corridor is folded. Step into a glowing doorway to cross.');
          break;
        case 'crossed':
          sound.play('cross');
          if (e.who === 'guard') {
            this.events.emit('prompt', 'A guard came through the fold!');
            announce('Careful: a guard came through the fold.');
          }
          if (!reduced && e.who === 'player') this.cameras.main.flash(120, 101, 227, 189);
          break;
        case 'released':
          sound.play('release');
          announce('The fold let go. The corridor is back to normal.');
          break;
        case 'spotted':
          sound.play('spotted');
          announce(e.by === 'camera' ? 'The camera can see you.' : 'The guard can see you!');
          break;
        case 'chase':
          announce('The guard is coming after you!');
          break;
        case 'loot':
          sound.play(e.primary ? 'loot' : 'coin');
          if (e.primary) {
            this.events.emit('prompt', 'Got it! Back to the van before time runs out.');
            announce(`Got the diamond. Back to the van: ${Math.round(this.m.escapeLeft)} seconds.`);
          }
          break;
        case 'won':
          announce('Clean getaway!');
          break;
        case 'lost':
          announce(e.reason === 'caught' ? 'Caught!' : 'Too slow: the police arrived.');
          break;
      }
    }
  }

  /** A vision cone, cut off by walls. */
  private cone(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    angle: number,
    range: number,
    half: number,
    color: number,
    alarmed: boolean,
  ): void {
    const pts = [new Phaser.Math.Vector2(x, y)];
    const n = 24;
    for (let i = 0; i <= n; i++) {
      const a = angle - half + (2 * half * i) / n;
      let d = range;
      for (let t = 8; t <= range; t += 8)
        if (!lineOfSight(this.m.b, x, y, x + Math.cos(a) * t, y + Math.sin(a) * t)) {
          d = t - 8;
          break;
        }
      pts.push(new Phaser.Math.Vector2(x + Math.cos(a) * d, y + Math.sin(a) * d));
    }
    g.fillStyle(color, alarmed ? 0.32 : 0.16).fillPoints(pts, true);
    // dashed edge so the cone reads without colour
    g.lineStyle(2, color, 0.7);
    for (let i = 1; i + 1 < pts.length; i += 2) {
      const a = pts[i] as Phaser.Math.Vector2;
      const b = pts[i + 1] as Phaser.Math.Vector2;
      g.lineBetween(a.x, a.y, b.x, b.y);
    }
  }

  private draw(time: number): void {
    const m = this.m;
    const reduced = progress().reducedEffects;
    this.player.setPosition(m.player.x, m.player.y).setRotation(m.player.heading);
    m.guards.forEach((g, i) => this.guardSprites[i]?.setPosition(g.x, g.y).setRotation(g.heading));
    m.cameras.forEach((c, i) => this.cameraSprites[i]?.setPosition(c.x, c.y).setRotation(c.angle));
    this.diamond.setVisible(!m.hasDiamond);
    if (!reduced) this.diamond.setScale(1 + Math.sin(time / 250) * 0.06);
    m.loot.forEach((l, i) => this.loot[i]?.setVisible(!l.taken));

    const cg = this.cones;
    cg.clear();
    for (const c of m.cameras)
      this.cone(
        cg,
        c.x,
        c.y,
        c.angle,
        RULES.cameraRange,
        RULES.cameraHalfAngle,
        PALETTE.gold,
        c.sees,
      );
    for (const g of m.guards)
      this.cone(
        cg,
        g.x,
        g.y,
        g.heading,
        RULES.guardRange,
        RULES.guardHalfAngle,
        PALETTE.terracotta,
        g.state === 'chase',
      );

    // the folds
    const fx = this.fx;
    fx.clear();
    const folds = active(m.folds);
    while (this.device.length < folds.length)
      this.device.push(this.add.image(0, 0, 'device').setDepth(6));
    while (this.clamps.length < folds.length * 2)
      this.clamps.push(this.add.image(0, 0, 'clamp').setDepth(6));
    this.device.forEach((d, i) => d.setVisible(i < folds.length));
    this.clamps.forEach((c, i) => c.setVisible(i < folds.length * 2));
    folds.forEach((f, i) => {
      const L = m.b.path[f.left];
      const R = m.b.path[f.right];
      if (!L || !R) return;
      // the stretch between the ends is folded away: darkened, with crease lines across it
      for (let k = f.left + 1; k < f.right; k++) {
        const c = centre(m.b.path[k] as Spot);
        fx.fillStyle(PALETTE.ink, 0.55).fillRect(c.x - TILE / 2, c.y - TILE / 2, TILE, TILE);
        const wave = reduced ? 0 : Math.sin(time / 150 - k * 0.6) * 4;
        fx.lineStyle(2, PALETTE.gold, 0.45).lineBetween(
          c.x - 10 + wave,
          c.y - 10,
          c.x + 10 + wave,
          c.y + 10,
        );
      }
      const a = centre(L);
      const b = centre(R);
      this.clamps[i * 2]?.setPosition(a.x, a.y);
      this.clamps[i * 2 + 1]?.setPosition(b.x, b.y);
      const dev = centre(m.b.path[m.folds.origins.get(f.id) ?? f.left] as Spot);
      this.device[i]?.setPosition(dev.x, dev.y).setRotation(reduced ? 0 : time / 300);
    });
    for (const [l, r] of links(m.folds)) {
      const a = centre(m.b.path[l] as Spot);
      const b = centre(m.b.path[r] as Spot);
      // a ribbon arching from one doorway to the other: the temporary passage
      const mid = {
        x: (a.x + b.x) / 2,
        y: Math.min(a.y, b.y) - 60 - Math.hypot(b.x - a.x, b.y - a.y) * 0.15,
      };
      const curve = new Phaser.Curves.QuadraticBezier(
        new Phaser.Math.Vector2(a.x, a.y),
        new Phaser.Math.Vector2(mid.x, mid.y),
        new Phaser.Math.Vector2(b.x, b.y),
      );
      const pts = curve.getPoints(40);
      fx.lineStyle(10, PALETTE.mint, 0.18).strokePoints(pts);
      fx.lineStyle(3, PALETTE.mint, 0.9);
      const off = reduced ? 0 : Math.floor(time / 60) % 4;
      for (let k = off; k + 1 < pts.length; k += 4) {
        const p = pts[k] as Phaser.Math.Vector2;
        const q = pts[k + 1] as Phaser.Math.Vector2;
        fx.lineBetween(p.x, p.y, q.x, q.y);
      }
      for (const p of [a, b]) {
        const pulse = reduced ? 1 : 1 + Math.sin(time / 180) * 0.1;
        fx.lineStyle(4, PALETTE.mint, 1).strokeRect(
          p.x - 14 * pulse,
          p.y - 14 * pulse,
          28 * pulse,
          28 * pulse,
        );
        fx.fillStyle(PALETTE.mint, 0.25).fillRect(p.x - 14, p.y - 14, 28, 28);
        // ⇄ so the doorway reads without colour
        fx.lineStyle(2, PALETTE.cream, 1)
          .lineBetween(p.x - 7, p.y - 3, p.x + 7, p.y - 3)
          .lineBetween(p.x - 7, p.y + 3, p.x + 7, p.y + 3);
        fx.lineBetween(p.x + 7, p.y - 3, p.x + 4, p.y - 6).lineBetween(
          p.x - 7,
          p.y + 3,
          p.x - 4,
          p.y + 6,
        );
      }
    }
    // suspicion marks over guards
    for (const g of m.guards)
      if (m.suspicion > 0.05) {
        const sx = g.x;
        const sy = g.y - 26;
        fx.fillStyle(g.state === 'chase' ? PALETTE.terracotta : PALETTE.gold, 1).fillRect(
          sx - 2,
          sy - 10,
          4,
          10,
        );
        if (g.state === 'chase') fx.fillCircle(sx, sy + 4, 2.5);
      }
  }
}

export { NO_INPUT };
