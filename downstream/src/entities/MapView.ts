import Phaser from 'phaser';
import { PALETTE, PIXEL, TOOLBAR_HEIGHT } from '../config/gameConfig';
import { progress } from '../config/progress';
import { TUNING } from '../config/tuning';
import type { EquipmentKind, Hotspot, LevelConfig, PollutionSource, Slot } from '../levels/types';
import type { Deployment, Orientations } from '../systems/equipment';
import type { Track } from '../systems/gps';
import { pointAt, segmentLength, worldPosition, type Segment } from '../systems/network';
import type { SimState } from '../systems/sim';
import type { Conditions } from '../systems/weather';
import { TEXT_STYLES } from '../ui/text';
import { createRng } from '../utils/rng';

const SOURCE_SPRITES: Record<PollutionSource['look'], string> = {
  houses: 'house',
  store: 'store',
  school: 'school',
  park: 'tree',
  apartments: 'apartments',
  lot: 'lot',
  market: 'market',
};

interface TrackView {
  track: Track;
  shownUntil: number; // seconds of the track revealed so far
  bottle: Phaser.GameObjects.Image;
}

// Everything drawn on the map: terrain, water, buildings, equipment, litter, GPS trails, rain.
export class MapView {
  showFlowArrows = false;
  showTrails = true;
  // Show 'tap to flip' on booms while the player can still change them.
  boomHints = false;

  private readonly water: Phaser.GameObjects.Graphics;
  private readonly overlay: Phaser.GameObjects.Graphics;
  private readonly trails: Phaser.GameObjects.Graphics;
  private readonly rainFx: Phaser.GameObjects.Graphics;
  private readonly rainShade: Phaser.GameObjects.Rectangle;
  private readonly equipment = new Map<
    string,
    { sprite: Phaser.GameObjects.Image; label?: Phaser.GameObjects.Text }
  >();
  private readonly litter = new Map<
    number,
    { sprite: Phaser.GameObjects.Image; wasOnLand: boolean; moving: boolean }
  >();
  private readonly hotspotLabels = new Map<string, Phaser.GameObjects.Text>();
  private readonly tracks: TrackView[] = [];
  private readonly segs: Map<string, Segment>;
  private rainDrops: { x: number; y: number }[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly level: LevelConfig,
  ) {
    this.segs = new Map(level.segments.map((s) => [s.id, s]));
    this.paintTerrain();
    this.drawHotspots();
    this.water = scene.add.graphics().setDepth(2);
    this.overlay = scene.add.graphics().setDepth(3);
    this.trails = scene.add.graphics().setDepth(7);
    this.drawSources();
    const mapH = scene.scale.height - TOOLBAR_HEIGHT;
    this.rainShade = scene.add
      .rectangle(0, 0, scene.scale.width, mapH, 0x1c2a3a, 0)
      .setOrigin(0)
      .setDepth(30);
    this.rainFx = scene.add.graphics().setDepth(31);
    const rng = createRng(7);
    for (let i = 0; i < 160; i++)
      this.rainDrops.push({ x: rng.range(0, scene.scale.width), y: rng.range(0, mapH) });
  }

  slotAt(x: number, y: number, radius = 44): Slot | undefined {
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

  sourceAt(x: number, y: number): PollutionSource | undefined {
    // Generous: anywhere on the buildings or their name label counts.
    return this.level.sources.find((s) => Math.hypot(s.pos.x - x, s.pos.y - y) < 70);
  }

  hotspotAt(x: number, y: number): Hotspot | undefined {
    return this.level.hotspots.find((h) => {
      const p = this.hotspotCenter(h);
      return Math.hypot(p.x - x, p.y - y) < 60;
    });
  }

  addTrack(track: Track): void {
    const src = this.level.sources.find((s) => s.id === track.sourceId);
    const start = track.points[0]?.pos ?? src?.pos ?? { x: 0, y: 0 };
    const bottle = this.scene.add.image(start.x, start.y, 'gps').setScale(PIXEL).setDepth(9);
    this.tracks.push({ track, shownUntil: 0, bottle });
  }

  // Rebuild equipment sprites from the deployment. Cheap; call after any change.
  syncEquipment(dep: Deployment, orient: Orientations): void {
    for (const [slotId, view] of this.equipment) {
      if (dep[slotId]) continue;
      view.sprite.destroy();
      view.label?.destroy();
      this.equipment.delete(slotId);
    }
    for (const [slotId, kind] of Object.entries(dep)) {
      const slot = this.level.slots.find((s) => s.id === slotId);
      if (!slot) continue;
      const existing = this.equipment.get(slotId);
      if (existing) {
        if (kind === 'boom') existing.sprite.setRotation(this.boomAngle(slot, orient));
        continue;
      }
      const pos = kind === 'trap' ? this.trapCenter(slot) : slot.pos;
      const sprite = this.scene.add.image(pos.x, pos.y, kind).setScale(PIXEL).setDepth(6);
      if (kind === 'trap') {
        sprite.setRotation(this.channelAngle(slot) + Math.PI / 2);
        const seg = this.segs.get(slot.segmentId ?? '');
        if (seg) sprite.setDisplaySize((slot.coverage ?? 0.8) * 2 * seg.halfWidth + 8, 6 * PIXEL);
      }
      if (kind === 'boom') sprite.setRotation(this.boomAngle(slot, orient));
      let label: Phaser.GameObjects.Text | undefined;
      if (kind === 'trap' || kind === 'filter' || kind === 'boom') {
        label = this.scene.add
          .text(pos.x, pos.y - 30, '', TEXT_STYLES.label)
          .setOrigin(0.5)
          .setDepth(8)
          .setBackgroundColor('#2d2a26cc')
          .setPadding(4, 2, 4, 2);
        if (kind === 'boom') label.setText('tap to flip ↻').setBackgroundColor('#6b5a1ecc');
      }
      this.scene.tweens.add({
        targets: sprite,
        scale: { from: sprite.scale * 1.4, to: sprite.scale },
        duration: 180,
      });
      this.equipment.set(slotId, label ? { sprite, label } : { sprite });
    }
  }

  update(
    time: number,
    dt: number,
    dep: Deployment,
    orient: Orientations,
    highlight: EquipmentKind | null,
    sim?: SimState,
    conditions: Conditions = 'dry',
  ): void {
    const reduced = progress().reducedEffects;
    this.drawWater(reduced ? 0 : time);
    this.drawSlots(time, dep, orient, highlight);
    this.drawTrails(dt);
    this.drawRain(dt, conditions, reduced);
    if (!sim) {
      for (const [slotId, view] of this.equipment) {
        const kind = dep[slotId];
        if (kind === 'boom') continue;
        const cap = kind === 'filter' ? TUNING.filter.capacity : TUNING.trap.capacity;
        view.label?.setText(`0/${cap}`);
      }
      return;
    }
    for (const c of sim.containers) {
      const label = this.equipment.get(c.slotId)?.label;
      const full = c.count >= c.capacity;
      label?.setText(full ? `FULL ${c.count}/${c.capacity}` : `${c.count}/${c.capacity}`);
      label?.setBackgroundColor(full ? '#b5452bdd' : '#2d2a26cc');
    }
    for (const h of this.level.hotspots) {
      const n = sim.items.filter((i) => i.state === 'retained' && i.holder === h.id).length;
      this.hotspotLabels.get(h.id)?.setText(n > 0 ? `${h.label}: ${n} stuck` : h.label);
    }
    this.drawLitter(sim);
  }

  // Short-lived feedback when a cleanup crew works a spot.
  showCrew(x: number, y: number): void {
    const crew = this.scene.add
      .image(x, y - 10, 'crew')
      .setScale(PIXEL)
      .setDepth(40);
    this.scene.tweens.add({
      targets: crew,
      y: y - 30,
      alpha: 0,
      duration: 1400,
      onComplete: () => crew.destroy(),
    });
  }

  containerPosition(slotId: string): { x: number; y: number } {
    const slot = this.level.slots.find((s) => s.id === slotId);
    if (!slot) return { x: 0, y: 0 };
    return slot.kind === 'trap' ? this.trapCenter(slot) : slot.pos;
  }

  hotspotCenter(h: Hotspot): { x: number; y: number } {
    const seg = this.segs.get(h.segmentId);
    return seg ? worldPosition(seg, (h.sFrom + h.sTo) / 2, h.side * 1.4) : { x: 0, y: 0 };
  }

  private trapCenter(slot: Slot): { x: number; y: number } {
    const seg = this.segs.get(slot.segmentId ?? '');
    return seg && slot.s !== undefined ? worldPosition(seg, slot.s, slot.offset ?? 0) : slot.pos;
  }

  private channelAngle(slot: Slot): number {
    const seg = this.segs.get(slot.segmentId ?? '');
    if (!seg || slot.s === undefined) return 0;
    const { tangent } = pointAt(seg, slot.s);
    return Math.atan2(tangent.y, tangent.x);
  }

  // A boom lies diagonally, angled toward the bank it pushes litter to.
  private boomAngle(slot: Slot, orient: Orientations): number {
    return this.channelAngle(slot) + (orient[slot.id] ?? 1) * 0.6;
  }

  private drawLitter(sim: SimState): void {
    const visible = new Set<number>();
    for (const item of sim.items) {
      let p: { x: number; y: number };
      if (item.state === 'onLand') {
        // Litter waiting on the streets near where it was dropped.
        const src = this.level.sources.find((x) => x.id === item.sourceId);
        if (!src) continue;
        p = this.landSpot(src, item.id);
      } else if (item.state === 'floating' || item.state === 'retained') {
        const seg = sim.segments.get(item.segmentId);
        if (!seg) continue;
        const lateral =
          item.state === 'retained' ? Math.sign(item.lateral || 1) * 1.1 : item.lateral;
        p = worldPosition(seg, item.s, lateral);
      } else {
        continue;
      }
      visible.add(item.id);
      let view = this.litter.get(item.id);
      if (!view) {
        const sprite = this.scene.add.image(p.x, p.y, item.category).setScale(PIXEL).setDepth(5);
        sprite.setRotation((item.id * 1.7) % Math.PI);
        view = { sprite, wasOnLand: item.state === 'onLand', moving: false };
        this.litter.set(item.id, view);
      }
      if (view.wasOnLand && item.state !== 'onLand') {
        // Washed off the street: slide it into the water so the rain's effect is visible.
        view.wasOnLand = false;
        view.moving = true;
        this.scene.tweens.add({
          targets: view.sprite,
          x: p.x,
          y: p.y,
          duration: 600,
          ease: 'Sine.easeIn',
          onComplete: () => view && (view.moving = false),
        });
      }
      if (!view.moving) view.sprite.setPosition(p.x, p.y);
      view.sprite.setAlpha(item.state === 'retained' ? 0.7 : 1);
    }
    for (const [id, view] of this.litter) {
      if (visible.has(id)) continue;
      this.litter.delete(id);
      const item = sim.items.find((i) => i.id === id);
      const caught = item?.state === 'intercepted' || item?.state === 'removed';
      this.scene.tweens.add({
        targets: view.sprite,
        scale: caught ? PIXEL * 1.8 : PIXEL,
        x: caught ? view.sprite.x : view.sprite.x + 40,
        alpha: 0,
        duration: caught ? 260 : 500,
        onComplete: () => view.sprite.destroy(),
      });
    }
  }

  // A stable spot on the ground around a neighbourhood for a piece of waiting litter.
  private landSpot(src: PollutionSource, id: number): { x: number; y: number } {
    const angle = (id * 2.399) % (Math.PI * 2);
    const r = 30 + ((id * 37) % 28);
    return { x: src.pos.x + Math.cos(angle) * r, y: src.pos.y + 18 + Math.sin(angle) * r * 0.6 };
  }

  private drawSlots(
    time: number,
    dep: Deployment,
    orient: Orientations,
    highlight: EquipmentKind | null,
  ): void {
    const g = this.overlay;
    g.clear();
    const pulse = 0.5 + 0.5 * Math.sin(time / 250);
    for (const slot of this.level.slots) {
      if (dep[slot.id]) continue;
      const active = highlight === slot.kind;
      const alpha = highlight === null ? 0.45 : active ? 0.6 + 0.4 * pulse : 0.12;
      g.lineStyle(
        active ? 3 : 2,
        slot.kind === 'bin' || slot.kind === 'filter' ? PALETTE.cream : 0xffffff,
        alpha,
      );
      const seg = this.segs.get(slot.segmentId ?? '');
      if (slot.kind === 'trap' && seg && slot.s !== undefined) {
        // the part of the channel this trap would span
        const off = slot.offset ?? 0;
        const cov = slot.coverage ?? 0.8;
        const a = worldPosition(seg, slot.s, off - cov);
        const b = worldPosition(seg, slot.s, off + cov);
        g.lineBetween(a.x, a.y, b.x, b.y);
        g.strokeCircle(slot.pos.x, slot.pos.y, seg.halfWidth + 8);
      } else if (slot.kind === 'boom' && seg && slot.s !== undefined) {
        const a = worldPosition(seg, slot.s - 14, -1);
        const b = worldPosition(seg, slot.s + 14, 1);
        g.lineBetween(a.x, a.y, b.x, b.y);
        g.strokeCircle(slot.pos.x, slot.pos.y, seg.halfWidth + 6);
      } else if (slot.kind === 'filter') {
        g.strokeRect(slot.pos.x - 18, slot.pos.y - 14, 36, 28);
        g.lineBetween(slot.pos.x - 10, slot.pos.y, slot.pos.x + 10, slot.pos.y);
      } else {
        g.strokeRect(slot.pos.x - 16, slot.pos.y - 18, 32, 36);
      }
    }
    // Each placed boom: yellow dots stream past it and curve toward the bank it pushes
    // litter to, ending in a big arrowhead, so the direction is obvious at a glance.
    for (const [slotId, kind] of Object.entries(dep)) {
      if (kind !== 'boom') continue;
      const slot = this.level.slots.find((s) => s.id === slotId);
      const seg = this.segs.get(slot?.segmentId ?? '');
      if (!slot || !seg || slot.s === undefined) continue;
      const side = orient[slotId] ?? 1;
      const path = (t: number, start: number) => {
        // t from 0 (upstream of the boom) to 1 (just past it, near the target bank)
        const lateral = start + (side * 0.8 - start) * Math.min(1, Math.max(0, (t - 0.35) / 0.5));
        return worldPosition(seg, slot.s! - 40 + t * 90, lateral);
      };
      g.fillStyle(0xf2c94c, 0.95);
      for (const start of [-0.5, 0, 0.5]) {
        for (let k = 0; k < 3; k++) {
          const t = (((time / 1400 + k / 3 + start) % 1) + 1) % 1;
          const pt = path(t, start);
          g.fillCircle(pt.x, pt.y, 2.5);
        }
      }
      const tip = worldPosition(seg, slot.s + 52, side * 0.85);
      const back = worldPosition(seg, slot.s + 36, side * 0.55);
      const dx = tip.x - back.x;
      const dy = tip.y - back.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      g.lineStyle(4, 0xf2c94c, 1);
      g.lineBetween(back.x, back.y, tip.x, tip.y);
      g.fillTriangle(
        tip.x + (dx / len) * 6,
        tip.y + (dy / len) * 6,
        tip.x + nx * 7,
        tip.y + ny * 7,
        tip.x - nx * 7,
        tip.y - ny * 7,
      );
      const label = this.equipment.get(slotId)?.label;
      label?.setPosition(slot.pos.x, slot.pos.y - 34).setVisible(this.boomHints);
    }
  }

  private drawTrails(dt: number): void {
    const g = this.trails;
    g.clear();
    if (!this.showTrails) {
      for (const t of this.tracks) t.bottle.setVisible(false);
      return;
    }
    for (const view of this.tracks) {
      view.shownUntil = Math.min(
        view.track.seconds,
        view.shownUntil + dt * TUNING.gps.playbackSpeed,
      );
      const pts = view.track.points.filter((p) => p.t <= view.shownUntil);
      g.lineStyle(3, PALETTE.gpsPink, 0.85);
      g.beginPath();
      pts.forEach((p, i) => (i === 0 ? g.moveTo(p.pos.x, p.pos.y) : g.lineTo(p.pos.x, p.pos.y)));
      g.strokePath();
      for (const stop of view.track.stops) {
        g.lineStyle(2, PALETTE.gpsPink, 1);
        g.strokeCircle(stop.pos.x, stop.pos.y, 10);
      }
      const last = pts.at(-1);
      if (last) view.bottle.setPosition(last.pos.x, last.pos.y).setVisible(true);
    }
  }

  private drawRain(dt: number, conditions: Conditions, reduced: boolean): void {
    const g = this.rainFx;
    g.clear();
    const level = { dry: 0, light: 1, moderate: 2, heavy: 3 }[conditions];
    this.rainShade.setFillStyle(0x1c2a3a, level * 0.08);
    if (level === 0) return;
    const mapH = this.scene.scale.height - TOOLBAR_HEIGHT;
    const count = level * 50;
    g.lineStyle(1, 0xcfe3f0, 0.5);
    for (let i = 0; i < count; i++) {
      const d = this.rainDrops[i]!;
      if (!reduced) {
        d.y += 500 * dt;
        d.x += 60 * dt;
        if (d.y > mapH) d.y -= mapH;
        if (d.x > this.scene.scale.width) d.x -= this.scene.scale.width;
      }
      g.lineBetween(d.x, d.y, d.x + 3, d.y + 10);
    }
  }

  private drawWater(time: number): void {
    const g = this.water;
    g.clear();
    for (const seg of this.level.segments) {
      const len = segmentLength(seg);
      const spacing = 46;
      const offset = ((time / 1000) * seg.speed) % spacing;
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
    g.fillStyle(PALETTE.ocean, 1);
    g.fillRect(width - 70, 0, 70, mapH);
    g.fillStyle(0xe6d6a8, 1);
    g.fillRect(width - 82, 0, 12, mapH);
    for (const [color, extra] of [
      [PALETTE.bank, 8],
      [PALETTE.water, 0],
    ] as const) {
      for (const seg of this.level.segments) {
        g.lineStyle((seg.halfWidth + extra) * 2, color, 1);
        g.beginPath();
        seg.points.forEach((p, i) => (i === 0 ? g.moveTo(p.x, p.y) : g.lineTo(p.x, p.y)));
        g.strokePath();
        g.fillStyle(color, 1);
        for (const p of seg.points) g.fillCircle(p.x, p.y, seg.halfWidth + extra);
      }
    }
    this.scene.add
      .text(width - 35, mapH / 2, 'TO THE OCEAN', TEXT_STYLES.label)
      .setOrigin(0.5)
      .setRotation(-Math.PI / 2)
      .setDepth(1);
    for (let i = 0; i < 30; i++) {
      const x = rng.range(20, width - 110);
      const y = rng.range(80, mapH - 20);
      if (
        this.nearWater(x, y, 20) ||
        this.level.sources.some((s) => Math.hypot(s.pos.x - x, s.pos.y - y) < 90)
      )
        continue;
      if (this.level.slots.some((s) => Math.hypot(s.pos.x - x, s.pos.y - y) < 40)) continue;
      this.scene.add.image(x, y, 'tree').setScale(PIXEL).setDepth(1);
    }
  }

  private nearWater(x: number, y: number, margin: number): boolean {
    return this.level.segments.some((seg) => {
      const len = segmentLength(seg);
      for (let s = 0; s < len; s += 20) {
        const p = pointAt(seg, s).pos;
        if (Math.hypot(p.x - x, p.y - y) < seg.halfWidth + margin) return true;
      }
      return false;
    });
  }

  private drawHotspots(): void {
    for (const h of this.level.hotspots) {
      const seg = this.segs.get(h.segmentId);
      if (!seg) continue;
      for (let s = h.sFrom; s <= h.sTo; s += 36) {
        const p = worldPosition(seg, s, h.side * 0.9);
        const sprite = this.scene.add
          .image(p.x, p.y, h.look === 'log' ? 'log' : 'reeds')
          .setScale(PIXEL)
          .setDepth(4);
        sprite.setRotation(Math.atan2(pointAt(seg, s).tangent.y, pointAt(seg, s).tangent.x));
        if (h.look === 'log') break;
      }
      const c = this.hotspotCenter(h);
      this.hotspotLabels.set(
        h.id,
        this.scene.add
          .text(c.x, c.y, h.label, { ...TEXT_STYLES.label, fontSize: '13px' })
          .setOrigin(0.5)
          .setDepth(8)
          .setBackgroundColor('#4f3a22cc')
          .setPadding(4, 2, 4, 2),
      );
    }
  }

  private drawSources(): void {
    for (const src of this.level.sources) {
      const { x, y } = src.pos;
      const key = SOURCE_SPRITES[src.look];
      if (src.look === 'houses' || src.look === 'park') {
        const spots =
          src.look === 'houses'
            ? [
                [-22, -8],
                [10, -14],
                [-6, 14],
                [24, 10],
              ]
            : [
                [-20, -6],
                [0, 8],
                [20, -4],
              ];
        for (const [dx, dy] of spots)
          this.scene.add
            .image(x + dx!, y + dy!, key)
            .setScale(PIXEL)
            .setDepth(4);
      } else {
        this.scene.add.image(x, y, key).setScale(PIXEL).setDepth(4);
      }
      this.scene.add
        .text(x, y - 44, src.label, TEXT_STYLES.label)
        .setOrigin(0.5)
        .setDepth(8)
        .setBackgroundColor('#2d2a26aa')
        .setPadding(5, 2, 5, 2);
      // dotted runoff path down to where it drains into the water
      const seg = this.segs.get(src.entry.segmentId);
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
