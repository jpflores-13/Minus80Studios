import { SPECIMENS, type ScaleId } from '../content/organisms';
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
