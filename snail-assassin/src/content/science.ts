import type { CharacterConfig } from '../characters/types';

// Text and links for the ending. Must match docs/SCIENCE.md (a test checks the links).
// Marked as a draft until a cone snail researcher has reviewed it.
export interface Reference {
  label: string;
  url: string;
}

export interface Discovery {
  reveal: string;
  /** 40–70 words of main scientific text (tested). */
  text: string;
  /** "Read the Research": 1–2 species-specific peer-reviewed publications. */
  research: Reference[];
  /** "Explore the Real Science": an accessible resource until the studio science page exists. */
  explore: Reference;
}

export const REVIEW_STATUS = 'Draft text: pending review by a cone snail researcher.';

export const DISCOVERIES: Record<CharacterConfig['id'], Discovery> = {
  catalyst: {
    reveal: 'MEET THE REAL CATALYST',
    text:
      'The cat cone is a hook-and-line hunter. It fires a hollow, harpoon-like tooth from its extended proboscis in ' +
      'one of the fastest strikes recorded in the animal kingdom. The harpoon delivers venom and tethers the snail ' +
      'to its catch, and the venom rapidly stops the fish from swimming away. That is how a slow snail lands a fast fish.',
    research: [
      {
        label: 'Schulz et al. 2019, Current Biology: the high-speed radular prey strike',
        url: 'https://pubmed.ncbi.nlm.nih.gov/31430472/',
      },
      {
        label: 'Himaya et al. 2015, J. Proteome Research: venomics of Conus catus',
        url: 'https://pubmed.ncbi.nlm.nih.gov/26322961/',
      },
    ],
    explore: {
      label: 'Olivera et al. 2015: how fish-hunting cone snails catch their prey',
      url: 'https://pubmed.ncbi.nlm.nih.gov/26397110/',
    },
  },
  atlas: {
    reveal: 'MEET THE REAL ATLAS',
    text:
      'The geography cone hunts fish with a net strategy, engulfing them in a stretchy, net-like false mouth. Its ' +
      'venom contains a specialised insulin that sends fish into dangerously low blood sugar, plus a mimic of a fish ' +
      'hormone that blocks the fish’s own rescue response, making the crash worse. Two molecules, one strategy.',
    research: [
      {
        label: 'Safavi-Hemami et al. 2015, PNAS: specialized insulin used as a weapon',
        url: 'https://pubmed.ncbi.nlm.nih.gov/25605914/',
      },
      {
        label: 'Yeung et al. 2024, Nature Communications: a weaponized hormone mimic',
        url: 'https://doi.org/10.1038/s41467-024-50470-2',
      },
    ],
    explore: {
      label: 'Yeung et al. 2024 (open access): how the geography cone disrupts prey blood sugar',
      url: 'https://doi.org/10.1038/s41467-024-50470-2',
    },
  },
  nightshade: {
    reveal: 'MEET THE REAL NIGHTSHADE',
    text:
      'The tulip cone is also a net hunter, engulfing fish with its expandable false mouth. Its venom includes a ' +
      'specialised insulin, and a molecule that, in lab tests with zebrafish larvae, dramatically reduced the fish’s ' +
      'escape response. How these components work together during a real hunt is still being studied.',
    research: [
      {
        label: 'Dutt et al. 2019, Scientific Reports: a venom molecule that dampens escape',
        url: 'https://doi.org/10.1038/s41598-019-54186-y',
      },
      {
        label: 'Safavi-Hemami et al. 2015, PNAS: venom insulin in C. tulipa and C. geographus',
        url: 'https://pubmed.ncbi.nlm.nih.gov/25605914/',
      },
    ],
    explore: {
      label: 'Dutt et al. 2019 (open access): net hunting in the tulip cone',
      url: 'https://doi.org/10.1038/s41598-019-54186-y',
    },
  },
};

export const MEDICINE = {
  title: 'FROM VENOM TO MEDICINE',
  text:
    'Cone snail venom has already inspired an approved medicine. Ziconotide, a treatment for severe chronic pain, is ' +
    'a synthetic version of a peptide first found in the venom of a different species, the magician’s cone ' +
    '(Conus magus). Scientists are now studying other venom molecules, including insulin and hormone mimics, as ' +
    'possible drug leads. These remain experimental.',
  reference: {
    label: 'Lin et al. 2024, Heliyon: a comprehensive review on ziconotide',
    url: 'https://pubmed.ncbi.nlm.nih.gov/38779019/',
  },
};

export const DID_YOU_KNOW = 'DID YOU KNOW?';

// Short one-liners for the results screen, each a condensed restatement of a fact already
// checked and cited in full in DISCOVERIES/MEDICINE above, not a new claim. Per character, so
// the fact matches whichever assassin the player just hunted as.
export const QUICK_FACTS: Record<CharacterConfig['id'], string[]> = {
  catalyst: [
    'The real cat cone fires its venomous harpoon in one of the fastest strikes recorded in the animal kingdom, then reels in the fish it tethers.',
    'Cone snail venom has already inspired an approved medicine: ziconotide, a chronic-pain drug based on a peptide from a different cone snail species.',
  ],
  atlas: [
    'The real geography cone’s venom includes a specialised insulin that crashes a fish’s blood sugar, plus a hormone mimic that blocks its rescue response.',
    'Cone snail venom has already inspired an approved medicine: ziconotide, a chronic-pain drug based on a peptide from a different cone snail species.',
  ],
  nightshade: [
    'The real tulip cone’s venom includes a molecule that, in lab tests with zebrafish larvae, dramatically slowed the fish’s ability to escape.',
    'Cone snail venom has already inspired an approved medicine: ziconotide, a chronic-pain drug based on a peptide from a different cone snail species.',
  ],
};

export function randomQuickFact(characterId: CharacterConfig['id'], seed: number): string {
  const facts = QUICK_FACTS[characterId];
  return facts[Math.abs(seed) % facts.length] ?? facts[0]!;
}

export const DISCLAIMER =
  'Inspired by real biology. Gameplay abilities, kinetics, and physiological effects have been simplified for entertainment.';

export const ILLUSTRATION_NOTE =
  'Original illustration. A licensed photograph of the real species is coming.';

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).length;
}
