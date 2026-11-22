import { WILDLIFE_ORDER } from '../content/wildlife';
import type { ScaleId } from '../content/organisms';
import type { DiveConfig, SpawnEntry } from '../systems/dive';

/** Builds a DIVE expedition. The water sample collected feeds the following ONE DROP round. */
export function diveRoundFor(id: string, name: string, nextScale: ScaleId): DiveConfig {
  const spawnTable: SpawnEntry[] = WILDLIFE_ORDER.map((speciesId) => ({ speciesId, weight: 1 }));
  return {
    id,
    name,
    fieldWidth: 960,
    fieldHeight: 600,
    durationSeconds: 60,
    battery: 8,
    diverSpeed: 140,
    spawnTable,
    maxWildlife: 5,
    spawnRate: 0.15,
    sampleSite: { x: 860, y: 540, radius: 70, scaleId: nextScale },
  };
}
