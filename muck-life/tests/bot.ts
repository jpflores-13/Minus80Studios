import type { SessionConfig } from '../src/levels/types';
import { DEFAULT_SETTINGS, Session, type SessionSettings } from '../src/systems/session';

/**
 * A simple autoplayer: every `reactionSec` it documents one observable region (preferring lateral
 * plumes and rhizome apices when the level asks for them), and places ROIs near growing tips.
 * It is deliberately unremarkable — a level a bot at human reaction speed can't finish is too hard.
 */
export function autoplay(
  cfg: SessionConfig,
  opts: { reactionSec?: number; settings?: SessionSettings; maxSec?: number } = {},
): Session {
  const s = new Session(cfg, opts.settings ?? DEFAULT_SETTINGS);
  const reaction = opts.reactionSec ?? 0.7;
  const dt = 1 / 30;
  let next = reaction;
  let roiTimer = 3;
  const maxSec = opts.maxSec ?? 400;
  while (!s.finished && s.gameSec < maxSec) {
    s.update(dt);
    if (s.gameSec >= next) {
      next = s.gameSec + reaction;
      const wanted = new Set(cfg.objectives.map((o) => o.kind));
      const regions = s.observableRegions();
      regions.sort((a, b) => priority(b.kind) - priority(a.kind));
      function priority(k: string): number {
        if (k === 'lateral' && wanted.has('lateral')) return 2;
        if (k === 'apex' && wanted.has('apex')) return 2;
        return 0;
      }
      const r = regions[0];
      if (r) s.click(r.x, r.y);
    }
    if (cfg.features.roi && s.gameSec >= roiTimer) {
      roiTimer = s.gameSec + 8;
      const tips = s.plant.segments.filter((g) => g.growing && g.organ === 'adventitious');
      const g = tips[Math.floor(s.gameSec) % Math.max(1, tips.length)];
      if (g) {
        const tip = g.points[g.points.length - 1]!;
        s.placeRoi(tip.x + Math.cos(g.heading) * 40, tip.y + Math.sin(g.heading) * 40);
      }
    }
  }
  return s;
}
