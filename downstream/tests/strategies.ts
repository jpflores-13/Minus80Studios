import type { LevelConfig, SlotKind } from '../src/levels/types';
import type { Orientations } from '../src/systems/equipment';
import { simpleCleanupPolicy, type Strategy } from '../src/systems/sim';

function choose<T>(items: T[], k: number): T[][] {
  if (k === 0) return [[]];
  return items.flatMap((x, i) => choose(items.slice(i + 1), k - 1).map((rest) => [x, ...rest]));
}

// Every way to place a level's full inventory, including both directions for each boom.
export function allStrategies(level: LevelConfig): Strategy[] {
  const kinds: SlotKind[] = ['bin', 'filter', 'trap', 'boom'];
  let partial: Strategy[] = [{ deployment: {}, orientations: {} }];
  for (const kind of kinds) {
    const slots = level.slots.filter((s) => s.kind === kind).map((s) => s.id);
    const n = Math.min(level.inventory[kind] ?? 0, slots.length);
    const next: Strategy[] = [];
    for (const base of partial) {
      for (const pick of choose(slots, n)) {
        const dirs: Orientations[] =
          kind === 'boom'
            ? choose(pick, 0).length && pick.length
              ? directions(pick)
              : [{}]
            : [{}];
        for (const dir of dirs) {
          const deployment = { ...base.deployment };
          for (const id of pick) deployment[id] = kind;
          next.push({ deployment, orientations: { ...base.orientations, ...dir } });
        }
      }
    }
    partial = next;
  }
  return partial.map((s) => ({ ...s, policy: simpleCleanupPolicy }));
}

function directions(ids: string[]): Orientations[] {
  let out: Orientations[] = [{}];
  for (const id of ids)
    out = out.flatMap((o) => [
      { ...o, [id]: 1 as const },
      { ...o, [id]: -1 as const },
    ]);
  return out;
}
