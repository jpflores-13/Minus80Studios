import { ATLAS } from './atlas';
import { CATALYST } from './catalyst';
import { NIGHTSHADE } from './nightshade';
import { OCTOPUS } from './octopus';
import type { CharacterConfig } from './types';

/**
 * Playable characters, all available from the start (no unlocks). Selection-screen order.
 * The first three are the cone-snail campaign; Cipher (the octopus) is the escalation level
 * that follows it, where the player becomes the predator the snails spent the campaign hiding
 * from, and a shark takes on that role instead.
 */
export const CHARACTERS: readonly CharacterConfig[] = [CATALYST, ATLAS, NIGHTSHADE, OCTOPUS];

export function getCharacter(id: string): CharacterConfig {
  return CHARACTERS.find((c) => c.id === id) ?? ATLAS;
}

/** The on-screen noun for this character's prey (see CharacterConfig.prey): 'fish' for the
 *  schooling-fish hunts, 'cone snail(s)' for Cipher's scattered cone-snail hunt. */
export function preyNoun(character: CharacterConfig, count: number, capitalized = false): string {
  const word = character.prey === 'snail' ? (count === 1 ? 'cone snail' : 'cone snails') : 'fish';
  return capitalized ? word[0]!.toUpperCase() + word.slice(1) : word;
}

/** The texture-key prefix for this character's prey sprites (see BootScene). */
export function preySpritePrefix(character: CharacterConfig): string {
  return character.prey === 'snail' ? 'snailprey' : 'fish';
}
