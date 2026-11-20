import { level1 } from './level1';
import type { LevelConfig } from './types';

export const LEVELS: LevelConfig[] = [level1];

export function getLevel(id: string): LevelConfig {
  return LEVELS.find((l) => l.id === id) ?? level1;
}
