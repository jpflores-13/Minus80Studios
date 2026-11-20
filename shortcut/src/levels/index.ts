import { level1 } from './level1';
import { level2 } from './level2';
import { level3 } from './level3';
import type { LevelConfig } from './types';

export const LEVELS: LevelConfig[] = [level1, level2, level3];

export function getLevel(id: string): LevelConfig {
  return LEVELS.find((l) => l.id === id) ?? level1;
}
