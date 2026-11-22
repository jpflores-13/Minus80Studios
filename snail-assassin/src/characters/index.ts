import { ATLAS } from './atlas';
import { BLUESHARK } from './blueshark';
import { CATALYST } from './catalyst';
import { NIGHTSHADE } from './nightshade';
import { OCTOPUS } from './octopus';
import type { CharacterConfig } from './types';

/**
 * Playable characters, all available from the start (no unlocks). Selection-screen order.
 * The first three are the cone-snail campaign; Cipher (the octopus) is the first escalation
 * level, where the player becomes the predator the snails spent the campaign hiding from, and a
 * shark takes on that role instead. Glaucus (the blue shark) is the second escalation level:
 * the same blue shark is now playable, hunted in turn by a pod of orcas.
 */
export const CHARACTERS: readonly CharacterConfig[] = [
  CATALYST,
  ATLAS,
  NIGHTSHADE,
  OCTOPUS,
  BLUESHARK,
];

export function getCharacter(id: string): CharacterConfig {
  return CHARACTERS.find((c) => c.id === id) ?? ATLAS;
}

/** The on-screen noun for this character's prey (see CharacterConfig.prey): 'fish' for the
 *  schooling-fish hunts, 'cone snail(s)' for Cipher's scattered cone-snail hunt, 'squid' for
 *  the blue shark's scattered squid hunt. */
export function preyNoun(character: CharacterConfig, count: number, capitalized = false): string {
  const word =
    character.prey === 'snail'
      ? count === 1
        ? 'cone snail'
        : 'cone snails'
      : character.prey === 'squid'
        ? 'squid'
        : 'fish';
  return capitalized ? word[0]!.toUpperCase() + word.slice(1) : word;
}

/** The texture-key prefix for this character's prey sprites (see BootScene). */
export function preySpritePrefix(character: CharacterConfig): string {
  if (character.prey === 'snail') return 'snailprey';
  if (character.prey === 'squid') return 'squidprey';
  return 'fish';
}

/** The on-screen noun for this character's threat (see CharacterConfig.threat): 'octopus' and
 *  'shark' name a single animal; 'orca' is a pod of several, so it reads as "the orca pod". */
export function threatNoun(character: CharacterConfig): string {
  return character.threat === 'orca' ? 'orca pod' : character.threat;
}
