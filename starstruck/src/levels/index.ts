import { level1 } from './level1';
import { level2 } from './level2';
import { level3 } from './level3';
import { level4 } from './level4';
import { level5 } from './level5';
import { level6 } from './level6';
import type { LevelConfig } from './types';

export const LEVELS: LevelConfig[] = [level1, level2, level3, level4, level5, level6];

export function getLevel(id: string): LevelConfig {
  return LEVELS.find((l) => l.id === id) ?? level1;
}
