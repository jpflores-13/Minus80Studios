import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { CLOUD, ENEMIES, REINFORCEMENTS, WEAPONS, type EnemyKind } from '../content/arsenal';
import { PALETTE } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import { dailySeed } from '../content/waves';
import {
  chooseUpgrade,
  cloudReady,
  createWorld,
  FIELD,
  HOST_PORTS,
  reinforcementsUnlocked,
  seedFromTime,
  stepWorld,
  type Input,
  type Mode,
  type Enemy,
  type World,
  type WorldEvent,
} from '../systems/world';
import { announce } from '../ui/announce';
import { Button } from '../ui/Button';
import { TEXT_STYLES } from '../ui/text';

const SCALE = 3;
const STEP = 1 / 120;

const SIZES: Record<EnemyKind, number> = {
  cutter: 1,
  stalker: 1,
  twinblade: 1,
  shredder: 1,
  swarm: 1,
  commander: 1,
  megacutter: 1,
  prime: 1,
};

// The battle: draws the world, reads input, and shows the HUD and upgrade choices.
export class BattleScene extends Phaser.Scene {
  world!: World;
  private mode: Mode = 'campaign';
  private acc = 0;
  private hero!: Phaser.GameObjects.Image;
  private enemySprites: Phaser.GameObjects.Image[] = [];
  private fxSprites: Phaser.GameObjects.Image[] = [];
  private shotSprites: Phaser.GameObjects.Image[] = [];
  private obstacleSprites: Phaser.GameObjects.Image[] = [];
  private allySprites: Phaser.GameObjects.Image[] = [];
  private gfx!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Graphics;
  private hudText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private weaponText!: Phaser.GameObjects.Text;
  private banner!: Phaser.GameObjects.Text;
  private cloudBtn!: Button;
  private reinforceBtn!: Button;
  private upgradeUi: (Button | Phaser.GameObjects.GameObject)[] = [];
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private drag: { x: number; y: number } | null = null;
  private wantCloud = false;
  private wantReinforce = false;
  private padPrev = { a: false, b: false, start: false };
  private ended = false;
  private lastHp = 100;

  constructor() {
    super('Battle');
  }

  create(data: { mode?: Mode }): void {
    this.mode = data.mode ?? 'campaign';
    const seed = this.mode === 'daily' ? dailySeed() : seedFromTime();
    this.world = createWorld(this.mode, progress().difficulty, seed, progress().autoAim);
    this.acc = 0;
    this.ended = false;
    this.enemySprites = [];
    this.fxSprites = [];
    this.shotSprites = [];
    this.obstacleSprites = [];
    this.allySprites = [];
    this.upgradeUi = [];
    this.drag = null;
    this.lastHp = 100;

    this.drawBackground();
    this.gfx = this.add.graphics().setDepth(6);
    this.hero = this.add.image(0, 0, 'doc-4-0').setScale(SCALE).setDepth(10);
    this.buildHud();
    this.buildInput();
    sound.playSong('stage');
    announce(
      `${this.mode === 'daily' ? 'Daily challenge' : this.mode === 'endless' ? 'Endless survival' : 'Campaign'}. Move to dodge. You fire on your own. Keep your genome intact.`,
    );
  }

  // ---------- setup ----------

  private drawBackground(): void {
    const { width, height } = this.scale;
    const reduced = progress().reducedEffects;
    const bg = this.add.graphics().setDepth(-10);
    bg.fillGradientStyle(PALETTE.navy, PALETTE.navy, PALETTE.purple, PALETTE.purple, 1).fillRect(
      0,
      0,
      width,
      height,
    );
    // the cell membrane on both sides: a bead-and-tail lipid edge
    for (const side of [0, 1]) {
      const x = side ? width - FIELD.wall : 0;
      bg.fillStyle(0x3d2a6e, 1).fillRect(x, 0, FIELD.wall, height);
      for (let y = 0; y < height; y += 12) {
        const bx = side ? x + 4 : x + FIELD.wall - 4;
        bg.fillStyle(0x8a6cc4, 1).fillCircle(bx, y, 4);
      }
    }
    for (let i = 0; i < 40; i++) {
      const s = this.add
        .image(
          Phaser.Math.Between(40, width - 40),
          Phaser.Math.Between(FIELD.top, height),
          Phaser.Math.RND.pick(['speck', 'plasmid']),
        )
        .setScale(Phaser.Math.Between(2, 4))
        .setDepth(-9)
        .setAlpha(0.6);
      if (!reduced)
        this.tweens.add({
          targets: s,
          y: s.y + 60,
          duration: Phaser.Math.Between(4000, 9000),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
    }
  }

  private buildHud(): void {
    const { width, height } = this.scale;
    this.hud = this.add.graphics().setDepth(40);
    this.hudText = this.add.text(20, 20, '', { ...TEXT_STYLES.hud, fontSize: '22px' }).setDepth(41);
    this.waveText = this.add
      .text(width - 20, 20, '', { ...TEXT_STYLES.hud, fontSize: '22px', align: 'right' })
      .setOrigin(1, 0)
      .setDepth(41);
    this.weaponText = this.add
      .text(20, 108, '', { ...TEXT_STYLES.hud, fontSize: '15px', color: PALETTE.textMint })
      .setDepth(41);
    this.banner = this.add
      .text(width / 2, height * 0.38, '', {
        ...TEXT_STYLES.title,
        fontSize: '40px',
        align: 'center',
        wordWrap: { width: 640 },
      })
      .setOrigin(0.5)
      .setDepth(60)
      .setAlpha(0);
    this.cloudBtn = new Button(
      this,
      130,
      height - 70,
      220,
      84,
      'ACR CLOUD',
      () => (this.wantCloud = true),
      0x2a5c6e,
    );
    this.reinforceBtn = new Button(
      this,
      width - 130,
      height - 70,
      220,
      84,
      'REINFORCE',
      () => (this.wantReinforce = true),
      0x6e4a2a,
    );
    const pause = new Button(this, width / 2, height - 60, 110, 64, '❚❚', () => this.pause());
    pause.bg.setDepth(52);
    pause.label.setDepth(53);
  }

  private buildInput(): void {
    const kb = this.input.keyboard;
    if (kb) {
      const K = Phaser.Input.Keyboard.KeyCodes;
      for (const [name, code] of Object.entries({
        left: K.LEFT,
        right: K.RIGHT,
        up: K.UP,
        down: K.DOWN,
        a: K.A,
        d: K.D,
        w: K.W,
        s: K.S,
      }))
        this.keys[name] = kb.addKey(code, true);
      kb.on('keydown-SPACE', () => (this.wantReinforce = true));
      kb.on('keydown-E', () => (this.wantCloud = true));
      kb.on('keydown-SHIFT', () => (this.wantCloud = true));
      kb.on('keydown-ESC', () => this.pause());
      kb.on('keydown-P', () => this.pause());
      kb.on('keydown', (e: KeyboardEvent) => {
        if (this.world.phase === 'upgrade' && /^[1-3]$/.test(e.key)) this.pick(Number(e.key) - 1);
      });
    }
    this.input.addPointer(2);
    // drag anywhere to move: the hero follows your finger, a little above it so you can see it
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.y > this.scale.height - 120 || !progress().dragToMove) return;
      this.drag = { x: p.x, y: p.y };
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.drag && p.isDown) this.drag = { x: p.x, y: p.y };
    });
    this.input.on('pointerup', () => (this.drag = null));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.input.keyboard?.removeAllListeners(),
    );
  }

  private readInput(): Input {
    const k = (n: string) => this.keys[n]?.isDown === true;
    const pad = this.input.gamepad?.pad1;
    let dx = (k('right') || k('d') ? 1 : 0) - (k('left') || k('a') ? 1 : 0);
    let dy = (k('down') || k('s') ? 1 : 0) - (k('up') || k('w') ? 1 : 0);
    if (pad) {
      if (Math.abs(pad.leftStick.x) > 0.2) dx = pad.leftStick.x;
      if (Math.abs(pad.leftStick.y) > 0.2) dy = pad.leftStick.y;
      if (pad.left) dx = -1;
      if (pad.right) dx = 1;
      if (pad.up) dy = -1;
      if (pad.down) dy = 1;
      const now = { a: pad.A, b: pad.B || pad.X, start: !!pad.buttons[9]?.pressed };
      if (now.a && !this.padPrev.a) this.wantReinforce = true;
      if (now.b && !this.padPrev.b) this.wantCloud = true;
      if (now.start && !this.padPrev.start) this.pause();
      this.padPrev = now;
    }
    const input: Input = {
      dx,
      dy,
      target: this.drag ? { x: this.drag.x, y: this.drag.y - 90 } : null,
      reinforce: this.wantReinforce,
      cloud: this.wantCloud,
    };
    this.wantCloud = false;
    this.wantReinforce = false;
    return input;
  }

  pause(): void {
    if (this.world.phase !== 'playing') return;
    sound.play('click');
    this.scene.pause();
    this.scene.launch('Pause', { mode: this.mode });
  }

  // ---------- loop ----------

  override update(time: number, delta: number): void {
    const w = this.world;
    if (w.phase === 'playing') {
      this.acc += Math.min(delta, 100) / 1000;
      let input = this.readInput();
      while (this.acc >= STEP && w.phase === 'playing') {
        this.acc -= STEP;
        this.handle(stepWorld(w, input, STEP));
        input = { ...input, reinforce: false, cloud: false };
      }
    } else if ((w.phase === 'won' || w.phase === 'lost') && !this.ended) {
      this.ended = true;
      sound.stopSong();
      sound.play(w.phase === 'won' ? 'win' : 'lose');
      this.flashBanner(w.phase === 'won' ? 'HOST TAKEN OVER!' : 'GENOME DESTROYED');
      this.time.delayedCall(1800, () => this.scene.start('Results', { mode: this.mode, world: w }));
    }
    this.draw(time);
  }

  private handle(events: WorldEvent[]): void {
    const reduced = progress().reducedEffects;
    for (const e of events) {
      switch (e.type) {
        case 'inhibited':
          sound.play(e.boss ? 'stop' : 'pickup');
          if (e.boss) {
            if (!reduced) this.cameras.main.flash(200, 160, 255, 220);
            announce(`${ENEMIES[e.kind].name} shut down!`);
          }
          this.puff(e.x, e.y, e.effect);
          break;
        case 'resisted':
          this.miss(e.x, e.y);
          break;
        case 'hurt':
          if (!reduced && Math.floor(this.world.time * 6) % 3 === 0)
            this.cameras.main.shake(60, 0.004);
          break;
        case 'shielded':
          break;
        case 'telegraph':
          sound.play('warn');
          break;
        case 'reinforce':
          sound.play('power');
          announce('Reinforcements!');
          break;
        case 'cloud':
          sound.play('freeze');
          break;
        case 'waveStart':
          sound.play('checkpoint');
          this.flashBanner(`WAVE ${e.wave.number}\n${e.wave.name.toUpperCase()}`, e.wave.intro);
          announce(`Wave ${e.wave.number}: ${e.wave.name}. ${e.wave.intro}`);
          break;
        case 'waveClear':
          sound.play('win');
          break;
        case 'upgrade':
          this.showUpgrades();
          break;
        case 'dodge':
          sound.play('tick');
          break;
        default:
          break;
      }
    }
    // spoken warnings as integrity drops
    const hp = this.world.hero.integrity;
    for (const mark of [75, 50, 25, 10])
      if (this.lastHp > mark && hp <= mark) {
        sound.play('hurt');
        announce(`Genome integrity ${mark} percent.`);
      }
    this.lastHp = hp;
  }

  private flashBanner(text: string, sub = ''): void {
    this.banner.setText(sub ? `${text}\n\n` : text).setAlpha(1);
    const subText = sub
      ? this.add
          .text(this.scale.width / 2, this.scale.height * 0.38 + 70, sub, {
            ...TEXT_STYLES.body,
            align: 'center',
            wordWrap: { width: 600 },
          })
          .setOrigin(0.5)
          .setDepth(60)
      : null;
    this.tweens.add({
      targets: [this.banner, ...(subText ? [subText] : [])],
      alpha: 0,
      delay: 1800,
      duration: 600,
      onComplete: () => subText?.destroy(),
    });
  }

  private puff(x: number, y: number, effect: string): void {
    if (progress().reducedEffects) return;
    const ring = this.add
      .circle(x, y, 10, 0, 0)
      .setStrokeStyle(4, effect === 'frozen' ? 0xd0f4ff : PALETTE.turquoise)
      .setDepth(9);
    this.tweens.add({
      targets: ring,
      radius: 50,
      alpha: 0,
      duration: 400,
      onComplete: () => ring.destroy(),
    });
  }

  private miss(x: number, y: number): void {
    const t = this.add
      .text(x, y, '✕', { ...TEXT_STYLES.hud, fontSize: '22px', color: PALETTE.textRed })
      .setOrigin(0.5)
      .setDepth(9);
    this.tweens.add({
      targets: t,
      y: y - 30,
      alpha: 0,
      duration: 500,
      onComplete: () => t.destroy(),
    });
  }

  // ---------- drawing ----------

  private pool(
    list: Phaser.GameObjects.Image[],
    n: number,
    depth: number,
  ): Phaser.GameObjects.Image[] {
    while (list.length < n)
      list.push(this.add.image(0, 0, 'speck').setScale(SCALE).setDepth(depth));
    list.forEach((img, i) => img.setVisible(i < n));
    return list;
  }

  private draw(time: number): void {
    const w = this.world;
    const h = w.hero;
    const g = this.gfx;
    const reduced = progress().reducedEffects;
    g.clear();

    if (w.crowd) {
      // a crowded tangle of the cell's own DNA: you slow down in here
      g.fillStyle(0x4a2f7a, 0.35).fillCircle(w.crowd.x, w.crowd.y, w.crowd.r);
      g.lineStyle(2, 0x8a6cc4, 0.5);
      for (let i = 0; i < 6; i++) {
        const a = i + (reduced ? 0 : time / 4000);
        g.strokeEllipse(
          w.crowd.x + Math.cos(a) * 30,
          w.crowd.y + Math.sin(a) * 30,
          w.crowd.r * 1.3,
          w.crowd.r * 0.6,
        );
      }
    }

    const tier = Math.max(0, Math.min(4, Math.ceil((h.integrity / h.max) * 4)));
    this.hero.setTexture(`doc-${tier}-${Math.floor(time / 180) % 2}`).setPosition(h.x, h.y);
    this.hero.setTint(h.hurtFlash > 0 ? 0xff8095 : 0xffffff);
    if (h.shield > 0) g.lineStyle(3, 0x7fb0ff, 0.9).strokeCircle(h.x, h.y, 50);

    const obs = w.obstacles.live();
    this.pool(this.obstacleSprites, obs.length, 2).forEach((img, i) => {
      const o = obs[i];
      if (o)
        img
          .setTexture('ribosome')
          .setPosition(o.x, o.y)
          .setScale((o.r * 2) / 40);
    });

    const enemies = w.enemies.live();
    this.pool(this.enemySprites, enemies.length, 5);
    this.pool(this.fxSprites, enemies.length, 7);
    enemies.forEach((e, i) => {
      const img = this.enemySprites[i];
      const fx = this.fxSprites[i];
      if (!img || !fx) return;
      const frame = e.state === 'active' && e.frozenFor <= 0 ? Math.floor(time / 200 + i) % 2 : 0;
      img
        .setTexture(`${e.kind}-${frame}`)
        .setPosition(e.x, e.y)
        .setScale(SCALE * SIZES[e.kind])
        // a spin while it's being flung out of the host
        .setRotation(e.launch > 0 && !reduced ? e.launch * 12 : 0);
      img
        .setAlpha(e.state === 'leaving' ? 0.4 : 1)
        .setTint(e.state === 'inhibited' ? 0x9090b0 : e.frozenFor > 0 ? 0xb0e8ff : 0xffffff);
      if (e.state === 'inhibited' && e.inhibit) {
        fx.setVisible(true)
          .setTexture(`fx-${e.inhibit}`)
          .setPosition(e.x, e.y - ENEMIES[e.kind].radius - 14);
        if (e.inhibit === 'linked' && e.partner)
          g.lineStyle(3, 0x7fd0ff, 0.8).lineBetween(e.x, e.y, e.partner.x, e.partner.y);
      } else if (e.frozenFor > 0)
        fx.setVisible(true)
          .setTexture('fx-frozen')
          .setPosition(e.x, e.y - ENEMIES[e.kind].radius - 14);
      else fx.setVisible(false);
      // telegraphed attacks: a dashed warning line, then the real thing
      if (e.attack) {
        const len = 900;
        if (e.attack.kind === 'aim') {
          g.lineStyle(3, PALETTE.red, 0.8);
          for (let s = 0; s < len; s += 40)
            g.lineBetween(
              e.x + e.attack.dx * s,
              e.y + e.attack.dy * s,
              e.x + e.attack.dx * (s + 20),
              e.y + e.attack.dy * (s + 20),
            );
        } else if (e.attack.kind === 'beam') {
          g.lineStyle(40, PALETTE.red, 0.35).lineBetween(
            e.x,
            e.y,
            e.x + e.attack.dx * len,
            e.y + e.attack.dy * len,
          );
          g.lineStyle(10, 0xffc0c8, 0.9).lineBetween(
            e.x,
            e.y,
            e.x + e.attack.dx * len,
            e.y + e.attack.dy * len,
          );
        }
      }
      if (e.isBoss && e.state === 'active') {
        const frac = e.hits / ENEMIES[e.kind].resistance;
        g.fillStyle(0x2a1b4d, 1).fillRect(e.x - 90, e.y - ENEMIES[e.kind].radius - 50, 180, 12);
        g.fillStyle(PALETTE.turquoise, 1).fillRect(
          e.x - 90,
          e.y - ENEMIES[e.kind].radius - 50,
          180 * frac,
          12,
        );
      }
    });

    const shots = w.shots.live();
    this.pool(this.shotSprites, shots.length, 8).forEach((img, i) => {
      const s = shots[i];
      if (s)
        img
          .setTexture(`shot-${s.weapon}`)
          .setPosition(s.x, s.y)
          .setRotation(Math.atan2(s.vy, s.vx) + Math.PI / 2);
    });
    this.drawHost(g, enemies, time);
    this.pool(this.allySprites, w.allies.length, 9).forEach((img, i) => {
      const a = w.allies[i];
      if (a) img.setTexture('ally').setPosition(a.x, a.y).setScale(2).setAlpha(0.85);
    });
    if (w.cloud)
      g.fillStyle(PALETTE.mint, 0.25 * (w.cloud.t / 0.6)).fillCircle(
        w.cloud.x,
        w.cloud.y,
        CLOUD.radius,
      );

    this.drawHud();
  }

  /**
   * The host bacterium's wall along the top of the battlefield, with the ports it launches its
   * defences from. A port bulges open while something is being thrown out of it.
   */
  private drawHost(g: Phaser.GameObjects.Graphics, enemies: readonly Enemy[], time: number): void {
    const { width } = this.scale;
    const y = FIELD.top - 10;
    g.fillStyle(0x5a1f3a, 1).fillRect(0, y - 26, width, 26);
    g.fillStyle(0x8f2f55, 1);
    for (let x = 0; x < width; x += 14) g.fillCircle(x + 7, y, 6);
    for (const px of HOST_PORTS) {
      const busy = enemies.some((e) => e.launch > 0 && Math.abs(e.x - px) < 80 && e.y < y + 120);
      const open = busy ? 22 : 12 + Math.sin(time / 400 + px) * 2;
      g.fillStyle(0x2a0d1c, 1).fillEllipse(px, y + 2, open * 2.4, open);
      g.lineStyle(3, busy ? 0xffc0c8 : 0xd06080, 1).strokeEllipse(px, y + 2, open * 2.4, open);
    }
  }

  private drawHud(): void {
    const w = this.world;
    const g = this.hud;
    const { width } = this.scale;
    g.clear();
    g.fillStyle(PALETTE.ink, 0.75).fillRect(0, 0, width, FIELD.top - 36);
    // genome integrity: a strand that shortens, with the number beside it
    const frac = w.hero.integrity / w.hero.max;
    g.fillStyle(0x2a1b4d, 1).fillRect(20, 58, 360, 22);
    g.fillStyle(frac > 0.5 ? PALETTE.mint : frac > 0.25 ? PALETTE.gold : PALETTE.red, 1).fillRect(
      20,
      58,
      360 * frac,
      22,
    );
    for (let x = 28; x < 20 + 360 * frac; x += 16)
      g.fillStyle(PALETTE.ink, 0.35).fillRect(x, 60, 3, 18);
    g.lineStyle(2, PALETTE.gold, 1).strokeRect(20, 58, 360, 22);
    this.hudText.setText(`GENOME ${Math.ceil(w.hero.integrity)}%`);
    const waves = w.mode === 'campaign' ? `WAVE ${w.wave.number}/8` : `WAVE ${w.wave.number}`;
    const left = Math.max(0, Math.ceil(w.wave.duration - w.waveTime));
    this.waveText.setText(`${waves}  ${left}s\nSCORE ${w.score}`);
    this.weaponText.setText(`ARMED: ${w.equipped.map((id) => WEAPONS[id].name).join(' · ')}`);

    // special buttons with charge / cooldown shown as a fill and as text
    const ready = cloudReady(w);
    const cloudLocked = w.stats.wavesCleared < CLOUD.unlockAfter;
    this.cloudBtn
      .setText(
        cloudLocked
          ? 'ACR CLOUD\n(locked)'
          : ready
            ? 'ACR CLOUD\nREADY (E)'
            : `ACR CLOUD\n${Math.ceil(w.cloudCooldown)}s`,
      )
      .setEnabled(ready);
    const rUnlocked = reinforcementsUnlocked(w);
    const full = w.charge >= REINFORCEMENTS.charge;
    this.reinforceBtn
      .setText(
        !rUnlocked
          ? 'REINFORCE\n(locked)'
          : full
            ? 'REINFORCE\nREADY (SPACE)'
            : `REINFORCE\n${Math.floor(w.charge)}%`,
      )
      .setEnabled(rUnlocked && full && w.allyTime <= 0);
  }

  // ---------- upgrades ----------

  private showUpgrades(): void {
    const { width, height } = this.scale;
    const shade = this.add
      .rectangle(0, 0, width, height, PALETTE.ink, 0.85)
      .setOrigin(0)
      .setDepth(70)
      .setInteractive();
    const title = this.add
      .text(width / 2, 220, 'CHOOSE AN UPGRADE', TEXT_STYLES.title)
      .setOrigin(0.5)
      .setDepth(71);
    const note = this.add
      .text(width / 2, 270, 'Arcade upgrades: game mechanics, not real biology.', {
        ...TEXT_STYLES.hint,
      })
      .setOrigin(0.5)
      .setDepth(71);
    this.upgradeUi = [shade, title, note];
    this.world.offers.forEach((u, i) => {
      const b = new Button(
        this,
        width / 2,
        380 + i * 170,
        600,
        140,
        `${i + 1}. ${u.name.toUpperCase()}\n\n${u.text}`,
        () => this.pick(i),
        0x3d2a6e,
      );
      b.bg.setDepth(72);
      b.label.setDepth(73).setFontSize(20).setWordWrapWidth(560);
      this.upgradeUi.push(b);
    });
    announce(
      `Choose an upgrade: ${this.world.offers.map((u, i) => `${i + 1}, ${u.name}: ${u.text}`).join('. ')}`,
    );
  }

  private pick(i: number): void {
    if (this.world.phase !== 'upgrade') return;
    sound.play('power');
    chooseUpgrade(this.world, i);
    for (const o of this.upgradeUi) o.destroy();
    this.upgradeUi = [];
    saveProgress({});
  }
}
