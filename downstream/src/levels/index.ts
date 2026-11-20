import { pointAt, type Segment } from '../systems/network';
import { LEVEL_1 } from './level1';
import { LEVEL_2 } from './level2';
import { LEVEL_3 } from './level3';
import { LEVEL_4 } from './level4';
import { LEVEL_5 } from './level5';
import { CLIMATES, yearWeather, type ClimateId } from './climates';
import type { LevelConfig } from './types';

/** Campaign order. */
export const LEVELS: readonly LevelConfig[] = [LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5]
  .map(withTrapPositions)
  .map((l) => withClimate(l, 'four-seasons'));

export function getLevel(id: string, climate: ClimateId = 'four-seasons'): LevelConfig {
  return withClimate(LEVELS.find((l) => l.id === id) ?? LEVELS[0]!, climate);
}

// Year-long levels take their rain from the chosen climate.
export function withClimate(level: LevelConfig, climate: ClimateId): LevelConfig {
  if (!level.year) return level;
  const months = level.year.generationMonths;
  return {
    ...level,
    generationSeconds: (level.durationSeconds * months) / 12,
    weather: yearWeather(CLIMATES[climate], level.durationSeconds),
  };
}

/** Trap and boom slots are defined by network position; derive their on-screen position from the geometry. */
function withTrapPositions(level: LevelConfig): LevelConfig {
  const byId = new Map<string, Segment>(level.segments.map((s) => [s.id, s]));
  return {
    ...level,
    slots: level.slots.map((slot) => {
      const seg = slot.segmentId ? byId.get(slot.segmentId) : undefined;
      return seg && slot.s !== undefined ? { ...slot, pos: pointAt(seg, slot.s).pos } : slot;
    }),
  };
}
