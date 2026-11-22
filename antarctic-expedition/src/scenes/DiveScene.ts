import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { discover } from '../config/progress';
import { PALETTE } from '../config/gameConfig';
import { WILDLIFE } from '../content/wildlife';
import { diveRoundFor } from '../levels/diveRounds';
import {
  collectSample,
  createDive,
  stepDive,
  takePhoto,
  totalPhotoScore,
  type DiveEvent,
  type DiveState,
  type WildlifeInstance,
} from '../systems/dive';
import { announce } from '../ui/announce';
import { addCenteredText, TEXT_STYLES } from '../ui/text';
import type { ScaleId } from '../content/organisms';

interface DiveSprite {
  body: Phaser.GameObjects.Arc;
  glyph: Phaser.GameObjects.Text;
  label: Phaser.GameObjects.Text;
}

const MOOD_BORDER: Record<WildlifeInstance['mood'], number> = {
  idle: PALETTE.ice,
  alert: PALETTE.amber,
  fleeing: PALETTE.coral,
};

/**
 * DIVE: the diver swims a field of view, photographing wildlife and (optionally) collecting one
 * water sample. Approach fast and close and an animal flees instead of posing; the ideal
 * framing distance is shown as a ring once something is in range. The sample collected here
 * decides the specimen mix in the ONE DROP round that follows (see DiveResultsScene).
 */
export class DiveScene extends Phaser.Scene {
  private state!: DiveState;
  private nextScale!: ScaleId;
  private origin!: { x: number; y: number };
  private diverSprite!: Phaser.GameObjects.Arc;
  private frameRing!: Phaser.GameObjects.Arc;
  private sampleMarker!: Phaser.GameObjects.Arc;
  private sprites = new Map<number, DiveSprite>();
  private hud!: {
    battery: Phaser.GameObjects.Text;
    time: Phaser.GameObjects.Text;
    photos: Phaser.GameObjects.Text;
    sample: Phaser.GameObjects.Text;
  };
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'w' | 'a' | 's' | 'd', Phaser.Input.Keyboard.Key>;
  private ended = false;

  constructor() {
    super('Dive');
  }

  create(data: { id?: string; name?: string; nextScale: ScaleId }): void {
    this.nextScale = data.nextScale;
    this.ended = false;
    this.sprites.clear();

    const config = diveRoundFor(data.id ?? 'dive-arcade', data.name ?? 'DIVE', this.nextScale);
    this.state = createDive(config, Math.floor(Math.random() * 1e9));

    const { width, height } = this.scale;
    this.origin = { x: (width - config.fieldWidth) / 2, y: 100 };
    this.cameras.main.setBackgroundColor(PALETTE.midnight).fadeIn(200);

    addCenteredText(this, 44, (data.name ?? 'DIVE').toUpperCase(), TEXT_STYLES.title);

    const field = this.add.rectangle(
      this.origin.x,
      this.origin.y,
      config.fieldWidth,
      config.fieldHeight,
      PALETTE.marine,
      0.35,
    );
    field.setOrigin(0).setStrokeStyle(3, PALETTE.glacier, 0.5);

    this.sampleMarker = this.add.circle(
      this.origin.x + config.sampleSite.x,
      this.origin.y + config.sampleSite.y,
      config.sampleSite.radius,
      PALETTE.mint,
      0.15,
    );
    this.sampleMarker.setStrokeStyle(2, PALETTE.mint, 0.8);
    this.add
      .text(this.sampleMarker.x, this.sampleMarker.y, 'SAMPLE SITE', {
        ...TEXT_STYLES.small,
        color: PALETTE.textMint,
      })
      .setOrigin(0.5);

    this.frameRing = this.add.circle(0, 0, 10).setStrokeStyle(2, PALETTE.ice, 0.0);

    this.diverSprite = this.add.circle(
      this.origin.x + this.state.diverX,
      this.origin.y + this.state.diverY,
      12,
      PALETTE.ice,
      1,
    );
    this.diverSprite.setStrokeStyle(2, PALETTE.midnight, 1);

    this.hud = {
      battery: this.add.text(24, 90, '', TEXT_STYLES.hud),
      time: this.add.text(width - 24, 90, '', TEXT_STYLES.hud).setOrigin(1, 0),
      photos: this.add.text(24, 118, '', TEXT_STYLES.hud),
      sample: this.add.text(width - 24, 118, '', TEXT_STYLES.hud).setOrigin(1, 0),
    };

    addCenteredText(
      this,
      height - 70,
      'Arrows/WASD to swim · SPACE to photograph · E to collect the water sample',
      TEXT_STYLES.hint,
    );
    addCenteredText(
      this,
      height - 46,
      'Approaching fast and close scares wildlife away; a calm approach gets the better shot',
      TEXT_STYLES.hint,
    );

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      w: this.input.keyboard!.addKey('W'),
      a: this.input.keyboard!.addKey('A'),
      s: this.input.keyboard!.addKey('S'),
      d: this.input.keyboard!.addKey('D'),
    };
    this.input.keyboard!.addKey('SPACE').on('down', () => this.shoot());
    this.input.keyboard!.addKey('E').on('down', () => this.sample());
    this.input.keyboard!.addKey('ESC').on('down', () => this.pause());
    this.input.keyboard!.addKey('P').on('down', () => this.pause());

    sound.playSong('dive');
    announce(`${data.name ?? 'DIVE'}. Photograph wildlife and find the water sample site.`);
    this.refreshHud();
  }

  private pause(): void {
    this.scene.pause();
    this.scene.launch('Pause', {
      returnTo: 'Dive',
      returnData: {
        id: this.state.config.id,
        name: this.state.config.name,
        nextScale: this.nextScale,
      },
    });
  }

  override update(_time: number, deltaMs: number): void {
    if (this.ended) return;
    const dt = deltaMs / 1000;
    let mx = 0;
    let my = 0;
    if (this.cursors.left.isDown || this.wasd.a.isDown) mx -= 1;
    if (this.cursors.right.isDown || this.wasd.d.isDown) mx += 1;
    if (this.cursors.up.isDown || this.wasd.w.isDown) my -= 1;
    if (this.cursors.down.isDown || this.wasd.s.isDown) my += 1;

    const events = stepDive(this.state, dt, mx, my);
    this.sync();
    this.handleEvents(events);
    this.refreshHud();
  }

  private sync(): void {
    this.diverSprite.setPosition(
      this.origin.x + this.state.diverX,
      this.origin.y + this.state.diverY,
    );

    const live = new Set<number>();
    let nearest: WildlifeInstance | null = null;
    let nearestDist = Infinity;
    for (const w of this.state.wildlife) {
      live.add(w.id);
      let s = this.sprites.get(w.id);
      if (!s) {
        s = this.makeSprite(w);
        this.sprites.set(w.id, s);
      }
      const species = WILDLIFE[w.speciesId]!;
      s.body.setPosition(this.origin.x + w.x, this.origin.y + w.y);
      s.body.setStrokeStyle(w.behaviorActive ? 4 : 2, MOOD_BORDER[w.mood], 1);
      s.glyph.setPosition(s.body.x, s.body.y);
      s.label.setPosition(s.body.x, s.body.y - 24);
      s.label.setText(
        `${species.name}${w.behaviorActive && species.behavior ? ` — ${species.behavior}` : ''}`,
      );

      const d = Math.hypot(w.x - this.state.diverX, w.y - this.state.diverY);
      if (d < species.idealDistance * 2 && d < nearestDist) {
        nearest = w;
        nearestDist = d;
      }
    }
    for (const [id, s] of this.sprites) {
      if (!live.has(id)) {
        s.body.destroy();
        s.glyph.destroy();
        s.label.destroy();
        this.sprites.delete(id);
      }
    }

    if (nearest) {
      const species = WILDLIFE[nearest.speciesId]!;
      this.frameRing.setPosition(this.origin.x + nearest.x, this.origin.y + nearest.y);
      this.frameRing.setRadius(species.idealDistance);
      this.frameRing.setStrokeStyle(2, PALETTE.mint, 0.5);
    } else {
      this.frameRing.setStrokeStyle(2, PALETTE.ice, 0);
    }
  }

  private makeSprite(w: WildlifeInstance): DiveSprite {
    const species = WILDLIFE[w.speciesId]!;
    const body = this.add.circle(
      this.origin.x + w.x,
      this.origin.y + w.y,
      16,
      PALETTE.glacier,
      0.85,
    );
    body.setStrokeStyle(2, PALETTE.ice, 1);
    const glyph = this.add
      .text(body.x, body.y, species.name[0] ?? '?', { ...TEXT_STYLES.small, color: '#040f17' })
      .setOrigin(0.5);
    const label = this.add
      .text(body.x, body.y - 24, species.name, { ...TEXT_STYLES.small, color: PALETTE.textDim })
      .setOrigin(0.5);
    return { body, glyph, label };
  }

  private shoot(): void {
    if (this.ended) return;
    sound.unlock();
    sound.play('shutter');
    const events = takePhoto(this.state);
    this.handleEvents(events);
  }

  private sample(): void {
    if (this.ended) return;
    sound.unlock();
    const events = collectSample(this.state);
    this.handleEvents(events);
  }

  private handleEvents(events: DiveEvent[]): void {
    for (const e of events) {
      if (e.type === 'photo') {
        sound.play(e.result.quality === 'poor' ? 'miss' : 'capture');
        this.popup(
          `${e.result.quality.toUpperCase()} +${e.result.score}`,
          e.result.quality === 'poor' ? PALETTE.textCoral : PALETTE.textMint,
        );
        const qualityRank = { poor: 1, good: 2, great: 3, exceptional: 4 }[e.result.quality];
        discover(e.result.speciesId, qualityRank);
        if (e.result.disturbed) announce('That shot was blurred — the animal was fleeing.');
      } else if (e.type === 'noSubject') {
        this.popup('NOTHING IN FRAME', PALETTE.textDim);
      } else if (e.type === 'outOfBattery') {
        sound.play('deny');
        this.popup('OUT OF BATTERY', PALETTE.textCoral);
      } else if (e.type === 'disturbed') {
        announce('The animal was startled and fled.');
      } else if (e.type === 'sampleCollected') {
        sound.play('sample');
        this.popup('WATER SAMPLE COLLECTED', PALETTE.textMint);
        announce('Water sample collected. It will determine the next microscope round.');
      } else if (e.type === 'surfaced') {
        this.finish();
      }
    }
  }

  private popup(text: string, color: string): void {
    const t = this.add
      .text(this.scale.width / 2, this.origin.y - 20, text, { ...TEXT_STYLES.hud, color })
      .setOrigin(0.5);
    this.tweens.add({
      targets: t,
      y: t.y - 30,
      alpha: 0,
      duration: 800,
      onComplete: () => t.destroy(),
    });
  }

  private refreshHud(): void {
    this.hud.battery.setText(`BATTERY ${Math.max(0, this.state.battery)}`);
    const remaining = Math.max(0, this.state.config.durationSeconds - this.state.time);
    this.hud.time.setText(`${remaining.toFixed(0)}s`);
    this.hud.photos.setText(`PHOTOS ${this.state.photos.length}`);
    this.hud.sample.setText(this.state.sampleCollected ? 'SAMPLE: COLLECTED' : 'SAMPLE: NOT YET');
  }

  private finish(): void {
    if (this.ended) return;
    this.ended = true;
    sound.stopSong();
    announce('Surfaced. Expedition complete.');
    this.time.delayedCall(300, () =>
      this.scene.start('DiveResults', {
        name: this.state.config.name,
        photos: this.state.photos,
        totalScore: totalPhotoScore(this.state),
        speciesCount: this.state.speciesPhotographed.size,
        disturbanceEvents: this.state.disturbanceEvents,
        sampleCollected: this.state.sampleCollected,
        nextScale: this.nextScale,
      }),
    );
  }
}
