import { pointAt, type Segment } from '../systems/network';
import { LEVEL_1 } from './level1';
import type { LevelConfig } from './types';

/** Campaign order. Level 2 (Two Rivers) arrives in Milestone 5. */
export const LEVELS: readonly LevelConfig[] = [withTrapPositions(LEVEL_1)];

export function getLevel(id: string): LevelConfig {
  return LEVELS.find((l) => l.id === id) ?? LEVELS[0]!;
}

/** Trap slots are defined by network position; derive their on-screen position from the geometry. */
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
