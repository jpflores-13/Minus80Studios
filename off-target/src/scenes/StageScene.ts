import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { BOSSES, HERO_ORDER, HEROES, type HeroId } from '../content/characters';
import { PALETTE, ZOOM } from '../config/gameConfig';
import { progress } from '../config/progress';
import { GAME } from '../config/tuning';
import { Controls } from '../input/Controls';
import { getStage } from '../levels';
import { stageOf, timeLeft } from '../systems/boss';
import { createGame, stepGame, type GameEvent, type GameState } from '../systems/game';
import { TILE, type Tile } from '../systems/tilemap';
import { announce } from '../ui/announce';
import { TEXT_STYLES } from '../ui/text';

export interface StageData {
  stageId: string;
  hero?: HeroId;
  timeTrial?: boolean;
}

const TILE_TEXTURES: Partial<Record<Tile, string>> = {
  solid: 'tile-solid',
  ledge: 'tile-ledge',
  ladder: 'tile-ladder',
  spikes: 'tile-spikes',
  goo: 'tile-goo',
  gate: 'tile-gate',
  door: 'tile-door',
  bouncer: 'tile-bouncer',
};

/** Heroes the player has unlocked, by the highest stage cleared. */
export function unlockedHeroes(): HeroId[] {
  return HERO_ORDER.filter((h) => HEROES[h].unlockedAfter <= progress().cleared);
}

// Plays one stage. All the rules live in systems/game.ts; this scene draws the state and turns
// events into sound, motion and announcements. The HUD runs as its own scene on top.
export class StageScene extends Phaser.Scene {
  game$!: GameState;
  data$!: StageData;
  private controls!: Controls;
  private acc = 0;
  private player!: Phaser.GameObjects.Image;
  private gates: Phaser.GameObjects.Image[] = [];
  private doors: Phaser.GameObjects.Image[] = [];
  private pickups: Phaser.GameObjects.Image[] = [];
  private checkpoints: Phaser.GameObjects.Image[] = [];
  private bossSprites: {
    body: Phaser.GameObjects.Image;
    guide: Phaser.GameObjects.Image;
    gene: Phaser.GameObjects.Image;
    sign: Phaser.GameObjects.Text;
    ring: Phaser.GameObjects.Graphics;
  }[] = [];
  private platformSprites: Phaser.GameObjects.TileSprite[] = [];
  private rollerPool: Phaser.GameObjects.Image[] = [];
  private shockPool: Phaser.GameObjects.Image[] = [];
  private fx!: Phaser.GameObjects.Graphics;
  private ending = false;
  private lastCountdown = new Map<number, number>();
  private banner!: Phaser.GameObjects.Text;
  private bannerSub!: Phaser.GameObjects.Text;

  constructor() {
    super('Stage');
  }

  create(data: StageData): void {
    this.data$ = data;
    const stage = getStage(data.stageId);
    const hero = data.hero ?? stage.defaultHero;
    this.game$ = createGame(
      stage,
      unlockedHeroes().includes(hero) ? hero : 'ace',
      progress().difficulty,
      unlockedHeroes(),
    );
    this.acc = 0;
    this.ending = false;
    this.gates = [];
    this.doors = [];
    this.pickups = [];
    this.checkpoints = [];
    this.bossSprites = [];
    this.platformSprites = [];
    this.rollerPool = [];
    this.shockPool = [];
    this.lastCountdown = new Map();
    this.controls = new Controls(this);

    const map = this.game$.map;
    const worldW = map.width * TILE;
    const worldH = map.height * TILE;
    this.cameras.main
      .setBackgroundColor(PALETTE.night)
      .setZoom(ZOOM)
      .setBounds(0, 0, worldW, worldH)
      .setRoundPixels(true);
    this.drawBackground(worldW, worldH);

    // tiles
    for (let ty = 0; ty < map.height; ty++)
      for (let tx = 0; tx < map.width; tx++) {
        const t = map.tiles[ty * map.width + tx] ?? 'empty';
        const key = TILE_TEXTURES[t];
        if (!key) continue;
        const img = this.add
          .image(tx * TILE, ty * TILE, key)
          .setOrigin(0)
          .setDepth(t === 'goo' ? 8 : 2);
        if (t === 'ledge') img.setOrigin(0, 0);
        if (t === 'gate') this.gates.push(img);
        if (t === 'door') this.doors.push(img);
      }

    for (const p of this.game$.pickups)
      this.pickups.push(this.add.image(p.x, p.y, p.kind).setDepth(4));
    for (const c of this.game$.checkpoints)
      this.checkpoints.push(this.add.image(c.x, c.y + 8 - 11, 'checkpoint-off').setDepth(3));
    for (const p of this.game$.pods) this.add.image(p.x, p.y - 4, 'pod').setDepth(3);
    for (const p of this.game$.platforms)
      this.platformSprites.push(
        this.add.tileSprite(p.x, p.y, p.w, 6, 'tile-ledge').setOrigin(0).setDepth(3),
      );

    for (const b of this.game$.bosses) {
      const kind = b.config.kind;
      const role = b.config.role;
      const gene = this.add.image(b.homeX + 22, b.y - 6, 'gene').setDepth(4);
      const body = this.add.image(b.x, b.y, `${kind}-0`).setOrigin(0.5, 1).setDepth(5);
      const guide = this.add.image(b.x - 26, b.y - 40, 'guide').setDepth(6);
      const signText =
        role === 'off-target'
          ? '✕ WRONG TARGET'
          : role === 'desired'
            ? '✓ WANTED EDIT'
            : '✓ RIGHT TARGET';
      const sign = this.add
        .text(b.homeX + 22, b.y - 58, signText, {
          fontFamily: 'monospace',
          fontSize: '24px',
          fontStyle: 'bold',
          color: role === 'off-target' ? '#ff8095' : '#9ff0d0',
          backgroundColor: '#0d0a1fcc',
          padding: { x: 6, y: 2 },
        })
        .setOrigin(0.5)
        .setScale(1 / ZOOM)
        .setDepth(7);
      const ring = this.add.graphics().setDepth(6);
      this.bossSprites.push({ body, guide, gene, sign, ring });
    }

    this.player = this.add.image(0, 0, `${this.game$.hero.id}-idle`).setOrigin(0, 0).setDepth(10);
    this.fx = this.add.graphics().setDepth(12);
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15, 0, 0);

    const { width: viewW, height: viewH } = this.scale;
    this.banner = this.add
      .text(viewW / 2, viewH * 0.3, '', { ...TEXT_STYLES.title, align: 'center' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(60)
      .setAlpha(0);
    this.bannerSub = this.add
      .text(viewW / 2, viewH * 0.3 + 56, '', {
        ...TEXT_STYLES.body,
        align: 'center',
        wordWrap: { width: viewW * 0.8 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(60)
      .setAlpha(0);

    this.scene.launch('Hud', { stage: this });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scene.stop('Hud');
      sound.setUrgency(1);
    });
    sound.playSong('stage');
    this.flashBanner(`STAGE ${stage.number}\n${stage.name.toUpperCase()}`, stage.intro.join(' '));
    const offTarget = this.game$.bosses.filter((b) => b.config.role === 'off-target');
    announce(
      `Stage ${stage.number}: ${stage.name}. ${stage.intro.join(' ')} Playing as ${this.game$.hero.name}. ${offTarget.length === 1 ? 'One machine is' : `${offTarget.length} machines are`} at the wrong target. Move right, press jump to jump, and use your power when you are next to it.`,
    );
  }

  private flashBanner(text: string, sub = ''): void {
    this.banner.setText(text).setAlpha(1);
    this.bannerSub.setText(sub).setAlpha(sub ? 1 : 0);
    this.tweens.add({
      targets: sub ? [this.banner, this.bannerSub] : [this.banner],
      alpha: 0,
      delay: 4200,
      duration: 700,
    });
  }

  private drawBackground(w: number, h: number): void {
    const reduced = progress().reducedEffects;
    const bg = this.add.graphics().setDepth(-10).setScrollFactor(0.15, 1);
    bg.fillGradientStyle(PALETTE.navy, PALETTE.navy, PALETTE.purple, PALETTE.purple, 1).fillRect(
      -200,
      0,
      w * 0.4 + 800,
      h,
    );
    const rng = new Phaser.Math.RandomDataGenerator([this.game$.stage.id]);
    for (let i = 0; i < w / 60; i++) {
      const key = rng.pick(['blob', 'ribosome']);
      const img = this.add
        .image(rng.between(0, w * 0.5 + 400), rng.between(20, h - 40), key)
        .setScrollFactor(0.4, 1)
        .setDepth(-8)
        .setAlpha(0.7);
      if (!reduced)
        this.tweens.add({
          targets: img,
          y: img.y + rng.between(-6, 6),
          duration: rng.between(2500, 4500),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
    }
    const nucleus = this.game$.stage.nucleusFrom;
    if (nucleus !== undefined) {
      // inside the nucleus: a warmer purple, with chromatin drifting in the back
      const x = nucleus * TILE;
      this.add
        .rectangle(x, 0, w - x, h, 0x3a1b5a, 0.55)
        .setOrigin(0)
        .setDepth(-6);
      for (let cx = x + 20; cx < w; cx += 70)
        this.add
          .image(cx, rng.between(30, h - 60), 'chromatin')
          .setDepth(-5)
          .setAlpha(0.8);
    }
  }

  override update(time: number, delta: number): void {
    const s = this.game$;
    if (this.controls.pausePressed() && s.status === 'playing') return this.pause();
    if (s.status === 'playing') {
      this.acc += Math.min(delta, 100) / 1000;
      let input = this.controls.read();
      while (this.acc >= GAME.step) {
        this.acc -= GAME.step;
        this.handle(stepGame(s, input, GAME.step));
        // a press only counts once
        input = { ...input, jumpPressed: false, action: false };
      }
    } else if (!this.ending) {
      this.finish();
    }
    this.draw(time);
  }

  pause(): void {
    sound.play('click');
    this.scene.pause();
    this.scene.launch('Pause', { stageId: this.data$.stageId, hero: this.game$.hero.id });
  }

  private draw(time: number): void {
    const s = this.game$;
    const b = s.player;
    const reduced = progress().reducedEffects;

    // hero
    let frame = 'idle';
    if (b.onLadder) frame = Math.floor(b.y / 6) % 2 ? 'climb0' : 'climb1';
    else if (!b.onGround) frame = 'jump';
    else if (Math.abs(b.vx) > 10) frame = `run${Math.floor(time / 90) % 4}`;
    else if (Math.floor(time / 2400) % 6 === 0 && time % 2400 < 140) frame = 'blink';
    const hurt = s.invulnerable > 0 && Math.floor(time / 80) % 2 === 0;
    this.player.setTexture(`${s.hero.id}-${frame}${s.hp <= 1 ? '-hurt' : ''}`);
    this.player.setPosition(Math.round(b.x - 2), Math.round(b.y));
    this.player.setFlipX(b.facing < 0).setAlpha(hurt ? 0.4 : 1);

    for (const g of this.gates) g.setTexture(s.gateOpen ? 'tile-gate-open' : 'tile-gate');
    for (const d of this.doors) d.setVisible(!s.hasKey);
    s.pickups.forEach((p, i) => {
      const img = this.pickups[i];
      if (!img) return;
      img.setVisible(!p.taken);
      if (!reduced && !p.taken) img.setY(p.y + Math.sin(time / 300 + i) * 1.5);
    });
    s.checkpoints.forEach((c, i) =>
      this.checkpoints[i]?.setTexture(c.reached ? 'checkpoint' : 'checkpoint-off'),
    );
    s.platforms.forEach((p, i) => this.platformSprites[i]?.setPosition(p.x, p.y));

    s.bosses.forEach((boss, i) => {
      const spr = this.bossSprites[i];
      if (!spr) return;
      const active = boss.state === 'active';
      const stage = stageOf(boss);
      const anim =
        active && boss.frozenFor <= 0
          ? stage === 'engagement'
            ? Math.floor(time / 120) % 3
            : Math.floor(time / 400) % 3
          : 1;
      spr.body.setTexture(`${boss.config.kind}-${anim}`).setPosition(Math.round(boss.x), boss.y);
      spr.body.setTint(
        boss.frozenFor > 0 ? 0x9fe0ff : boss.state === 'stopped' ? 0x8f8fa8 : 0xffffff,
      );
      const bob = reduced ? 0 : Math.sin(time / 250 + i) * 2;
      spr.guide.setPosition(boss.x - 26, boss.y - 46 + bob).setVisible(boss.state !== 'stopped');
      spr.gene.setTexture(boss.state === 'cut' ? 'gene-cut' : 'gene');
      spr.ring.clear();
      if (active && boss.warning > 0)
        spr.ring
          .lineStyle(2, PALETTE.red, 0.9)
          .strokeCircle(boss.x, boss.y - 10, 26 + (reduced ? 0 : (0.9 - boss.warning) * 20));
      if (boss.state === 'stopped') {
        // a little lock over a stopped machine
        spr.ring.fillStyle(PALETTE.mint, 1).fillRect(boss.x - 5, boss.y - 54, 10, 8);
        spr.ring.lineStyle(2, PALETTE.mint, 1).strokeCircle(boss.x, boss.y - 56, 4);
      }
    });

    // rollers and shockwaves from small pools
    const pool = (list: Phaser.GameObjects.Image[], key: string, n: number) => {
      while (list.length < n) list.push(this.add.image(0, 0, key).setDepth(9));
      list.forEach((img, i) => img.setVisible(i < n));
      return list;
    };
    pool(this.rollerPool, 'roller', s.rollers.length).forEach((img, i) => {
      const r = s.rollers[i];
      if (r) img.setPosition(r.x + 6, r.y + 6).setRotation(reduced ? 0 : r.x / 6);
    });
    pool(this.shockPool, 'shock', s.shocks.length).forEach((img, i) => {
      const sh = s.shocks[i];
      if (sh) img.setPosition(sh.x, sh.y - 4).setAlpha(Math.min(1, sh.life));
    });

    this.fx.clear();
    if (s.burst > 0) {
      const t = 1 - s.burst / 0.4;
      this.fx
        .lineStyle(2, PALETTE.turquoise, 1 - t)
        .strokeEllipse(
          b.x + b.w / 2,
          b.y + b.h / 2,
          GAME.burstRangeX * 2 * (0.4 + t * 0.6),
          GAME.burstRangeY * 2 * (0.4 + t * 0.6),
        );
    }
    if (s.shield > 0)
      this.fx.lineStyle(1, 0x7fb0ff, 0.8).strokeCircle(b.x + b.w / 2, b.y + b.h / 2, 11);
    if (s.slowMotion > 0 && !reduced)
      this.fx.fillStyle(0x4fe0c0, 0.06).fillRect(this.cameras.main.worldView.x, 0, 430, 240);
  }

  private handle(events: GameEvent[]): void {
    const reduced = progress().reducedEffects;
    const cam = this.cameras.main;
    for (const e of events) {
      switch (e.type) {
        case 'jump':
          sound.play('jump');
          break;
        case 'land':
          sound.play('land');
          break;
        case 'bounce':
          sound.play('bounce');
          break;
        case 'pickup':
          sound.play(e.kind === 'bit' ? 'pickup' : 'power');
          if (e.kind !== 'bit') announce(POWER_NAMES[e.kind] ?? '');
          break;
        case 'hurt':
          sound.play('hurt');
          if (!reduced) cam.shake(150, 0.006);
          announce(`Ouch. ${this.game$.hp} health left.`);
          break;
        case 'shieldPop':
          sound.play('shield');
          announce('Shield used up.');
          break;
        case 'respawn':
          announce('Back to the last checkpoint.');
          break;
        case 'checkpoint':
          sound.play('checkpoint');
          announce('Checkpoint.');
          break;
        case 'swap':
          sound.play('swap');
          announce(
            `Now playing as ${HEROES[e.hero].name}. ${HEROES[e.hero].ability} ${HEROES[e.hero].limitation}`,
          );
          break;
        case 'burst':
          sound.play('burst');
          break;
        case 'stopped': {
          sound.play('stop');
          if (!reduced) cam.flash(150, 160, 255, 220);
          const name = BOSSES[this.game$.bosses[e.boss]!.config.kind].name;
          announce(
            e.role === 'off-target'
              ? `${name} stopped! The wrong target is safe.`
              : `You stopped a ${name} that was at its right target. That costs points.`,
          );
          break;
        }
        case 'frozen':
          sound.play('freeze');
          announce('Frozen for a few seconds. Someone else must finish the job.');
          break;
        case 'denied':
          sound.play('deny');
          announce(
            e.reason === 'too-late'
              ? 'Too late for this hero: it is already gripping.'
              : 'This hero can’t stop that machine. Find a hero pod.',
          );
          break;
        case 'bossStage': {
          const boss = this.game$.bosses[e.boss]!;
          if (boss.config.role !== 'intended')
            announce(
              `${BOSSES[boss.config.kind].name} is ${STAGE_WORDS[e.stage] ?? e.stage}. ${Math.ceil(timeLeft(boss))} seconds left.`,
            );
          break;
        }
        case 'warn':
          sound.play('warn');
          break;
        case 'cut':
          sound.play('cut');
          if (!reduced) cam.shake(400, 0.012);
          if (e.role === 'desired') announce('The wanted edit is done. Now stop the other one!');
          break;
        case 'won':
        case 'lost':
          break;
      }
    }
    // countdown beeps in the last few seconds of an off-target boss
    for (const boss of this.game$.bosses) {
      if (boss.config.role !== 'off-target' || boss.state !== 'active') continue;
      const left = Math.ceil(timeLeft(boss));
      if (left !== this.lastCountdown.get(boss.id)) {
        this.lastCountdown.set(boss.id, left);
        if (left <= 5 && left > 0) {
          sound.play('tick');
          announce(String(left));
        }
      }
      sound.setUrgency(timeLeft(boss) < 10 ? 1.25 : 1);
    }
  }

  private finish(): void {
    this.ending = true;
    const s = this.game$;
    sound.stopSong();
    sound.setUrgency(1);
    sound.play(s.status === 'won' ? 'win' : 'lose');
    if (s.status === 'lost' && !progress().reducedEffects)
      this.cameras.main.flash(300, 255, 80, 120);
    const msg =
      s.status === 'won'
        ? 'Target protected!'
        : s.lostReason === 'desired-blocked'
          ? 'You stopped the edit we wanted.'
          : 'The wrong target was cut.';
    announce(msg);
    this.time.delayedCall(1600, () =>
      this.scene.start('Results', {
        stageId: this.data$.stageId,
        hero: s.hero.id,
        timeTrial: !!this.data$.timeTrial,
        state: s,
      }),
    );
  }
}

const POWER_NAMES: Record<string, string> = {
  key: 'Passage Key: locked doors will open.',
  sprint: 'Sprint! Faster for a few seconds.',
  shield: 'Shield: blocks one hit.',
  doubleJump: 'Double Jump: jump again in mid-air.',
  slowMotion: 'Slow Motion: the world slows down for a few seconds.',
};

const STAGE_WORDS: Record<string, string> = {
  recognition: 'locking on to the target',
  engagement: 'gripping the DNA',
  cleavage: 'cutting',
};
