import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { discover, progress, recordBest } from '../config/progress';
import { SCALES, type ScaleId } from '../content/organisms';
import { JOURNAL_ENTRIES } from '../content/journal';
import { roundFor } from '../levels/oneDropRounds';
import {
  accuracy,
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
 * ONE DROP: a round of microscope-field documentation. Tap (or select + Enter) a particle to
 * claim it as the round's target; tap its small "?" badge (or select + U) to document it as an
 * ambiguous observation instead of guessing. Both are legitimate scientific calls — only a wrong
 * capture breaks the combo, never an honest "unknown."
 */
export class OneDropScene extends Phaser.Scene {
  private state!: OneDropState;
  private scaleId!: ScaleId;
  private sprites = new Map<number, Sprite>();
  private center!: { x: number; y: number };
  private hud!: {
    score: Phaser.GameObjects.Text;
    combo: Phaser.GameObjects.Text;
    objective: Phaser.GameObjects.Text;
    time: Phaser.GameObjects.Text;
  };
  private selected: number | null = null;
  private selectRing!: Phaser.GameObjects.Arc;
  private ended = false;
  private speedMul = 1;

  constructor() {
    super('OneDrop');
  }

  create(data: { scaleId: ScaleId }): void {
    this.scaleId = data.scaleId;
    this.ended = false;
    this.selected = null;
    this.sprites.clear();
    this.speedMul = progress().relaxedMicroscopy ? 0.65 : 1;

    const info = SCALES[this.scaleId];
    const config = roundFor(this.scaleId, 10, 45);
    this.state = createOneDrop(config, Math.floor(Math.random() * 1e9));

    const { width, height } = this.scale;
    this.center = { x: width / 2, y: height / 2 + 30 };
    this.cameras.main.setBackgroundColor(PALETTE.midnight).fadeIn(200);

    addCenteredText(this, 44, `${info.name.toUpperCase()} — ${info.instrument}`, TEXT_STYLES.title);

    const field = this.add.circle(
      this.center.x,
      this.center.y,
      config.fieldRadius,
      PALETTE.marine,
      0.5,
    );
    field.setStrokeStyle(3, PALETTE.glacier, 0.6);
    this.add
      .circle(this.center.x, this.center.y, config.fieldRadius + 20, PALETTE.ink, 0)
      .setStrokeStyle(2, PALETTE.ink, 0.3);

    this.selectRing = this.add
      .circle(0, 0, 10)
      .setStrokeStyle(3, PALETTE.ice, 0.9)
      .setVisible(false);

    this.hud = {
      score: this.add.text(24, 90, '', TEXT_STYLES.hud),
      combo: this.add.text(24, 118, '', { ...TEXT_STYLES.hud, color: PALETTE.textGold }),
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

    sound.playSong('drop');
    announce(`${info.name}. Document ${config.objective.count} targets before time runs out.`);

    this.refreshHud();
  }

  private pause(): void {
    this.scene.pause();
    this.scene.launch('Pause', { returnTo: 'OneDrop', returnData: { scaleId: this.scaleId } });
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
    const events = capture(this.state, id);
    this.handleEvents(events);
  }

  private documentUnknown(id: number): void {
    if (this.ended) return;
    sound.unlock();
    const events = markUnknown(this.state, id);
    this.handleEvents(events);
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
    announce(`Selected a ${next.kind === 'target' ? 'possible target' : 'particle'}.`);
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
        this.popup(`+${e.points}`, PALETTE.textMint, this.center.x, this.center.y - 200);
      } else if (e.type === 'wrong') {
        sound.play('miss');
        this.popup('NOT A MATCH', PALETTE.textCoral, this.center.x, this.center.y - 200);
      } else if (e.type === 'documentedUnknown') {
        sound.play('discover');
        this.popup('DOCUMENTED', PALETTE.textAmber, this.center.x, this.center.y - 200);
        announce('Documented as an uncertain observation.');
      } else if (e.type === 'missedUnknown') {
        this.popup('NOTED', PALETTE.textDim, this.center.x, this.center.y - 200);
      } else if (e.type === 'won' || e.type === 'lost') {
        this.finish(e.type === 'won');
      }
    }
  }

  private popup(text: string, color: string, x: number, y: number): void {
    const t = this.add.text(x, y, text, { ...TEXT_STYLES.hud, color }).setOrigin(0.5);
    this.tweens.add({
      targets: t,
      y: y - 40,
      alpha: 0,
      duration: 700,
      onComplete: () => t.destroy(),
    });
  }

  private refreshHud(): void {
    this.hud.score.setText(`SCORE ${this.state.score}`);
    this.hud.combo.setText(this.state.combo > 1 ? `COMBO x${this.state.combo}` : '');
    this.hud.objective.setText(
      `${this.state.captured} / ${this.state.config.objective.count} DOCUMENTED`,
    );
    const remaining = Math.max(0, this.state.config.durationSeconds - this.state.time);
    this.hud.time.setText(`${remaining.toFixed(0)}s`);
  }

  private finish(won: boolean): void {
    if (this.ended) return;
    this.ended = true;
    sound.stopSong();
    sound.play(won ? 'win' : 'lose');
    const stars = won ? (accuracy(this.state) > 0.85 ? 3 : accuracy(this.state) > 0.6 ? 2 : 1) : 0;
    recordBest(this.state.config.id, this.state.score, stars);
    announce(won ? 'Sample documented.' : 'Time ran out.');
    this.time.delayedCall(400, () =>
      this.scene.start('OneDropResults', {
        scaleId: this.scaleId,
        won,
        score: this.state.score,
        captured: this.state.captured,
        objective: this.state.config.objective.count,
        accuracy: accuracy(this.state),
        unknownsDocumented: this.state.unknownsDocumented,
        bestCombo: this.state.bestCombo,
        stars,
      }),
    );
  }
}
