import type { LevelConfig } from '../src/levels/types';
import type { Deployment } from '../src/systems/equipment';

/** Every way to use a level's full inventory (bins and traps placed in distinct slots). */
export function allFullDeployments(level: LevelConfig): Deployment[] {
  const pick = <T>(arr: T[], k: number): T[][] =>
    k === 0
      ? [[]]
      : arr.flatMap((x, i) => pick(arr.slice(i + 1), k - 1).map((rest) => [x, ...rest]));
  const binSlots = level.slots.filter((s) => s.kind === 'bin').map((s) => s.id);
  const trapSlots = level.slots.filter((s) => s.kind === 'trap').map((s) => s.id);
  const out: Deployment[] = [];
  for (const bins of pick(binSlots, Math.min(level.inventory.bin, binSlots.length))) {
    for (const traps of pick(trapSlots, Math.min(level.inventory.trap, trapSlots.length))) {
      const dep: Deployment = {};
      for (const b of bins) dep[b] = 'bin';
      for (const t of traps) dep[t] = 'trap';
      out.push(dep);
    }
  }
  return out;
}
