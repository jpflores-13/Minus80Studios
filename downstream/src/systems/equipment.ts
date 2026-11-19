import type { EquipmentKind, LevelConfig } from '../levels/types';

export type Phase = 'investigate' | 'deploy' | 'flow' | 'results';

/** slotId → equipment placed there. */
export type Deployment = Record<string, EquipmentKind>;

export type PlaceResult =
  | { ok: true }
  | { ok: false; reason: 'wrong-phase' | 'no-slot' | 'wrong-kind' | 'occupied' | 'none-left' };

export function remaining(level: LevelConfig, dep: Deployment, kind: EquipmentKind): number {
  const used = Object.values(dep).filter((k) => k === kind).length;
  return level.inventory[kind] - used;
}

/**
 * Placement rules:
 * - During DEPLOY you may place, remove, and move freely.
 * - During FLOW you may still place REMAINING equipment, but nothing already placed can move.
 */
export function canPlace(
  level: LevelConfig,
  dep: Deployment,
  phase: Phase,
  slotId: string,
  kind: EquipmentKind,
): PlaceResult {
  if (phase !== 'deploy' && phase !== 'flow') return { ok: false, reason: 'wrong-phase' };
  const slot = level.slots.find((s) => s.id === slotId);
  if (!slot) return { ok: false, reason: 'no-slot' };
  if (slot.kind !== kind) return { ok: false, reason: 'wrong-kind' };
  if (dep[slotId]) return { ok: false, reason: 'occupied' };
  if (remaining(level, dep, kind) <= 0) return { ok: false, reason: 'none-left' };
  return { ok: true };
}

export function place(
  level: LevelConfig,
  dep: Deployment,
  phase: Phase,
  slotId: string,
  kind: EquipmentKind,
): PlaceResult {
  const check = canPlace(level, dep, phase, slotId, kind);
  if (check.ok) dep[slotId] = kind;
  return check;
}

export function canRemove(phase: Phase): boolean {
  return phase === 'deploy';
}

export function remove(dep: Deployment, phase: Phase, slotId: string): boolean {
  if (!canRemove(phase) || !dep[slotId]) return false;
  delete dep[slotId];
  return true;
}

/** Reposition during deployment: remove from one slot and place in another (atomically). */
export function move(
  level: LevelConfig,
  dep: Deployment,
  phase: Phase,
  from: string,
  to: string,
): PlaceResult {
  const kind = dep[from];
  if (!kind || !canRemove(phase)) return { ok: false, reason: 'wrong-phase' };
  delete dep[from];
  const result = place(level, dep, phase, to, kind);
  if (!result.ok) dep[from] = kind;
  return result;
}
