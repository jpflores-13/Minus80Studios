import { ATLAS } from './atlas';
import { CATALYST } from './catalyst';
import { NIGHTSHADE } from './nightshade';
import type { CharacterConfig } from './types';

/** Playable characters, all available from the start (no unlocks). Selection-screen order. */
export const CHARACTERS: readonly CharacterConfig[] = [CATALYST, ATLAS, NIGHTSHADE];

export function getCharacter(id: string): CharacterConfig {
  return CHARACTERS.find((c) => c.id === id) ?? ATLAS;
}
