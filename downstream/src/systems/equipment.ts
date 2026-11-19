import type { ActionKind, EquipmentKind, LevelConfig, SlotKind } from '../levels/types';

export type Phase = 'investigate' | 'deploy' | 'flow' | 'results';

/** slotId → equipment placed there. */
export type Deployment = Record<string, SlotKind>;
/** Boom slotId → which bank it guides litter toward (−1 or +1). */
export type Orientations = Record<string, 1 | -1>;
/** How many limited-use actions have been spent. */
export type ActionsUsed = Partial<Record<ActionKind, number>>;

export type PlaceResult =
  | { ok: true }
  | { ok: false; reason: 'wrong-phase' | 'no-slot' | 'wrong-kind' | 'occupied' | 'none-left' };

export function isSlotKind(kind: EquipmentKind): kind is SlotKind {
  return kind === 'bin' || kind === 'trap' || kind === 'filter' || kind === 'boom';
}

export function remaining(
  level: LevelConfig,
  dep: Deployment,
  kind: EquipmentKind,
  used: ActionsUsed = {},
): number {
  const total = level.inventory[kind] ?? 0;
  if (!isSlotKind(kind)) return total - (used[kind] ?? 0);
  return total - Object.values(dep).filter((k) => k === kind).length;
}

// Deploy phase: place, move, remove and rotate freely.
// Flow phase: you can still place what's left, but placed equipment is locked.
export function canPlace(
  level: LevelConfig,
  dep: Deployment,
  phase: Phase,
  slotId: string,
  kind: SlotKind,
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
  kind: SlotKind,
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

/** Flip a placed boom's direction (deployment only). */
export function rotateBoom(
  dep: Deployment,
  orient: Orientations,
  phase: Phase,
  slotId: string,
): boolean {
  if (!canRemove(phase) || dep[slotId] !== 'boom') return false;
  orient[slotId] = orient[slotId] === -1 ? 1 : -1;
  return true;
}
