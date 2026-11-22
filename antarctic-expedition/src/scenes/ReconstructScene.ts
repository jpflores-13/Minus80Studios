import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { recordBest } from '../config/progress';
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
} from '../systems/oneDrop';
import { announce } from '../ui/announce';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

interface Sprite {
  frame: Phaser.GameObjects.Rectangle;
  mark: Phaser.GameObjects.Arc;
  markLabel: Phaser.GameObjects.Text;
}

/**
 * RECONSTRUCT: a cryo-EM particle-picking round. Reuses the ONE DROP engine (same four-category
 * classification, same scoring) with the molecular scale's stationary particle set — only the
 * presentation changes, to match the "pick good projections, reject noise" framing. Clearing the
 * round reveals an illustrative, deliberately simplified 3D shape, never a claimed real result.
 */
export class ReconstructScene extends Phaser.Scene {
  private state!: OneDropState;
  private sprites = new Map<number, Sprite>();
  private center!: { x: number; y: number };
  private progressBar!: Phaser.GameObjects.Rectangle;
  private progressTrack!: Phaser.GameObjects.Rectangle;
  private hud!: { score: Phaser.GameObjects.Text; time: Phaser.GameObjects.Text };
  private ended = false;

  constructor() {
    super('Reconstruct');
  }

  create(): void {
    this.ended = false;
    this.sprites.clear();
    const config = roundFor('molecular', 8, 50);
    this.state = createOneDrop(config, Math.floor(Math.random() * 1e9));

    const { width, height } = this.scale;
    this.center = { x: width / 2, y: height / 2 + 30 };
    this.cameras.main.setBackgroundColor(PALETTE.ink).fadeIn(200);

    addCenteredText(this, 44, 'RECONSTRUCT — CRYO-ELECTRON MICROSCOPE', TEXT_STYLES.title);
    addCenteredText(
      this,
      78,
      'Pick clear particle projections. Reject noise, overlap, and contamination.',
      TEXT_STYLES.hint,
    );

    this.add
      .circle(this.center.x, this.center.y, config.fieldRadius, PALETTE.marine, 0.25)
      .setStrokeStyle(2, PALETTE.glacier, 0.4);

    const barW = 420;
    this.progressTrack = this.add
      .rectangle(width / 2, 108, barW, 18, PALETTE.marine)
      .setStrokeStyle(2, PALETTE.glacier);
    this.progressBar = this.add
      .rectangle(width / 2 - barW / 2, 108, 1, 14, PALETTE.mint)
      .setOrigin(0, 0.5);

    this.hud = {
      score: this.add.text(24, 90, '', TEXT_STYLES.hud),
      time: this.add.text(width - 24, 90, '', TEXT_STYLES.hud).setOrigin(1, 0),
    };

    addCenteredText(
      this,
      height - 46,
      'Tap a clear projection to keep it · tap its ? badge to flag a poor-quality one instead of guessing',
      TEXT_STYLES.hint,
    );

    const esc = this.input.keyboard?.addKey('ESC');
    esc?.on('down', () => {
      this.scene.pause();
      this.scene.launch('Pause', { returnTo: 'Reconstruct', returnData: {} });
    });

    sound.playSong('drop');
    announce(`Reconstruct. Select ${config.objective.count} clear particle projections.`);
    this.refreshHud();
  }

  override update(_time: number, deltaMs: number): void {
    if (this.ended) return;
    const dt = deltaMs / 1000;
    const events = stepOneDrop(this.state, dt);
    this.syncSprites();
    this.handleEvents(events);
    this.refreshHud();
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
      const x = this.center.x + p.x;
      const y = this.center.y + p.y;
      s.frame.setPosition(x, y);
      s.mark.setPosition(x + p.radius * 0.9, y - p.radius * 0.9);
      s.markLabel.setPosition(s.mark.x, s.mark.y);
    }
    for (const [id, s] of this.sprites) {
      if (!live.has(id)) {
        s.frame.destroy();
        s.mark.destroy();
        s.markLabel.destroy();
        this.sprites.delete(id);
      }
    }
  }

  private makeSprite(p: Particle): Sprite {
    const isTarget = p.typeId === this.state.config.objective.targetTypeId;
    const fill = isTarget ? PALETTE.glacier : p.kind === 'unknown' ? PALETTE.amber : PALETTE.marine;
    const frame = this.add.rectangle(
      this.center.x + p.x,
      this.center.y + p.y,
      p.radius * 2.4,
      p.radius * 2.4,
      fill,
      p.kind === 'unknown' ? 0.3 : 0.7,
    );
    frame.setStrokeStyle(2, isTarget ? PALETTE.mint : PALETTE.coral, 0.8);
    frame.setInteractive({ useHandCursor: true });
    frame.on('pointerup', () => this.pick(p.id));

    const mark = this.add
      .circle(frame.x + p.radius * 0.9, frame.y - p.radius * 0.9, 9, PALETTE.ink, 0.9)
      .setStrokeStyle(2, PALETTE.amber, 1);
    mark.setInteractive({ useHandCursor: true });
    mark.on('pointerup', () => this.flag(p.id));
    const markLabel = this.add
      .text(mark.x, mark.y, '?', {
        ...TEXT_STYLES.small,
        color: PALETTE.textAmber,
        fontSize: '14px',
      })
      .setOrigin(0.5);

    return { frame, mark, markLabel };
  }

  private pick(id: number): void {
    if (this.ended) return;
    sound.unlock();
    this.handleEvents(capture(this.state, id));
  }

  private flag(id: number): void {
    if (this.ended) return;
    sound.unlock();
    this.handleEvents(markUnknown(this.state, id));
  }

  private handleEvents(events: OneDropEvent[]): void {
    for (const e of events) {
      if (e.type === 'captured') sound.play('capture');
      else if (e.type === 'wrong') sound.play('miss');
      else if (e.type === 'documentedUnknown') sound.play('discover');
      else if (e.type === 'won' || e.type === 'lost') this.finish(e.type === 'won');
    }
  }

  private refreshHud(): void {
    this.hud.score.setText(`SCORE ${this.state.score}`);
    const remaining = Math.max(0, this.state.config.durationSeconds - this.state.time);
    this.hud.time.setText(`${remaining.toFixed(0)}s`);
    const frac = this.state.captured / this.state.config.objective.count;
    this.progressBar.width = Math.max(1, (this.progressTrack.width - 4) * Math.min(1, frac));
  }

  private finish(won: boolean): void {
    if (this.ended) return;
    this.ended = true;
    sound.stopSong();
    sound.play(won ? 'win' : 'lose');
    recordBest(this.state.config.id, this.state.score, won ? 3 : 0);
    announce(won ? 'Enough clear projections collected.' : 'Time ran out.');
    this.time.delayedCall(400, () =>
      this.scene.start(won ? 'ReconstructReveal' : 'OneDropResults', {
        scaleId: 'molecular',
        won,
        score: this.state.score,
        captured: this.state.captured,
        objective: this.state.config.objective.count,
        accuracy: accuracy(this.state),
        unknownsDocumented: this.state.unknownsDocumented,
        bestCombo: this.state.bestCombo,
        stars: won ? 3 : 0,
      }),
    );
  }
}
