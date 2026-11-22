import { SCALE_ORDER, SPECIMENS, type ScaleId } from '../content/organisms';
import type { OneDropConfig, SpawnEntry } from '../systems/oneDrop';

/** Builds a round for one scale: the target gets most of the weight, decoys split the rest. */
export function roundFor(
  scale: ScaleId,
  objectiveCount: number,
  durationSeconds: number,
): OneDropConfig {
  const types = SPECIMENS[scale];
  const target = Object.values(types).find((t) => t.kind === 'target');
  if (!target) throw new Error(`no target specimen defined for scale ${scale}`);
  const spawnTable: SpawnEntry[] = Object.values(types).map((t) => ({
    typeId: t.id,
    weight: t.kind === 'target' ? 3 : 1,
  }));
  return {
    id: `one-drop-${scale}`,
    name: `ONE DROP: ${scale}`,
    fieldRadius: 220,
    durationSeconds,
    objective: { targetTypeId: target.id, count: objectiveCount },
    spawnTable,
    spawnRate: 1.4,
    rampPerTenSeconds: 1.12,
    maxParticles: 18,
    types,
  };
}

/**
 * Builds the round for one lap of Endless Expedition: cycles through every scale in order,
 * raising the objective and shortening the clock a little each time the cycle repeats.
 */
export function endlessRoundFor(lap: number): OneDropConfig {
  const cycle = Math.floor(lap / SCALE_ORDER.length);
  const scale = SCALE_ORDER[lap % SCALE_ORDER.length]!;
  const objectiveCount = Math.min(16, 6 + cycle * 2);
  const durationSeconds = Math.max(20, 40 - cycle * 3);
  const base = roundFor(scale, objectiveCount, durationSeconds);
  return {
    ...base,
    id: `endless-${lap}-${scale}`,
    name: `ENDLESS · LAP ${cycle + 1} · ${scale.toUpperCase()}`,
    spawnRate: base.spawnRate * (1 + cycle * 0.15),
  };
}
