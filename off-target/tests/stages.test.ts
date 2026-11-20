import { describe, expect, it } from 'vitest';
import { HEROES } from '../src/content/characters';
import { STAGES } from '../src/levels';
import { parseMap, tileAt, type TileMap } from '../src/systems/tilemap';

// A rough walker: from the start, which tiles can the hero stand on, using walking, falling,
// jumps of up to two tiles high and four across, ladders, and vesicle bounces? Gates and doors
// count as passable (they open). It is generous, but it catches walls you can't get past.
function reachable(map: TileMap): Set<string> {
  const pass = (x: number, y: number) => {
    const t = tileAt(map, x, y);
    return t === 'empty' || t === 'goo' || t === 'ladder' || t === 'gate' || t === 'door';
  };
  const support = (x: number, y: number) => {
    const t = tileAt(map, x, y);
    return t === 'solid' || t === 'ledge' || t === 'ladder' || t === 'spikes' || t === 'bouncer';
  };
  const stand = (x: number, y: number) =>
    pass(x, y) && (support(x, y + 1) || tileAt(map, x, y) === 'ladder');
  const key = (x: number, y: number) => `${x},${y}`;
  const start = map.spawns.find((s) => s.kind === 'start')!;
  const seen = new Set<string>([key(start.tx, start.ty)]);
  const queue: [number, number][] = [[start.tx, start.ty]];
  const visit = (x: number, y: number) => {
    if (x < 0 || x >= map.width || y < 0 || y >= map.height) return;
    if (!stand(x, y) || seen.has(key(x, y))) return;
    seen.add(key(x, y));
    queue.push([x, y]);
  };
  const fallFrom = (x: number, y: number) => {
    let yy = y;
    while (yy < map.height - 1 && pass(x, yy) && !stand(x, yy)) yy++;
    visit(x, yy);
  };
  while (queue.length) {
    const [x, y] = queue.shift()!;
    const onLadder = tileAt(map, x, y) === 'ladder';
    for (const dx of [-1, 1]) if (pass(x + dx, y)) fallFrom(x + dx, y);
    if (onLadder || tileAt(map, x, y + 1) === 'ladder') {
      if (pass(x, y - 1)) visit(x, y - 1);
      if (tileAt(map, x, y + 1) === 'ladder') visit(x, y + 1);
      if (tileAt(map, x, y - 1) !== 'ladder' && onLadder) visit(x, y - 1);
    }
    const up = tileAt(map, x, y + 1) === 'bouncer' ? 5 : 2;
    for (let dy = -up; dy <= 0; dy++)
      for (let dx = -4; dx <= 4; dx++) {
        const tx = x + dx;
        const ty = y + dy;
        if (!stand(tx, ty)) continue;
        const top = Math.min(y, ty);
        let clear = true;
        for (let c = Math.min(x, tx); c <= Math.max(x, tx) && clear; c++)
          for (let r = top - 1; r <= top; r++)
            if (!pass(c, r) && !(c === x && r === y)) clear = false;
        for (let r = ty; r <= y && clear; r++) if (!pass(x, r)) clear = false;
        if (clear) visit(tx, ty);
      }
  }
  return seen;
}

describe.each(STAGES)('$name', (stage) => {
  const map = parseMap(stage.map);

  it('is well formed', () => {
    expect(new Set(stage.map.map((r) => r.length)).size).toBe(1);
    expect(map.spawns.filter((s) => s.kind === 'start')).toHaveLength(1);
    expect(map.spawns.filter((s) => s.kind === 'boss')).toHaveLength(stage.bosses.length);
    expect(stage.bosses.some((b) => b.role === 'off-target')).toBe(true);
    if (map.tiles.includes('door')) expect(map.spawns.some((s) => s.kind === 'key')).toBe(true);
    const [one, two, three] = stage.stars;
    expect(one < two && two < three).toBe(true);
  });

  it('every boss, key and checkpoint can be reached from the start', () => {
    const seen = reachable(map);
    const near = (tx: number, ty: number) =>
      [...seen].some((k) => {
        const [x, y] = k.split(',').map(Number) as [number, number];
        return Math.abs(x - tx) <= 2 && Math.abs(y - ty) <= 1;
      });
    for (const s of map.spawns.filter((s) =>
      ['boss', 'key', 'checkpoint', 'swap'].includes(s.kind),
    ))
      expect(near(s.tx, s.ty), `${s.kind} at ${s.tx},${s.ty}`).toBe(true);
  });

  it('the countdown leaves time to run there at full speed', () => {
    const boss = map.spawns.filter((s) => s.kind === 'boss').at(-1)!;
    const start = map.spawns.find((s) => s.kind === 'start')!;
    const runSeconds = ((boss.tx - start.tx) * 16) / (112 * HEROES.ace.speed);
    const last = stage.bosses.at(-1)!;
    expect(last.durations.reduce((a, b) => a + b, 0)).toBeGreaterThan(runSeconds * 1.6);
  });
});
