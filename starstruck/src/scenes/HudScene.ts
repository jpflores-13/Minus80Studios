import Phaser from 'phaser';
import type { WormageddonUpgrade } from '../content/wormageddon';
import { PALETTE } from '../config/gameConfig';
import { progress } from '../config/progress';
import {
  describeObjective,
  effectiveComboWindow,
  effectiveMaxEnergy,
  hasWater,
  multiplier,
} from '../systems/game';
import { announce } from '../ui/announce';
import { Button } from '../ui/Button';
import { TEXT_STYLES } from '../ui/text';
import { touchInput, type LevelScene } from './LevelScene';

// The heads-up display: energy, oxygen (water levels only), special charge, combo, score,
// objective, time, prompts, touch controls, and (WORMAGEDDON) the upgrade-offer screen. It runs
// at screen resolution on its own unzoomed camera, which is why upgrade UI lives here rather than
// in Level, whose camera is zoomed to follow the mole.
export class HudScene extends Phaser.Scene {
  private level!: LevelScene;
  private g!: Phaser.GameObjects.Graphics;
  private stats!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private stick: { id: number; x: number; y: number } | null = null;
  private showOxygen = false;
  private upgradeUi: (Phaser.GameObjects.GameObject | Button)[] = [];
  private upgradeButtons: Button[] = [];

  constructor() {
    super('Hud');
  }

  create(data: { level: LevelScene }): void {
    this.level = data.level;
    this.showOxygen = hasWater(this.level.state.level);
    const { width, height } = this.scale;
    this.g = this.add.graphics();
    this.stats = this.add
      .text(width - 20, 16, '', { ...TEXT_STYLES.hud, fontSize: '20px', align: 'right' })
      .setOrigin(1, 0);
    this.add.text(20, 50, 'ENERGY', {
      ...TEXT_STYLES.hud,
      fontSize: '14px',
      color: PALETTE.textDim,
    });
    if (this.showOxygen)
      this.add.text(20, 100, 'OXYGEN', {
        ...TEXT_STYLES.hud,
        fontSize: '14px',
        color: PALETTE.textDim,
      });
    this.add.text(
      20,
      this.showOxygen ? 150 : 100,
      `SPECIAL: ${this.level.state.character.special}`,
      {
        ...TEXT_STYLES.hud,
        fontSize: '14px',
        color: PALETTE.textDim,
      },
    );
    this.comboText = this.add
      .text(width / 2, 90, '', { ...TEXT_STYLES.title, fontSize: '40px', color: PALETTE.textAmber })
      .setOrigin(0.5)
      .setAlpha(0);
    this.promptText = this.add
      .text(width / 2, height - 40, '', {
        ...TEXT_STYLES.body,
        fontSize: '20px',
        align: 'center',
        backgroundColor: '#171c22cc',
        padding: { x: 12, y: 6 },
        wordWrap: { width: 900 },
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.level.events.on('eat', (e: { label: string | null; combo: number }) =>
      this.popCombo(e.label ?? (e.combo > 1 ? `×${multiplier(e.combo)}` : 'YUM!')),
    );
    this.level.events.on('wrong', () => this.popCombo('YUCK!', PALETTE.textRose));
    this.level.events.on('special', (name: string) => this.popCombo(name, PALETTE.textMint));
    this.level.events.on('prompt', (t: string) => this.showPrompt(t));
    this.level.events.on('upgradeOffer', (offers: WormageddonUpgrade[]) =>
      this.showWormageddonUpgrades(offers),
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.level.events.off('eat');
      this.level.events.off('wrong');
      this.level.events.off('special');
      this.level.events.off('prompt');
      this.level.events.off('upgradeOffer');
      Object.assign(touchInput, {
        dx: 0,
        dy: 0,
        focus: false,
        bite: false,
        sniff: false,
        special: false,
      });
    });

    if (this.sys.game.device.input.touch) this.buildTouch();
    const pause = new Button(this, width - 50, height - 50, 70, 56, '❚❚', () => this.level.pause());
    pause.bg.setDepth(60);
    pause.label.setDepth(61);
  }

  private buildTouch(): void {
    const { width, height } = this.scale;
    this.input.addPointer(3);
    // left half: a floating stick wherever you put your thumb
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.x < width / 2 && !this.stick) this.stick = { id: p.id, x: p.x, y: p.y };
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.stick || p.id !== this.stick.id) return;
      const dx = p.x - this.stick.x;
      const dy = p.y - this.stick.y;
      const d = Math.hypot(dx, dy);
      touchInput.dx = d > 8 ? dx / Math.max(60, d) : 0;
      touchInput.dy = d > 8 ? dy / Math.max(60, d) : 0;
    });
    const end = (p: Phaser.Input.Pointer) => {
      if (this.stick && p.id === this.stick.id) {
        this.stick = null;
        touchInput.dx = 0;
        touchInput.dy = 0;
      }
    };
    this.input.on('pointerup', end);
    this.input.on('pointerupoutside', end);
    const bite = new Button(
      this,
      width - 130,
      height - 170,
      150,
      110,
      'BITE',
      () => (touchInput.bite = true),
      0x8a3a48,
    );
    const focus = new Button(
      this,
      width - 300,
      height - 130,
      140,
      90,
      'FOCUS',
      () => undefined,
      0x2a4a59,
    );
    focus.bg.on('pointerdown', () => (touchInput.focus = true));
    focus.bg.on('pointerup', () => (touchInput.focus = false));
    focus.bg.on('pointerout', () => (touchInput.focus = false));
    bite.bg.on('pointerdown', () => (touchInput.bite = true));
    if (this.showOxygen)
      new Button(
        this,
        width - 460,
        height - 110,
        130,
        80,
        'SNIFF',
        () => (touchInput.sniff = true),
        0x2a5a7a,
      );
    new Button(
      this,
      width - 130,
      height - 290,
      150,
      80,
      'SPECIAL',
      () => (touchInput.special = true),
      0x5a3a7a,
    );
  }

  private popCombo(text: string, color: string = PALETTE.textAmber): void {
    this.comboText.setText(text).setColor(color).setAlpha(1).setScale(1.3);
    this.tweens.killTweensOf(this.comboText);
    this.tweens.add({ targets: this.comboText, scale: 1, duration: 200 });
    this.tweens.add({ targets: this.comboText, alpha: 0, delay: 900, duration: 400 });
  }

  /** A soft, layered glow: a cheap stand-in for a radial gradient using Graphics alone. */
  private halo(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    r: number,
    color: number,
  ): void {
    for (let i = 5; i > 0; i--) g.fillStyle(color, 0.05 * (6 - i)).fillCircle(x, y, (r * i) / 5);
  }

  private showWormageddonUpgrades(offers: WormageddonUpgrade[]): void {
    const { width, height } = this.scale;
    const reduced = progress().reducedEffects;
    const glowColors = [PALETTE.coral, PALETTE.amber, PALETTE.rose];
    const shade = this.add
      .rectangle(0, 0, width, height, PALETTE.charcoal, 0.88)
      .setOrigin(0)
      .setDepth(70)
      .setInteractive();
    const glow = this.add.graphics().setDepth(70);
    this.halo(glow, width / 2, height * 0.22, 200, PALETTE.amber);
    const title = this.add
      .text(width / 2, height * 0.22, 'CHOOSE AN UPGRADE', TEXT_STYLES.title)
      .setOrigin(0.5)
      .setDepth(71);
    const note = this.add
      .text(width / 2, height * 0.22 + 44, 'Arcade upgrades: a game mechanic, not real biology.', {
        ...TEXT_STYLES.hint,
      })
      .setOrigin(0.5)
      .setDepth(71);
    this.upgradeUi = [shade, glow, title, note];
    this.upgradeButtons = [];
    offers.forEach((u, i) => {
      const y = height * 0.4 + i * 150;
      const color = glowColors[i % glowColors.length] ?? PALETTE.coral;
      this.halo(glow, width / 2, y, 130, color);
      const b = new Button(
        this,
        width / 2,
        y,
        Math.min(620, width - 80),
        120,
        `${i + 1}. ${u.name.toUpperCase()}\n\n${u.text}`,
        () => this.pickWormageddonUpgrade(i),
        PALETTE.coral,
      );
      b.label.setFontSize(18).setWordWrapWidth(560);
      b.bg.setStrokeStyle(3, color);
      this.upgradeButtons.push(b);
      this.upgradeUi.push(b);
      if (!reduced) {
        b.bg.setAlpha(0);
        b.label.setAlpha(0);
        this.tweens.add({
          targets: [b.bg, b.label],
          alpha: 1,
          duration: 300,
          delay: i * 110,
          ease: 'Sine.easeOut',
        });
        this.tweens.add({
          targets: b.bg,
          scaleX: 1.03,
          scaleY: 1.03,
          duration: 1100,
          yoyo: true,
          repeat: -1,
          delay: i * 110 + 350,
          ease: 'Sine.easeInOut',
        });
      }
    });
    announce(
      `Choose an upgrade: ${offers.map((u, i) => `${i + 1}, ${u.name}: ${u.text}`).join('. ')}`,
    );
  }

  private pickWormageddonUpgrade(index: number): void {
    const chosen = this.upgradeButtons[index];
    if (chosen && !progress().reducedEffects) this.flashAt(chosen.bg.x, chosen.bg.y);
    this.level.applyWormageddonUpgrade(index);
    for (const o of this.upgradeUi) o.destroy();
    this.upgradeUi = [];
    this.upgradeButtons = [];
  }

  /** A bright burst at the moment an upgrade is picked. */
  private flashAt(x: number, y: number): void {
    this.cameras.main.flash(180, 240, 220, 150);
    const burst = this.add.circle(x, y, 10, PALETTE.amber, 0.9).setDepth(90);
    this.tweens.add({
      targets: burst,
      radius: 200,
      alpha: 0,
      duration: 450,
      ease: 'Cubic.easeOut',
      onComplete: () => burst.destroy(),
    });
  }

  private showPrompt(text: string): void {
    this.promptText.setText(text).setAlpha(1);
    this.tweens.killTweensOf(this.promptText);
    this.tweens.add({ targets: this.promptText, alpha: 0, delay: 5000, duration: 600 });
  }

  override update(): void {
    const s = this.level.state;
    const g = this.g;
    g.clear();
    // energy: a bar with the value written beside it
    const frac = s.energy / effectiveMaxEnergy(s);
    g.fillStyle(0x2a211c, 1).fillRect(20, 20, 320, 22);
    g.fillStyle(frac > 0.35 ? PALETTE.amber : PALETTE.rose, 1).fillRect(20, 20, 320 * frac, 22);
    g.lineStyle(2, PALETTE.sand, 1).strokeRect(20, 20, 320, 22);

    let y = 48;
    if (this.showOxygen) {
      const ofrac = s.oxygen / 100;
      g.fillStyle(0x12242c, 1).fillRect(20, 70, 320, 18);
      g.fillStyle(ofrac > 0.3 ? PALETTE.teal : PALETTE.rose, 1).fillRect(20, 70, 320 * ofrac, 18);
      g.lineStyle(2, PALETTE.sand, 1).strokeRect(20, 70, 320, 18);
      y = 98;
    }
    const sfrac = s.special.charge / 100;
    g.fillStyle(0x2a1c30, 1).fillRect(20, y + 24, 320, 16);
    g.fillStyle(s.special.timer > 0 ? PALETTE.coral : PALETTE.rose, sfrac >= 1 ? 1 : 0.8).fillRect(
      20,
      y + 24,
      320 * (s.special.timer > 0 ? 1 : sfrac),
      16,
    );
    g.lineStyle(2, PALETTE.sand, 1).strokeRect(20, y + 24, 320, 16);

    const finite = Number.isFinite(s.level.timeLimit);
    const left = finite ? `   ${Math.max(0, Math.ceil(s.level.timeLimit - s.time))}s` : '';
    this.stats.setText(
      `${describeObjective(s)}${left}\nSCORE ${s.score}${s.combo > 1 ? `   COMBO ×${multiplier(s.combo)}` : ''}`,
    );
    // combo timer: a shrinking line under the energy bar
    if (s.combo > 0)
      g.fillStyle(PALETTE.coral, 1).fillRect(
        20,
        44,
        320 * Math.max(0, s.comboTimer / effectiveComboWindow(s)),
        4,
      );
  }
}
