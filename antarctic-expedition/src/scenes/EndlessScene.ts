import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { discover, progress, recordEndless } from '../config/progress';
import { JOURNAL_ENTRIES } from '../content/journal';
import { endlessRoundFor } from '../levels/oneDropRounds';
import {
  capture,
  createOneDrop,
  markUnknown,
  stepOneDrop,
  type OneDropEvent,
  type OneDropState,
  type Particle,
  type ParticleKind,
} from '../systems/oneDrop';
import { announce } from '../ui/announce';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

const KIND_COLOR: Record<ParticleKind, number> = {
  target: PALETTE.mint,
  nonTarget: PALETTE.glacier,
  artifact: PALETTE.coral,
  unknown: PALETTE.amber,
};

interface Sprite {
  body: Phaser.GameObjects.Arc;
  mark: Phaser.GameObjects.Arc;
  markLabel: Phaser.GameObjects.Text;
}

/**
 * ENDLESS EXPEDITION: ONE DROP rounds cycle through every scale in order, lap after lap, with
 * the objective rising and the clock tightening each time the cycle repeats. One missed round
 * ends the run; score carries across laps for a single cumulative total.
 */
export class EndlessScene extends Phaser.Scene {
  private state!: OneDropState;
  private lap = 0;
  private totalScore = 0;
  private sprites = new Map<number, Sprite>();
  private center!: { x: number; y: number };
  private hud!: {
    score: Phaser.GameObjects.Text;
    lap: Phaser.GameObjects.Text;
    objective: Phaser.GameObjects.Text;
    time: Phaser.GameObjects.Text;
  };
  private selected: number | null = null;
  private selectRing!: Phaser.GameObjects.Arc;
  private ended = false;
  private speedMul = 1;

  constructor() {
    super('Endless');
  }

  create(): void {
    this.lap = 0;
    this.totalScore = 0;
    this.speedMul = progress().relaxedMicroscopy ? 0.65 : 1;
    const { width, height } = this.scale;
    this.center = { x: width / 2, y: height / 2 + 30 };
    this.cameras.main.setBackgroundColor(PALETTE.midnight);

    addCenteredText(this, 44, 'ENDLESS EXPEDITION', TEXT_STYLES.title);
    this.add
      .circle(this.center.x, this.center.y, 220, PALETTE.marine, 0.5)
      .setStrokeStyle(3, PALETTE.glacier, 0.6);
    this.selectRing = this.add
      .circle(0, 0, 10)
      .setStrokeStyle(3, PALETTE.ice, 0.9)
      .setVisible(false);

    this.hud = {
      score: this.add.text(24, 90, '', TEXT_STYLES.hud),
      lap: this.add.text(24, 118, '', { ...TEXT_STYLES.hud, color: PALETTE.textGold }),
      objective: this.add.text(width - 24, 90, '', TEXT_STYLES.hud).setOrigin(1, 0),
      time: this.add.text(width - 24, 118, '', TEXT_STYLES.hud).setOrigin(1, 0),
    };

    addCenteredText(
      this,
      height - 70,
      'Tap a particle to document the target · tap its ? badge if you are not sure',
      TEXT_STYLES.hint,
    );
    addCenteredText(
      this,
      height - 46,
      'Keyboard: Tab selects the nearest particle, Enter documents it, U marks it uncertain',
      TEXT_STYLES.hint,
    );

    const esc = this.input.keyboard?.addKey('ESC');
    const pKey = this.input.keyboard?.addKey('P');
    esc?.on('down', () => this.pause());
    pKey?.on('down', () => this.pause());
    this.input.keyboard?.on('keydown-TAB', (e: KeyboardEvent) => {
      e.preventDefault();
      this.cycleSelection();
    });
    this.input.keyboard?.on('keydown-ENTER', () => this.resolveSelected('capture'));
    this.input.keyboard?.on('keydown-U', () => this.resolveSelected('unknown'));

    this.startLap();
  }

  private startLap(): void {
    this.ended = false;
    this.selected = null;
    this.selectRing.setVisible(false);
    for (const s of this.sprites.values()) {
      s.body.destroy();
      s.mark.destroy();
      s.markLabel.destroy();
    }
    this.sprites.clear();
    const config = endlessRoundFor(this.lap);
    this.state = createOneDrop(config, Math.floor(Math.random() * 1e9));
    announce(`${config.name}. Document ${config.objective.count} targets.`);
    sound.playSong('drop');
    this.refreshHud();
  }

  private pause(): void {
    this.scene.pause();
    this.scene.launch('Pause', { returnTo: 'Endless', returnData: {} });
  }

  override update(_time: number, deltaMs: number): void {
    if (this.ended) return;
    const dt = (deltaMs / 1000) * this.speedMul;
    const events = stepOneDrop(this.state, dt);
    this.syncSprites();
    this.handleEvents(events);
    this.refreshHud();
    if (
      this.selected !== null &&
      !this.state.particles.some((p) => p.id === this.selected && p.alive)
    ) {
      this.selected = null;
      this.selectRing.setVisible(false);
    } else if (this.selected !== null) {
      const p = this.state.particles.find((x) => x.id === this.selected);
      if (p) this.selectRing.setPosition(this.center.x + p.x, this.center.y + p.y);
    }
  }

  private syncSprites(): void {
    const live = new Set<number>();
    for (const p of this.state.particles) {
      if (!p.alive) continue;
      live.add(p.id);
      let s = this.sprites.get(p.id);
      if (!s) {
        s = this.makeSprite(p);
        this.sprites.set(p.id, s);
      }
      s.body.setPosition(this.center.x + p.x, this.center.y + p.y);
      s.mark.setPosition(
        this.center.x + p.x + p.radius * 0.8,
        this.center.y + p.y - p.radius * 0.8,
      );
      s.markLabel.setPosition(s.mark.x, s.mark.y);
    }
    for (const [id, s] of this.sprites) {
      if (!live.has(id)) {
        s.body.destroy();
        s.mark.destroy();
        s.markLabel.destroy();
        this.sprites.delete(id);
      }
    }
  }

  private makeSprite(p: Particle): Sprite {
    const color = KIND_COLOR[p.kind];
    const body = this.add.circle(
      this.center.x + p.x,
      this.center.y + p.y,
      p.radius,
      color,
      p.kind === 'unknown' ? 0.35 : 0.9,
    );
    body.setStrokeStyle(2, p.kind === 'artifact' ? PALETTE.coral : PALETTE.ice, 0.7);
    body.setInteractive({ useHandCursor: true });
    body.on('pointerup', () => this.capture(p.id));

    const mark = this.add.circle(
      body.x + p.radius * 0.8,
      body.y - p.radius * 0.8,
      9,
      PALETTE.ink,
      0.85,
    );
    mark.setStrokeStyle(2, PALETTE.amber, 1);
    mark.setInteractive({ useHandCursor: true });
    mark.on('pointerup', () => this.documentUnknown(p.id));
    const markLabel = this.add
      .text(mark.x, mark.y, '?', {
        ...TEXT_STYLES.small,
        color: PALETTE.textAmber,
        fontSize: '14px',
      })
      .setOrigin(0.5);

    return { body, mark, markLabel };
  }

  private capture(id: number): void {
    if (this.ended) return;
    sound.unlock();
    this.handleEvents(capture(this.state, id));
  }

  private documentUnknown(id: number): void {
    if (this.ended) return;
    sound.unlock();
    this.handleEvents(markUnknown(this.state, id));
  }

  private cycleSelection(): void {
    const live = this.state.particles.filter((p) => p.alive);
    if (live.length === 0) return;
    const idx = live.findIndex((p) => p.id === this.selected);
    const next = live[(idx + 1) % live.length]!;
    this.selected = next.id;
    this.selectRing
      .setVisible(true)
      .setRadius(next.radius + 8)
      .setPosition(this.center.x + next.x, this.center.y + next.y);
  }

  private resolveSelected(action: 'capture' | 'unknown'): void {
    if (this.selected === null) return;
    if (action === 'capture') this.capture(this.selected);
    else this.documentUnknown(this.selected);
  }

  private handleEvents(events: OneDropEvent[]): void {
    for (const e of events) {
      if (e.type === 'captured') {
        sound.play('capture');
        if (e.combo > 1) sound.play('combo');
        if (e.typeId in JOURNAL_ENTRIES) discover(e.typeId, 2);
        this.popup(`+${e.points}`, PALETTE.textMint);
      } else if (e.type === 'wrong') {
        sound.play('miss');
        this.popup('NOT A MATCH', PALETTE.textCoral);
      } else if (e.type === 'documentedUnknown') {
        sound.play('discover');
        this.popup('DOCUMENTED', PALETTE.textAmber);
      } else if (e.type === 'won') {
        this.totalScore += this.state.score;
        this.lap++;
        sound.play('win');
        this.time.delayedCall(300, () => this.startLap());
      } else if (e.type === 'lost') {
        this.finish();
      }
    }
  }

  private popup(text: string, color: string): void {
    const t = this.add
      .text(this.center.x, this.center.y - 200, text, { ...TEXT_STYLES.hud, color })
      .setOrigin(0.5);
    this.tweens.add({
      targets: t,
      y: t.y - 40,
      alpha: 0,
      duration: 700,
      onComplete: () => t.destroy(),
    });
  }

  private refreshHud(): void {
    this.hud.score.setText(`SCORE ${this.totalScore + this.state.score}`);
    this.hud.lap.setText(`LAP ${this.lap + 1}`);
    this.hud.objective.setText(
      `${this.state.captured} / ${this.state.config.objective.count} DOCUMENTED`,
    );
    const remaining = Math.max(0, this.state.config.durationSeconds - this.state.time);
    this.hud.time.setText(`${remaining.toFixed(0)}s`);
  }

  private finish(): void {
    if (this.ended) return;
    this.ended = true;
    sound.stopSong();
    sound.play('lose');
    const finalScore = this.totalScore + this.state.score;
    recordEndless(finalScore);
    announce(`Run over. Final score ${finalScore}.`);
    this.time.delayedCall(400, () =>
      this.scene.start('EndlessResults', { score: finalScore, laps: this.lap + 1 }),
    );
  }
}
