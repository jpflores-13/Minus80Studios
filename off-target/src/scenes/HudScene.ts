import Phaser from 'phaser';
import { BOSSES, BOSS_STAGES, interaction, STAGE_LABELS } from '../content/characters';
import { PALETTE, ZOOM } from '../config/gameConfig';
import { DIFFICULTIES } from '../config/tuning';
import { TouchControls } from '../input/TouchControls';
import { progressOf, stageOf, timeLeft } from '../systems/boss';
import type { StageScene } from './StageScene';
import { TEXT_STYLES } from '../ui/text';

// The heads-up display, drawn crisp at screen resolution on top of the zoomed-in stage.
export class HudScene extends Phaser.Scene {
  private stage!: StageScene;
  private g!: Phaser.GameObjects.Graphics;
  private heroText!: Phaser.GameObjects.Text;
  private infoText!: Phaser.GameObjects.Text;
  private bossTexts: Phaser.GameObjects.Text[] = [];
  private badges: Phaser.GameObjects.Text[] = [];
  private touch: TouchControls | null = null;
  private banner!: Phaser.GameObjects.Text;
  private bannerSub!: Phaser.GameObjects.Text;

  constructor() {
    super('Hud');
  }

  create(data: { stage: StageScene }): void {
    this.stage = data.stage;
    this.g = this.add.graphics();
    this.heroText = this.add.text(20, 52, '', { ...TEXT_STYLES.hud, fontSize: '18px' });
    this.infoText = this.add.text(20, 80, '', {
      ...TEXT_STYLES.hud,
      fontSize: '16px',
      color: PALETTE.textDim,
    });
    const s = this.stage.game$;
    this.bossTexts = s.bosses.map(() =>
      this.add
        .text(0, 0, '', { ...TEXT_STYLES.hud, fontSize: '16px', align: 'right' })
        .setOrigin(1, 0),
    );
    this.badges = s.bosses.map(() =>
      this.add
        .text(0, 0, '', {
          ...TEXT_STYLES.hud,
          fontSize: '16px',
          backgroundColor: '#0d0a1fdd',
          padding: { x: 6, y: 3 },
        })
        .setOrigin(0.5, 1),
    );
    this.add
      .text(
        this.scale.width / 2,
        12,
        `STAGE ${s.stage.number} · ${s.stage.name.toUpperCase()} · ${DIFFICULTIES[s.difficulty].name.toUpperCase()}`,
        {
          ...TEXT_STYLES.hud,
          fontSize: '16px',
          color: PALETTE.textDim,
        },
      )
      .setOrigin(0.5, 0);
    const { width, height } = this.scale;
    this.banner = this.add
      .text(width / 2, height * 0.3, '', { ...TEXT_STYLES.title, align: 'center' })
      .setOrigin(0.5)
      .setDepth(60)
      .setAlpha(0);
    this.bannerSub = this.add
      .text(width / 2, height * 0.3 + 56, '', {
        ...TEXT_STYLES.body,
        align: 'center',
        wordWrap: { width: width * 0.8 },
      })
      .setOrigin(0.5)
      .setDepth(60)
      .setAlpha(0);
    this.touch = new TouchControls(this, () => this.stage.pause());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.touch?.destroy());
  }

  /** A stage-start banner, shown here (not in Stage) so it renders at screen size, not zoomed. */
  flashBanner(text: string, sub = ''): void {
    this.banner.setText(text).setAlpha(1);
    this.bannerSub.setText(sub).setAlpha(sub ? 1 : 0);
    this.tweens.add({
      targets: sub ? [this.banner, this.bannerSub] : [this.banner],
      alpha: 0,
      delay: 4200,
      duration: 700,
    });
  }

  override update(): void {
    const s = this.stage.game$;
    const g = this.g;
    g.clear();

    // health as little capsids
    for (let i = 0; i < s.maxHp; i++) {
      const x = 24 + i * 30;
      g.fillStyle(i < s.hp ? PALETTE.gold : 0x3a3050, 1).fillRect(x, 16, 22, 22);
      g.lineStyle(2, PALETTE.ink, 1).strokeRect(x, 16, 22, 22);
      if (i < s.hp) g.fillStyle(PALETTE.mint, 1).fillRect(x + 8, 22, 6, 10);
    }
    this.heroText.setText(`${s.hero.name} · ${s.hero.ability}`);
    const powers = [
      s.sprint > 0 ? `SPRINT ${Math.ceil(s.sprint)}` : '',
      s.shield > 0 ? 'SHIELD' : '',
      s.doubleJump ? 'DOUBLE JUMP' : '',
      s.slowMotion > 0 ? `SLOW-MO ${Math.ceil(s.slowMotion)}` : '',
      s.hasKey ? 'KEY' : '',
    ].filter(Boolean);
    const clock = this.stage.data$.timeTrial ? `⏱ ${s.time.toFixed(2)}s · ` : '';
    this.infoText.setText(`${clock}◆ ${s.bits}${powers.length ? `   ${powers.join(' · ')}` : ''}`);

    // boss countdown panels, top right
    const cam = this.stage.cameras.main;
    s.bosses.forEach((boss, i) => {
      const x = this.scale.width - 20;
      const y = 14 + i * 74;
      const w = 360;
      const role = boss.config.role;
      const stage = stageOf(boss);
      const left = Math.ceil(timeLeft(boss));
      const name = BOSSES[boss.config.kind].name;
      const roleTag =
        role === 'off-target' ? 'STOP IT' : role === 'desired' ? 'LET IT FINISH' : 'LEAVE IT';
      const status =
        boss.state === 'stopped'
          ? 'STOPPED ✓'
          : boss.state === 'cut'
            ? role === 'off-target'
              ? 'CUT ✕'
              : 'DONE ✓'
            : boss.frozenFor > 0
              ? `FROZEN ${Math.ceil(boss.frozenFor)}`
              : `${STAGE_LABELS[stage]} · ${left}s`;
      const t = this.bossTexts[i];
      t?.setPosition(x, y)
        .setText(`${name} · ${roleTag}   ${status}`)
        .setColor(role === 'off-target' ? PALETTE.textRed : PALETTE.textMint);
      // four-part progress bar: searching, recognition, engagement, cleavage
      const by = y + 26;
      const total = boss.config.durations.reduce((a, b) => a + b, 0);
      let bx = x - w;
      boss.config.durations.forEach((d, k) => {
        const segW = (d / total) * (w - 30);
        g.fillStyle(k === 2 ? 0x5a2040 : 0x2a1b4d, 1).fillRect(bx, by, segW - 2, 14);
        bx += segW;
      });
      g.fillStyle(0x5a1020, 1).fillRect(bx, by, 28, 14); // the cut
      const p = boss.state === 'stopped' ? progressOf(boss) : progressOf(boss);
      g.fillStyle(
        role === 'off-target' ? PALETTE.red : PALETTE.turquoise,
        boss.state === 'stopped' ? 0.4 : 1,
      ).fillRect(x - w, by + 4, (w - 30) * p, 6);
      g.lineStyle(2, PALETTE.gold, 0.7).strokeRect(x - w, by, w, 14);
      // stage ticks with initials, readable without colour
      BOSS_STAGES.forEach((st, k) => {
        const off = boss.config.durations.slice(0, k).reduce((a, b) => a + b, 0) / total;
        g.fillStyle(PALETTE.white, 0.8).fillRect(x - w + (w - 30) * off, by - 4, 2, 22);
        void st;
      });

      // compatibility badge above a nearby boss
      const badge = this.badges[i];
      if (!badge) return;
      const sx = (boss.x - cam.worldView.x) * ZOOM;
      const sy = (boss.y - 70 - cam.worldView.y) * ZOOM;
      const near = Math.abs(boss.x - (s.player.x + 5)) < 140;
      if (boss.state !== 'active' || !near || sx < 0 || sx > this.scale.width) {
        badge.setVisible(false);
        return;
      }
      const r = interaction(s.hero, boss.config.kind, stage);
      const text = r.ok
        ? r.effect === 'freeze'
          ? `${s.hero.name} CAN FREEZE IT ❄`
          : `${s.hero.name} CAN STOP IT ✓`
        : r.reason === 'too-late'
          ? 'TOO LATE FOR THIS HERO ⏱'
          : `${s.hero.name} CAN'T STOP ${name} ✕`;
      badge
        .setVisible(true)
        .setPosition(sx, sy)
        .setText(
          role === 'off-target' || role === 'desired'
            ? text
            : `RIGHT TARGET: ${text.replace(' ✓', '')}?`,
        )
        .setColor(r.ok ? PALETTE.textMint : PALETTE.textRed);
    });
  }
}
