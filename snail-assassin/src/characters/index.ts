import { ATLAS } from './atlas';
import type { CharacterConfig } from './types';

/** Playable characters, all available from the start. Catalyst and Nightshade arrive in later milestones. */
export const CHARACTERS: readonly CharacterConfig[] = [ATLAS];

export function getCharacter(id: string): CharacterConfig {
  return CHARACTERS.find((c) => c.id === id) ?? ATLAS;
}
