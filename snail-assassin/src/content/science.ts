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

/**
 * Ids with a Discovery entry: every playable character, plus 'shark' for the threat that hunts
 * the octopus in the first escalation level, and 'orca' for the pod that hunts the blue shark in
 * the second. Neither 'shark' nor 'orca' is a playable CharacterConfig (they're AI threats, see
 * src/systems/predator.ts and TUNING.shark / TUNING.orca), but they still get a reveal, the same
 * way the octopus's and blue shark's own research is shown while playing as them. See
 * DiscoveryScene's 'threat' step and THREAT_DISCOVERY below.
 */
export type DiscoveryId = CharacterConfig['id'] | 'shark' | 'orca';

/**
 * Which non-playable threat discovery accompanies a playable character's own discovery, and the
 * short label used for it on screen (DiscoveryScene's 'threat' step and "more" buttons,
 * ResultsScene's results-screen fact). Only characters whose threat is itself a real, cited
 * species get an entry here — the three cone snails' octopus threat does not, because it's a
 * marked gameplay invention, not the real octopus research shown for Cipher (see docs/SCIENCE.md,
 * "Predators (for the octopus-vs-snail threat in the main campaign)").
 */
export const THREAT_DISCOVERY: Partial<
  Record<CharacterConfig['id'], { id: DiscoveryId; shortLabel: string; question: string }>
> = {
  octopus: {
    id: 'shark',
    shortLabel: 'THE SHARK',
    question: 'And the shark that was hunting you?',
  },
  blueshark: {
    id: 'orca',
    shortLabel: 'THE ORCA POD',
    question: 'And the orca pod that was hunting you?',
  },
};

export const DISCOVERIES: Record<DiscoveryId, Discovery> = {
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
  octopus: {
    reveal: 'MEET THE REAL CIPHER',
    text:
      'The California two-spot octopus can shift from plain sight to nearly invisible against the reef in moments, ' +
      'its skin blending into its surroundings as a defence against predators. When it does strike, it combines a ' +
      'jet-propelled pounce with synchronous, simultaneous arm recruitment on hard-shelled prey like crabs, ' +
      'restraining and paralysing the catch with a venomous bite in one motion, not two.',
    research: [
      {
        label: 'Bidel et al. 2022, Current Biology: arm recruitment during prey capture',
        url: 'https://pubmed.ncbi.nlm.nih.gov/36130600/',
      },
      {
        label: 'Gonçalves & Costa 2021, Frontiers in Marine Science: cephalotoxins',
        url: 'https://doi.org/10.3389/fmars.2021.647344',
      },
    ],
    explore: {
      label: 'Josef et al. 2012 (open access): how octopuses pick their camouflage pattern',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3359305/',
    },
  },
  blueshark: {
    reveal: 'MEET THE REAL GLAUCUS',
    text:
      'The blue shark is a major predator of squid, with diet studies off Mexico finding it almost entirely ' +
      'cephalopods by weight. Real telemetry shows its swimming speed is far from constant, rising sharply ' +
      'during active periods rather than holding one steady cruise. Stomachs often hold only beaks, the hard ' +
      "part a squid can't digest away.",
    research: [
      {
        label: 'Galván-Magaña et al. 2013, Deep-Sea Research Part II: sharks that eat cephalopods',
        url: 'https://doi.org/10.1016/j.dsr2.2013.04.002',
      },
      {
        label:
          'Sciarrotta & Nelson 1977, Fishery Bulletin: diel swimming-speed changes in the blue shark',
        url: 'https://spo.nmfs.noaa.gov/content/diel-behavior-blue-shark-prionace-glauca-near-santa-catalina-island-california',
      },
    ],
    explore: {
      label: 'Markaida & Sosa-Nishizaki 2010: what a blue shark actually eats',
      url: 'https://doi.org/10.1017/S0025315409991597',
    },
  },
  orca: {
    reveal: 'MEET THE REAL ORCA POD',
    text:
      'Orca pods are documented cooperatively hunting sharks far larger than themselves. Off Mexico’s Gulf of ' +
      'California, one pod has repeatedly attacked juvenile whale sharks; in Australia, genetic evidence confirmed ' +
      'an orca kill on a white shark. Both times, the pod targeted the shark’s underside, causing it to bleed out, ' +
      'then ate the liver. No published study documents this against the blue shark Glaucus plays — this threat ' +
      'applies that same real, coordinated behavior to a different shark species.',
    research: [
      {
        label: 'Pancaldi et al. 2024, Frontiers in Marine Science: orcas hunting whale sharks',
        url: 'https://doi.org/10.3389/fmars.2024.1448254',
      },
      {
        label:
          'Reeves et al. 2025, Ecology and Evolution: genetic evidence of orca predation on a white shark',
        url: 'https://pubmed.ncbi.nlm.nih.gov/39872902/',
      },
    ],
    explore: {
      label: 'Pancaldi et al. 2024 (open access): orcas that hunt the largest fish on Earth',
      url: 'https://doi.org/10.3389/fmars.2024.1448254',
    },
  },
  shark: {
    reveal: 'MEET THE REAL BLUE SHARK',
    text:
      'Cipher’s threat is the blue shark (Prionace glauca), one of several shark species confirmed by ' +
      'stomach-content studies to prey on cephalopods, including the open-ocean paper nautilus, a relative ' +
      'of the octopus. Sharks carry electroreceptors, the ampullae of Lorenzini; in a related species, the ' +
      'small-spotted catshark, that sense alone let it locate buried prey it could not see, hear, or smell.',
    research: [
      {
        label: 'Galván-Magaña et al. 2013, Deep-Sea Research Part II: sharks that eat cephalopods',
        url: 'https://doi.org/10.1016/j.dsr2.2013.04.002',
      },
      {
        label: 'Kalmijn 1971, Journal of Experimental Biology: electroreception in sharks',
        url: 'https://pubmed.ncbi.nlm.nih.gov/5114029/',
      },
    ],
    explore: {
      label: 'Kalmijn 1971: the shark that attacked a buried electrode like real prey',
      url: 'https://pubmed.ncbi.nlm.nih.gov/5114029/',
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
export const QUICK_FACTS: Record<DiscoveryId, string[]> = {
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
  octopus: [
    'Real octopuses can shift from plain sight to nearly invisible in moments, their skin blending into the reef as a defence against predators.',
    'When striking hard-shelled prey like crabs, octopuses recruit several arms at once rather than one at a time, then deliver a venomous, paralysing bite once the catch is restrained.',
  ],
  shark: [
    'Cipher’s threat is modeled on the blue shark, one of several shark species documented preying on cephalopods, including the paper nautilus, a relative of the octopus.',
    'Sharks carry electroreceptors called the ampullae of Lorenzini; in a related species, the small-spotted catshark, that sense alone let it locate prey it could not see, hear, or smell.',
  ],
  blueshark: [
    'The real blue shark’s diet is dominated by cephalopods, with one study off Mexico finding it was almost entirely squid and other cephalopods by weight.',
    'Telemetry on real blue sharks shows their swimming speed is not constant: it rises measurably during the shark’s most active periods rather than holding one steady pace.',
  ],
  orca: [
    'A real orca pod in the Gulf of California has repeatedly hunted juvenile whale sharks, targeting the underside to make them bleed out before eating the liver.',
    'In 2025, genetic evidence from a shark carcass in Australia confirmed an orca kill for the first time there too — the liver was missing, same as elsewhere.',
  ],
};

export function randomQuickFact(id: DiscoveryId, seed: number): string {
  const facts = QUICK_FACTS[id];
  return facts[Math.abs(seed) % facts.length] ?? facts[0]!;
}

export const DISCLAIMER =
  'Inspired by real biology. Gameplay abilities, kinetics, and physiological effects have been simplified for entertainment.';

export const ILLUSTRATION_NOTE =
  'Original illustration. A licensed photograph of the real species is coming.';

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).length;
}
