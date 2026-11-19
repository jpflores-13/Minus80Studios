import Phaser from 'phaser';
import { PALETTE, PIXEL, TOOLBAR_HEIGHT } from '../config/gameConfig';
import { TUNING } from '../config/tuning';
import type { EquipmentKind, LevelConfig, Slot } from '../levels/types';
import type { Deployment } from '../systems/equipment';
import type { LitterItem } from '../systems/litter';
import { pointAt, segmentLength, worldPosition } from '../systems/network';
import type { SimState } from '../systems/sim';
import { prefersReducedMotion } from '../utils/accessibility';
import { createRng } from '../utils/rng';
import { TEXT_STYLES } from '../ui/text';

/** Everything drawn on the watershed map: terrain, creek, sources, slots, equipment, and litter. */
export class MapView {
  private readonly flowFx: Phaser.GameObjects.Graphics;
  private readonly slotFx: Phaser.GameObjects.Graphics;
  private readonly equipment = new Map<
    string,
    { sprite: Phaser.GameObjects.Image; label?: Phaser.GameObjects.Text }
  >();
  private readonly litter = new Map<number, Phaser.GameObjects.Image>();
  private readonly still = prefersReducedMotion();
  showFlowArrows = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly level: LevelConfig,
  ) {
    this.paintTerrain();
    this.flowFx = scene.add.graphics().setDepth(2);
    this.slotFx = scene.add.graphics().setDepth(3);
    this.drawSources();
  }

  /** Slot nearest to a point, within `radius` px. */
  slotAt(x: number, y: number, radius = 34): Slot | undefined {
    let best: Slot | undefined;
    let bestD = radius;
    for (const s of this.level.slots) {
      const d = Math.hypot(s.pos.x - x, s.pos.y - y);
      if (d <= bestD) {
        best = s;
        bestD = d;
      }
    }
    return best;
  }

  sourceAt(x: number, y: number): LevelConfig['sources'][number] | undefined {
    return this.level.sources.find((s) => Math.hypot(s.pos.x - x, s.pos.y - y) < 50);
  }

  /** Redraw equipment sprites from the deployment (cheap; called after any change). */
  syncEquipment(dep: Deployment): void {
    for (const [slotId, view] of this.equipment) {
      if (!dep[slotId]) {
        view.sprite.destroy();
        view.label?.destroy();
        this.equipment.delete(slotId);
      }
    }
    for (const [slotId, kind] of Object.entries(dep)) {
      if (this.equipment.has(slotId)) continue;
      const slot = this.level.slots.find((s) => s.id === slotId);
      if (!slot) continue;
      const sprite = this.scene.add.image(slot.pos.x, slot.pos.y, kind).setScale(PIXEL).setDepth(6);
      let label: Phaser.GameObjects.Text | undefined;
      if (kind === 'trap') {
        sprite.setRotation(this.trapAngle(slot));
        label = this.scene.add
          .text(slot.pos.x, slot.pos.y - 34, '', TEXT_STYLES.label)
          .setOrigin(0.5)
          .setDepth(8)
          .setBackgroundColor('#2d2a26cc')
          .setPadding(4, 2, 4, 2);
      }
      this.scene.tweens.add({
        targets: sprite,
        scale: { from: PIXEL * 1.4, to: PIXEL },
        duration: 180,
      });
      this.equipment.set(slotId, label ? { sprite, label } : { sprite });
    }
  }

  /** Per-frame drawing: animated water, slot highlights, trap gauges, litter. */
  update(
    time: number,
    dep: Deployment,
    highlight: EquipmentKind | null,
    sim: SimState | undefined,
  ): void {
    this.drawFlow(time);
    this.drawSlots(time, dep, highlight);
    if (sim) {
      for (const trap of sim.traps) {
        const label = this.equipment.get(trap.slotId)?.label;
        label?.setText(
          trap.count >= trap.capacity
            ? `FULL ${trap.count}/${trap.capacity}`
            : `${trap.count}/${trap.capacity}`,
        );
        label?.setBackgroundColor(trap.count >= trap.capacity ? '#b5452bdd' : '#2d2a26cc');
      }
      this.drawLitter(sim);
    } else {
      for (const view of this.equipment.values()) view.label?.setText(`0/${TUNING.trap.capacity}`);
    }
  }

  private drawLitter(sim: SimState): void {
    const visible = new Set<number>();
    for (const item of sim.items) {
      if (item.state !== 'floating') continue;
      visible.add(item.id);
      const seg = sim.segments.get(item.segmentId);
      if (!seg) continue;
      const p = worldPosition(seg, item.s, item.lateral);
      let sprite = this.litter.get(item.id);
      if (!sprite) {
        sprite = this.scene.add.image(p.x, p.y, item.category).setScale(PIXEL).setDepth(5);
        sprite.setRotation((item.id * 1.7) % Math.PI);
        this.litter.set(item.id, sprite);
      }
      sprite.setPosition(p.x, p.y);
    }
    for (const [id, sprite] of this.litter) {
      if (visible.has(id)) continue;
      this.litter.delete(id);
      const item = sim.items.find((i) => i.id === id);
      this.retire(sprite, item);
    }
  }

  /** Feedback as litter leaves the water: snapped into a trap, or lost to the ocean. */
  private retire(sprite: Phaser.GameObjects.Image, item: LitterItem | undefined): void {
    if (item?.state === 'intercepted') {
      this.scene.tweens.add({
        targets: sprite,
        scale: PIXEL * 1.8,
        alpha: 0,
        duration: 260,
        onComplete: () => sprite.destroy(),
      });
    } else {
      this.scene.tweens.add({
        targets: sprite,
        x: sprite.x + 40,
        alpha: 0,
        duration: 500,
        onComplete: () => sprite.destroy(),
      });
    }
  }

  private trapAngle(slot: Slot): number {
    const seg = this.level.segments.find((s) => s.id === slot.segmentId);
    if (!seg || slot.s === undefined) return 0;
    const { tangent } = pointAt(seg, slot.s);
    return Math.atan2(tangent.y, tangent.x) + Math.PI / 2;
  }

  private drawSlots(time: number, dep: Deployment, highlight: EquipmentKind | null): void {
    const g = this.slotFx;
    g.clear();
    const pulse = 0.5 + 0.5 * Math.sin(time / 250);
    for (const slot of this.level.slots) {
      if (dep[slot.id]) continue;
      const active = highlight === slot.kind;
      const alpha = highlight === null ? 0.5 : active ? 0.6 + 0.4 * pulse : 0.15;
      g.lineStyle(active ? 3 : 2, slot.kind === 'trap' ? 0xffffff : PALETTE.cream, alpha);
      if (slot.kind === 'trap') {
        // Show the trap's footprint across the channel, including the uncovered bank margins.
        const seg = this.level.segments.find((s) => s.id === slot.segmentId);
        if (seg && slot.s !== undefined) {
          const cover = slot.coverage ?? 0.8;
          const a = worldPosition(seg, slot.s, -cover);
          const b = worldPosition(seg, slot.s, cover);
          g.lineBetween(a.x, a.y, b.x, b.y);
          g.strokeCircle(slot.pos.x, slot.pos.y, seg.halfWidth + 8);
        }
      } else {
        g.strokeRect(slot.pos.x - 16, slot.pos.y - 18, 32, 36);
      }
    }
  }

  private drawFlow(time: number): void {
    const g = this.flowFx;
    g.clear();
    for (const seg of this.level.segments) {
      const len = segmentLength(seg);
      const spacing = 46;
      const offset = this.still ? 0 : ((time / 1000) * seg.speed) % spacing;
      for (let s = offset; s < len; s += spacing) {
        for (const lateral of [-0.45, 0.35]) {
          const a = worldPosition(seg, s + lateral * 10, lateral);
          const b = worldPosition(seg, s + 10 + lateral * 10, lateral);
          g.lineStyle(2, PALETTE.waterLight, 0.55);
          g.lineBetween(a.x, a.y, b.x, b.y);
        }
        if (this.showFlowArrows && Math.round(s / spacing) % 3 === 0) {
          const { pos, tangent } = pointAt(seg, s);
          const n = { x: -tangent.y, y: tangent.x };
          g.lineStyle(3, 0xffffff, 0.9);
          g.lineBetween(
            pos.x - tangent.x * 8 + n.x * 7,
            pos.y - tangent.y * 8 + n.y * 7,
            pos.x,
            pos.y,
          );
          g.lineBetween(
            pos.x - tangent.x * 8 - n.x * 7,
            pos.y - tangent.y * 8 - n.y * 7,
            pos.x,
            pos.y,
          );
        }
      }
    }
  }

  private paintTerrain(): void {
    const { width, height } = this.scene.scale;
    const mapH = height - TOOLBAR_HEIGHT;
    const g = this.scene.add.graphics().setDepth(0);
    g.fillStyle(PALETTE.grass, 1);
    g.fillRect(0, 0, width, mapH);
    const rng = createRng(this.level.seed);
    for (let i = 0; i < 900; i++) {
      g.fillStyle(rng.next() > 0.5 ? PALETTE.grassDark : PALETTE.grassLight, 1);
      g.fillRect(
        Math.floor(rng.range(0, width / PIXEL)) * PIXEL,
        Math.floor(rng.range(0, mapH / PIXEL)) * PIXEL,
        PIXEL,
        PIXEL,
      );
    }
    // Estuary / ocean on the right edge: where escaped litter ends up.
    g.fillStyle(PALETTE.ocean, 1);
    g.fillRect(width - 70, 0, 70, mapH);
    g.fillStyle(0xe6d6a8, 1);
    g.fillRect(width - 82, 0, 12, mapH);
    // Creek: bank, then water.
    for (const seg of this.level.segments) {
      for (const [color, extra] of [
        [PALETTE.bank, 8],
        [PALETTE.water, 0],
      ] as const) {
        g.lineStyle((seg.halfWidth + extra) * 2, color, 1);
        g.beginPath();
        seg.points.forEach((p, i) => (i === 0 ? g.moveTo(p.x, p.y) : g.lineTo(p.x, p.y)));
        g.strokePath();
        for (const p of seg.points) {
          g.fillStyle(color, 1);
          g.fillCircle(p.x, p.y, seg.halfWidth + extra);
        }
      }
    }
    this.scene.add
      .text(width - 35, mapH / 2, 'TO THE OCEAN', { ...TEXT_STYLES.label, align: 'center' })
      .setOrigin(0.5)
      .setRotation(-Math.PI / 2)
      .setDepth(1);
    // Trees for life and colour.
    for (let i = 0; i < 26; i++) {
      const x = rng.range(20, width - 110);
      const y = rng.range(20, mapH - 20);
      const nearWater = this.level.segments.some((seg) => {
        const len = segmentLength(seg);
        for (let s = 0; s < len; s += 20) {
          const p = pointAt(seg, s).pos;
          if (Math.hypot(p.x - x, p.y - y) < seg.halfWidth + 18) return true;
        }
        return false;
      });
      const nearSource = this.level.sources.some((s) => Math.hypot(s.pos.x - x, s.pos.y - y) < 80);
      if (!nearWater && !nearSource) this.scene.add.image(x, y, 'tree').setScale(PIXEL).setDepth(1);
    }
  }

  private drawSources(): void {
    for (const src of this.level.sources) {
      const { x, y } = src.pos;
      if (src.look === 'houses') {
        for (const [dx, dy] of [
          [-22, -8],
          [10, -14],
          [-6, 14],
          [24, 10],
        ] as const)
          this.scene.add
            .image(x + dx, y + dy, 'house')
            .setScale(PIXEL)
            .setDepth(4);
      } else if (src.look === 'park') {
        for (const [dx, dy] of [
          [-20, -6],
          [0, 8],
          [20, -4],
        ] as const)
          this.scene.add
            .image(x + dx, y + dy, 'tree')
            .setScale(PIXEL)
            .setDepth(4);
        this.scene.add.rectangle(x, y + 22, 50, 6, PALETTE.road).setDepth(3);
      } else {
        this.scene.add.image(x, y, src.look).setScale(PIXEL).setDepth(4);
      }
      this.scene.add
        .text(x, y - 42, src.label, TEXT_STYLES.label)
        .setOrigin(0.5)
        .setDepth(8)
        .setBackgroundColor('#2d2a26aa')
        .setPadding(5, 2, 5, 2);
      // Runoff path: a dotted line from the neighbourhood to where it drains into the creek.
      const seg = this.level.segments.find((s) => s.id === src.entry.segmentId);
      if (!seg) continue;
      const to = pointAt(seg, src.entry.s).pos;
      const g = this.scene.add.graphics().setDepth(1);
      g.fillStyle(PALETTE.road, 0.9);
      const steps = Math.max(1, Math.floor(Math.hypot(to.x - x, to.y - y) / 12));
      for (let i = 1; i < steps; i++)
        g.fillRect(x + ((to.x - x) * i) / steps - 2, y + ((to.y - y) * i) / steps - 2, 4, 4);
    }
  }
}
