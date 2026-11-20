import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { buildingName, buildingRole, term, type View } from '../content/terms';
import type { Building, LevelConfig } from '../levels/types';
import { districtOf, isOpen, isRunning, type CityParams } from '../systems/city';
import type { Layout, Run } from '../systems/run';
import {
  drawBuilding,
  drawCheckpoint,
  drawClosedSign,
  drawDepot,
  drawMachineEnd,
  drawParcel,
  drawTruck,
  shortcutCurve,
} from '../ui/cityArt';
import {
  drawCtcf,
  drawElement,
  drawFiber,
  drawLoader,
  drawPolymerase,
  drawRing,
  SCI,
} from '../ui/scienceArt';
import { TEXT_STYLES } from '../ui/text';

export interface Parcel {
  curve: Phaser.Curves.CubicBezier;
  t: number;
  resource: Building['resource'];
}

export interface RoadState {
  layout: Layout;
  run: Run | null;
  cityParams: CityParams;
  cursor: number | null;
  parcels: Parcel[];
  flashes: Map<string, number>;
}

export interface RoadViewOptions {
  x0: number;
  x1: number;
  roadY: number;
  /** Tallest a shortcut arch may rise above the road. */
  maxRise: number;
  /** Top of the city area (district tints start here). */
  top: number;
  /** Bottom of the city area. */
  bottom: number;
}

// Draws one level's road, buildings, equipment and machines, in either the city view or the
// science view. It only reads simulation state; it never changes it. Everything lives in one
// container so a scene can fade or swap views as a whole.
export class RoadView {
  readonly root: Phaser.GameObjects.Container;
  private readonly dyn: Phaser.GameObjects.Graphics;
  private readonly cursorGfx: Phaser.GameObjects.Graphics;
  private readonly labels = new Map<string, Phaser.GameObjects.Text>();
  private readonly roadTop: number;
  private readonly buildingY: number;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly level: LevelConfig,
    readonly view: View,
    private readonly o: RoadViewOptions,
  ) {
    this.roadTop = o.roadY - 18;
    this.buildingY = o.roadY + 70;
    this.root = scene.add.container(0, 0);
    this.buildStatic();
    this.dyn = scene.add.graphics();
    this.cursorGfx = scene.add.graphics();
    this.root.add([this.dyn, this.cursorGfx]);
    // labels sit on top of the drawings
    for (const l of this.labels.values()) this.root.bringToTop(l);
  }

  binW(): number {
    return (this.o.x1 - this.o.x0) / this.level.bins;
  }

  binX(bin: number): number {
    return this.o.x0 + (bin + 0.5) * this.binW();
  }

  binAt(x: number): number {
    return Phaser.Math.Clamp(Math.floor((x - this.o.x0) / this.binW()), 0, this.level.bins - 1);
  }

  curve(left: number, right: number): Phaser.Curves.CubicBezier {
    return shortcutCurve(this.binX(left), this.binX(right), this.roadTop - 2, this.o.maxRise);
  }

  destroy(): void {
    this.root.destroy(true);
  }

  private get science(): boolean {
    return this.view === 'science';
  }

  private buildStatic(): void {
    const { scene, level, o } = this;
    const width = scene.scale.width;
    const g = scene.add.graphics();
    this.root.add(g);
    const science = this.science;

    if (science) g.fillStyle(SCI.bg, 1).fillRect(0, o.top - 10, width, o.bottom - o.top + 20);

    // districts / domains as tinted bands, each labelled
    level.districts.forEach((d, i) => {
      const left = o.x0 + d.from * this.binW();
      const right = o.x0 + (d.to + 1) * this.binW();
      const color = science
        ? i % 2
          ? 0x2f3550
          : 0x3a2f50
        : d.id === 'old-town'
          ? PALETTE.oldTown
          : PALETTE.works;
      g.fillStyle(color, 1).fillRect(left, o.top, right - left, o.bottom - o.top);
      const name = science ? `DOMAIN ${i + 1}` : d.name.toUpperCase();
      this.root.add(
        scene.add
          .text((left + right) / 2, o.top + 12, name, {
            ...TEXT_STYLES.small,
            fontStyle: 'bold',
            color: science ? SCI.textDim : PALETTE.textDim,
          })
          .setOrigin(0.5, 0),
      );
      if (i > 0) {
        g.lineStyle(2, science ? 0x6b6390 : 0x8d8578, 1);
        for (let y = o.top + 4; y < o.bottom - 4; y += 16) g.lineBetween(left, y, left, y + 8);
      }
    });

    if (science) {
      drawFiber(g, o.x0, o.x1, o.roadY, level.bins);
    } else {
      g.fillStyle(PALETTE.sage, 1).fillRect(0, o.roadY + 18, width, o.bottom - o.roadY - 18);
      g.fillStyle(PALETTE.road, 1).fillRect(o.x0 - 20, o.roadY - 18, o.x1 - o.x0 + 40, 36);
      g.lineStyle(2, PALETTE.roadLine, 0.8);
      for (let x = o.x0; x < o.x1; x += 28) g.lineBetween(x, o.roadY, x + 14, o.roadY);
      g.lineStyle(1, 0x4c4944, 1);
      for (let i = 0; i <= level.bins; i++) {
        const x = o.x0 + i * this.binW();
        g.lineBetween(x, o.roadY + 12, x, o.roadY + 18);
      }
      g.fillStyle(PALETTE.ink, 1)
        .fillRect(o.x0 - 24, o.roadY - 22, 6, 44)
        .fillRect(o.x1 + 18, o.roadY - 22, 6, 44);
    }

    // delivery routes: a dashed band along the road with arrows showing the way trucks drive
    for (const r of level.routes ?? []) {
      const dir = r.to >= r.from ? 1 : -1;
      const a = this.binX(Math.min(r.from, r.to));
      const b = this.binX(Math.max(r.from, r.to));
      const y = o.roadY + 26;
      g.lineStyle(3, science ? SCI.pol : PALETTE.water, 0.9);
      for (let x = a; x < b; x += 18) g.lineBetween(x, y, Math.min(x + 10, b), y);
      g.fillStyle(science ? SCI.pol : PALETTE.water, 1);
      for (let x = a + 30; x < b; x += 90) {
        if (dir === 1) g.fillTriangle(x, y - 6, x, y + 6, x + 10, y);
        else g.fillTriangle(x, y - 6, x, y + 6, x - 10, y);
      }
    }

    for (const b of level.buildings) {
      const label = scene.add
        .text(this.binX(b.bin), this.buildingY + 34, '', {
          ...TEXT_STYLES.small,
          fontSize: '15px',
          align: 'center',
          color: science ? SCI.text : PALETTE.text,
          backgroundColor: science ? '#2a2740' : '#f7f1e4',
          padding: { x: 4, y: 1 },
        })
        .setOrigin(0.5, 0);
      this.labels.set(b.id, label);
      this.root.add(label);
    }
  }

  draw(s: RoadState): void {
    const g = this.dyn;
    const science = this.science;
    g.clear();
    const time = s.run?.city.time ?? 0;

    // buildings
    for (const b of this.level.buildings) {
      const open = isOpen(b, time) || (!s.run && b.active);
      const on =
        b.role === 'supplier'
          ? open
          : s.run !== null && open && isRunning(s.run.city, b.id, s.cityParams);
      const x = this.binX(b.bin);
      if (science) {
        drawElement(g, b, x, this.buildingY, on, b.active);
      } else {
        g.fillStyle(PALETTE.creamDark, 1).fillRect(x - 5, this.o.roadY + 18, 10, 10);
        drawBuilding(g, b.kind, x, this.buildingY, on);
        if (!b.active) drawClosedSign(g, x, this.buildingY);
      }
      const flash = s.flashes.get(b.id) ?? 0;
      if (flash > 0)
        g.lineStyle(3, science ? SCI.loop : PALETTE.gold, flash).strokeCircle(
          x,
          this.buildingY - 4,
          44,
        );
      this.labels.get(b.id)?.setText(`${buildingName(b, this.view)}\n${this.status(b, s)}`);
    }

    const machines = s.run?.engine.machines ?? [];
    for (const m of machines) {
      if (m.left === m.right) continue;
      const points = this.curve(m.left, m.right).getPoints(48);
      const dl = districtOf(this.level, m.left);
      const dr = districtOf(this.level, m.right);
      if (dl !== null && dr !== null && dl !== dr) {
        // crossing a boundary: dashed, so it reads without colour too
        g.lineStyle(4, science ? 0xe07a9a : PALETTE.terracottaDark, 1);
        for (let i = 0; i + 2 < points.length; i += 4) g.strokePoints(points.slice(i, i + 3));
      } else if (science) {
        g.lineStyle(6, SCI.loopDark, 0.9).strokePoints(points);
        g.lineStyle(3, SCI.loop, 1).strokePoints(points);
      } else {
        g.lineStyle(8, PALETTE.goldDark, 0.9).strokePoints(points);
        g.lineStyle(4, PALETTE.gold, 1).strokePoints(points);
      }
    }

    const fixedDepots = new Set(this.level.fixedDepots);
    for (const bin of [...this.level.fixedDepots, ...s.layout.depots]) {
      if (science) drawLoader(g, this.binX(bin), this.roadTop, fixedDepots.has(bin));
      else drawDepot(g, this.binX(bin), this.roadTop, fixedDepots.has(bin));
    }
    const fixedCps = new Set(this.level.fixedCheckpoints);
    for (const c of [...this.level.fixedCheckpoints, ...s.layout.checkpoints]) {
      if (science) drawCtcf(g, this.binX(c.bin), this.roadTop, c.facing, fixedCps.has(c));
      else drawCheckpoint(g, this.binX(c.bin), this.roadTop, c.facing, fixedCps.has(c));
    }

    for (const v of s.run?.engine.vehicles ?? []) {
      if (science) drawPolymerase(g, this.binX(v.pos), this.o.roadY + 30, v.dir);
      else drawTruck(g, this.binX(v.pos), this.o.roadY + 30, v.dir);
    }

    for (const m of machines) {
      for (const side of ['left', 'right'] as const) {
        if (side === 'right' && m.right === m.left) continue;
        const held = side === 'left' ? m.leftStalled : m.rightStalled;
        if (science) drawRing(g, this.binX(m[side]), this.o.roadY, held);
        else drawMachineEnd(g, this.binX(m[side]), this.o.roadY - 2, held);
      }
    }
    for (const p of s.parcels) {
      const pt = p.curve.getPoint(p.t);
      if (science) g.fillStyle(SCI.loop, 1).fillCircle(pt.x, pt.y, 5);
      else drawParcel(g, pt.x, pt.y, p.resource);
    }

    const cg = this.cursorGfx;
    cg.clear();
    if (s.cursor !== null) {
      const x = this.o.x0 + s.cursor * this.binW();
      const ink = science ? 0xffffff : PALETTE.ink;
      cg.fillStyle(science ? SCI.cohesin : PALETTE.gold, 0.25).fillRect(
        x,
        this.o.roadY - 70,
        this.binW(),
        96,
      );
      cg.lineStyle(3, ink, 1).strokeRect(x + 1, this.o.roadY - 70, this.binW() - 2, 96);
    }
  }

  private status(b: Building, s: RoadState): string {
    const v = this.view;
    if (!b.active) return term('closed', v);
    const time = s.run?.city.time ?? 0;
    if (b.activeFrom !== undefined && time < b.activeFrom)
      return v === 'city' ? `opens at ${b.activeFrom}s` : `induced at ${b.activeFrom}s`;
    if (b.role === 'supplier' || !s.run) return buildingRole(b, v);
    return isRunning(s.run.city, b.id, s.cityParams) ? term('running', v) : term('waiting', v);
  }
}
