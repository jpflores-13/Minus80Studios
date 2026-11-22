import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { colonyHealth, type Site, type Worker } from '../systems/colony';
import { Button } from '../ui/Button';
import { TEXT_STYLES } from '../ui/text';
import { touchInput, type LevelScene } from './LevelScene';

// The minimap covers the same world bounds LevelScene's camera is bounded to
// (`cam.setBounds(-200, -200, 1400, 1100)`) — the full playable area, most of which is off
// the zoomed-in screen at any one time.
const WORLD_X0 = -200;
const WORLD_Y0 = -200;
const WORLD_W = 1400;
const WORLD_H = 1100;
const MINIMAP_W = 150;
const MINIMAP_H = 118;

/** Flower: brighter honey the more nectar it's holding. Brood cell/debris: brighter rose/amber
 *  the more they need attention — "need", for those two, means a high level, not a low one. */
function siteDotColor(site: Site): { color: number; alpha: number } {
  if (site.kind === 'flower') return { color: PALETTE.honey, alpha: 0.35 + site.level * 0.65 };
  if (site.kind === 'broodCell') return { color: PALETTE.rose, alpha: 0.3 + site.level * 0.7 };
  if (site.kind === 'debris') return { color: PALETTE.amber, alpha: 0.3 + site.level * 0.7 };
  return { color: PALETTE.cream, alpha: 0.9 }; // storage
}

// Food, brood health, nest cleanliness, time, the Buzz Pulse button, a toast line for the
// game's bigger moments, and a corner minimap. Drawn at screen resolution on top of the
// zoomed level.
export class HudScene extends Phaser.Scene {
  private level!: LevelScene;
  private g!: Phaser.GameObjects.Graphics;
  private statusText!: Phaser.GameObjects.Text;
  private toastText!: Phaser.GameObjects.Text;
  private minimap!: Phaser.GameObjects.Graphics;
  private pulseBtn: Button | null = null;
  private stick: { id: number; x: number; y: number } | null = null;

  constructor() {
    super('Hud');
  }

  create(data: { level: LevelScene }): void {
    this.level = data.level;
    const { width, height } = this.scale;
    this.g = this.add.graphics().setDepth(40);
    this.statusText = this.add
      .text(width / 2, 16, '', { ...TEXT_STYLES.hud, fontSize: '18px', align: 'center' })
      .setOrigin(0.5, 0)
      .setDepth(41);
    this.add.text(20, 50, 'FOOD', { ...TEXT_STYLES.hud, fontSize: '13px', color: PALETTE.textDim });
    this.add.text(20, 82, 'BROOD', {
      ...TEXT_STYLES.hud,
      fontSize: '13px',
      color: PALETTE.textDim,
    });
    this.add.text(20, 114, 'NEST', {
      ...TEXT_STYLES.hud,
      fontSize: '13px',
      color: PALETTE.textDim,
    });
    // A visible echo of what announce() already tells screen readers for the game's bigger
    // moments (Buzz Pulse's result, a disturbance, the queen leaving) — those used to be
    // screen-reader-only, so a sighted player had no on-screen confirmation any of it happened.
    this.toastText = this.add
      .text(width / 2, height - 150, '', {
        ...TEXT_STYLES.body,
        align: 'center',
        wordWrap: { width: Math.min(620, width - 340) },
      })
      .setOrigin(0.5)
      .setDepth(45)
      .setBackgroundColor('#1a120acc')
      .setPadding(10, 6, 10, 6);

    this.minimap = this.add.graphics().setDepth(40);
    this.add
      .text(width - MINIMAP_W - 20, 36, 'MAP', {
        ...TEXT_STYLES.hud,
        fontSize: '12px',
        color: PALETTE.textDim,
      })
      .setDepth(41);

    if (this.sys.game.device.input.touch) this.buildTouch();
    const pause = new Button(this, width - 50, height - 50, 70, 56, '❚❚', () => this.level.pause());
    pause.bg.setDepth(60);
    pause.label.setDepth(61);
  }

  private buildTouch(): void {
    const { width, height } = this.scale;
    this.input.addPointer(3);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.x < width * 0.5 && !this.stick) this.stick = { id: p.id, x: p.x, y: p.y };
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.stick || p.id !== this.stick.id) return;
      const dx = p.x - this.stick.x;
      const dy = p.y - this.stick.y;
      const d = Math.hypot(dx, dy);
      touchInput.dx = d > 8 ? dx / Math.max(50, d) : 0;
      touchInput.dy = d > 8 ? dy / Math.max(50, d) : 0;
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
    this.pulseBtn = new Button(
      this,
      width - 150,
      height - 150,
      180,
      110,
      'PULSE',
      () => (touchInput.pulse = true),
      PALETTE.earthLight,
    );
  }

  override update(): void {
    const c = this.level.colony;
    const g = this.g;
    g.clear();
    const bars: [number, number, number][] = [
      [50, Math.min(100, c.foodReserves) / 100, PALETTE.honey],
      [82, c.broodHealth / 100, PALETTE.rose],
      [114, c.nestCleanliness / 100, PALETTE.moss],
    ];
    for (const [y, frac, color] of bars) {
      g.fillStyle(0x1a120a, 1).fillRect(90, y, 220, 18);
      g.fillStyle(color, 1).fillRect(90, y, 220 * Phaser.Math.Clamp(frac, 0, 1), 18);
      g.lineStyle(2, PALETTE.honey, 0.6).strokeRect(90, y, 220, 18);
    }
    const level = this.level.level;
    const timeLeft = level ? Math.max(0, level.colony.durationSeconds - c.time) : null;
    this.statusText.setText(
      level
        ? `${level.name.toUpperCase()}   ·   ${Math.ceil(timeLeft ?? 0)}s   ·   health ${Math.round(colonyHealth(c))}`
        : `QUEENLESS MODE   ·   survived ${Math.floor(c.time)}s   ·   health ${Math.round(colonyHealth(c))}`,
    );
    if (this.pulseBtn) {
      this.pulseBtn.setVisible(this.level.pulseEnabled);
      const ready = this.level.pulseCooldown <= 0;
      this.pulseBtn.setText(ready ? 'PULSE' : `${Math.ceil(this.level.pulseCooldown)}s`);
      this.pulseBtn.setEnabled(ready);
    }

    const showToast = this.level.toastUntil > this.time.now;
    this.toastText.setText(showToast ? this.level.toastText : '').setVisible(showToast);

    this.drawMinimap(c.sites, c.workers);
  }

  // A small always-on-screen view of the whole nest, not just the slice the zoomed camera can
  // show at once — the player, every site, and every nestmate, scaled down into one corner.
  // "A systems toy you watch as much as you play" is a lot harder to read when half of what's
  // going on is off-screen.
  private drawMinimap(sites: Site[], workers: Worker[]): void {
    const { width } = this.scale;
    const x0 = width - MINIMAP_W - 20;
    const y0 = 50;
    const toMap = (p: { x: number; y: number }) => ({
      x: x0 + ((p.x - WORLD_X0) / WORLD_W) * MINIMAP_W,
      y: y0 + ((p.y - WORLD_Y0) / WORLD_H) * MINIMAP_H,
    });

    const m = this.minimap;
    m.clear();
    m.fillStyle(0x1a120a, 0.75).fillRect(x0, y0, MINIMAP_W, MINIMAP_H);

    for (const site of sites) {
      if (site.kind === 'rest') continue;
      const { color, alpha } = siteDotColor(site);
      const p = toMap(site.pos);
      m.fillStyle(color, alpha).fillCircle(p.x, p.y, site.kind === 'storage' ? 3 : 2.2);
    }

    for (const w of workers) {
      if (w.removed || w.isPlayer) continue;
      const p = toMap(w.pos);
      m.fillStyle(PALETTE.cream, 0.55).fillCircle(p.x, p.y, 1.6);
    }

    const player = workers.find((w) => w.isPlayer);
    if (player) {
      const p = toMap(player.pos);
      m.fillStyle(PALETTE.honeyLight, 1).fillCircle(p.x, p.y, 3.2);
      m.lineStyle(1, PALETTE.night, 0.8).strokeCircle(p.x, p.y, 3.2);
    }

    // The slice of the nest currently visible through the zoomed camera, so the minimap also
    // answers "where am I looking" alongside "where is everything."
    const view = this.level.cameras.main.worldView;
    const tl = toMap({ x: view.x, y: view.y });
    const br = toMap({ x: view.right, y: view.bottom });
    m.lineStyle(1, PALETTE.cream, 0.35).strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);

    m.lineStyle(2, PALETTE.honey, 0.6).strokeRect(x0, y0, MINIMAP_W, MINIMAP_H);
  }
}
