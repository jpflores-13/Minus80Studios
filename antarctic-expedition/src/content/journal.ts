import { HEMOGLOBIN_NOTE, KIENLE_PROFILE } from './science';

export interface JournalEntryContent {
  id: string;
  name: string;
  scale: string;
  habitat: string;
  instrument: string;
  facts: string[];
  citationIds: string[];
  researcher: { name: string; affiliation: string; links: string[]; bio: string } | null;
  limitations: string;
  openQuestions: string[];
}

export const JOURNAL_ENTRIES: Record<string, JournalEntryContent> = {
  leopardSeal: {
    id: 'leopardSeal',
    name: 'Leopard seal',
    scale: 'The Visible World',
    habitat: 'Pack ice and open water around the Antarctic Peninsula and sub-Antarctic coasts.',
    instrument: 'Underwater camera',
    facts: [
      'A top predator of the Southern Ocean, feeding on penguins, other seals, krill, and fish.',
      'In one 2024 study, a courting pair interacted for about two hours, with calls continuing ' +
        'for roughly eight more hours afterward: 65 underwater calls from the male and 7 in-air ' +
        'calls from the female (a thump pulse, a noseblast, a blast, and a growl).',
      'Actual copulation was never directly observed in that study. The male was later found ' +
        'with a swollen genital opening and a fresh laceration, consistent with an attempted ' +
        'mating, but this is evidence, not direct observation.',
    ],
    citationIds: ['kienle2024'],
    researcher: {
      name: KIENLE_PROFILE.name,
      affiliation: KIENLE_PROFILE.affiliation,
      links: KIENLE_PROFILE.links,
      bio: KIENLE_PROFILE.bio,
    },
    limitations:
      'This was the first paired description of its kind, made from a single observed ' +
      'interaction at one site (Laguna San Rafael, Chile). It establishes that courtship ' +
      'behavior and calling happen, not how common or widespread any particular behavior is.',
    openQuestions: [
      'Does leopard seal mating happen elsewhere in their range the same way?',
      'What do the different in-air and underwater calls mean to the seals themselves?',
    ],
  },
  weddellSeal: {
    id: 'weddellSeal',
    name: 'Weddell seal',
    scale: 'The Visible World',
    habitat: 'Fast ice around the Antarctic continent, diving through tide cracks and seal holes.',
    instrument: 'Underwater camera',
    facts: [
      'Among the deepest and longest-diving seals, supported by a large blood volume and ' +
        'oxygen-storing muscle.',
      'Pups are born on the ice in spring and learn to swim and dive within their first weeks.',
    ],
    citationIds: [],
    researcher: null,
    limitations: 'General natural history; no specific study is cited for these statements.',
    openQuestions: ['How do individual dive strategies vary across a Weddell seal’s life?'],
  },
  adeliePenguin: {
    id: 'adeliePenguin',
    name: 'Adelie penguin',
    scale: 'The Visible World',
    habitat: 'Ice-free coastal ground for breeding; pack ice and open water for foraging.',
    instrument: 'Underwater camera',
    facts: [
      'Breeds in large colonies on ice-free Antarctic coastline and forages mainly on krill and fish.',
      'A strong indicator species: colony size and breeding success track sea-ice conditions.',
    ],
    citationIds: [],
    researcher: null,
    limitations: 'General natural history; no specific study is cited for these statements.',
    openQuestions: ['How will shifting sea-ice patterns change where colonies can persist?'],
  },
  icefish: {
    id: 'icefish',
    name: 'Crocodile icefish',
    scale: 'The Visible World',
    habitat: 'Cold, oxygen-rich Southern Ocean waters.',
    instrument: 'Underwater camera',
    facts: [HEMOGLOBIN_NOTE],
    citationIds: [],
    researcher: null,
    limitations:
      'The genetic deletion is well documented; this entry does not cover every ' +
      'species in the icefish family, which vary in how completely the globin genes are lost.',
    openQuestions: ['How do icefish cope physiologically as Southern Ocean waters warm?'],
  },
  krillSwarm: {
    id: 'krillSwarm',
    name: 'Antarctic krill',
    scale: 'The Visible World',
    habitat: 'Open water throughout the Southern Ocean, often in dense swarms.',
    instrument: 'Underwater camera',
    facts: [
      'Antarctic krill form some of the largest animal swarms on Earth and underpin the Southern ' +
        'Ocean food web, feeding everything from fish to whales.',
      'They graze on phytoplankton, including diatoms, linking the microscopic and visible worlds.',
    ],
    citationIds: [],
    researcher: null,
    limitations: 'General natural history; no specific study is cited for these statements.',
    openQuestions: ['How does krill swarm distribution shift with sea-ice loss?'],
  },
  diatom: {
    id: 'diatom',
    name: 'Diatom',
    scale: 'The Hidden Ecosystem',
    habitat: 'Suspended in the water column and within sea ice.',
    instrument: 'Compound light microscope',
    facts: [
      'Single-celled algae encased in a silica shell, responsible for much of the Southern ' +
        'Ocean’s primary production.',
      'Spring blooms of diatoms, triggered by returning light, are a major food source for krill.',
    ],
    citationIds: [],
    researcher: null,
    limitations: 'General natural history; no specific study is cited for these statements.',
    openQuestions: ['How will bloom timing shift as sea-ice seasons change?'],
  },
  labeledBacterium: {
    id: 'labeledBacterium',
    name: 'Labelled bacterial cell',
    scale: 'The Microbial World',
    habitat: 'Throughout the water column, in the highest concentrations near the surface.',
    instrument: 'Fluorescence microscope',
    facts: [
      'Bacteria and viruses are far too small and numerous to count individually by eye. Staining ' +
        'them with a DNA-binding dye (such as SYBR Green I) and counting with epifluorescence ' +
        'microscopy is a long-established way to enumerate them from a water sample.',
      'Counting tells you how many particles are present; it does not resolve their structure, ' +
        'which is where electron microscopy takes over.',
    ],
    citationIds: ['patel2007'],
    researcher: null,
    limitations:
      'The counting method itself is well established (Patel et al., 2007); the distinction ' +
      'between counting and resolving structure reflects the broader field rather than a single ' +
      'quoted claim from that paper.',
    openQuestions: [
      'What fraction of counted particles are viruses versus bacteria in a given sample?',
    ],
  },
  virusParticle: {
    id: 'virusParticle',
    name: 'Virus-like particle',
    scale: 'The Viral Frontier',
    habitat: 'Throughout the Southern Ocean water column, year-round.',
    instrument: 'Fluorescence + electron microscope',
    facts: [
      'A full-season survey (November to April) at a time-series site near Rothera found that ' +
        'roughly three-quarters of the viral diversity sampled had never been characterized ' +
        'before, describing what the authors called a "novel viral seascape."',
      'Notable groups found included phages, giant viruses (Nucleocytoviricota) likely involved ' +
        'in regulating phytoplankton blooms, Polinton-like viruses, virophages, and ' +
        'crAssphage-like viruses.',
    ],
    citationIds: ['piedade2024'],
    researcher: null,
    limitations:
      'This describes one time-series site over one season. Viral communities elsewhere in the ' +
      'Southern Ocean, or in other seasons, may differ.',
    openQuestions: [
      'What roles do most of these uncharacterized viruses actually play in the ecosystem?',
      'Do giant viruses meaningfully shape the timing of phytoplankton blooms?',
    ],
  },
  goodProjection: {
    id: 'goodProjection',
    name: 'Cryo-EM particle projection',
    scale: 'The Molecular Frontier',
    habitat: 'A flash-frozen thin film of sample, imaged under vacuum.',
    instrument: 'Cryo-electron microscope',
    facts: [
      'Cryo-electron microscopy freezes a sample so fast that water forms glass instead of ice ' +
        'crystals, preserving molecules close to their natural shape.',
      'A real reconstruction averages thousands of individual 2D particle images taken from many ' +
        'orientations to build up a 3D structure; a single clear image is only one small piece ' +
        'of that puzzle.',
    ],
    citationIds: [],
    researcher: null,
    limitations:
      'This game simplifies particle picking into a single tap-or-flag decision. Real picking ' +
      'and reconstruction involve many more computational steps than shown here.',
    openQuestions: ['How many particle images are actually needed for a reliable reconstruction?'],
  },
};

export const JOURNAL_ORDER: string[] = [
  'leopardSeal',
  'weddellSeal',
  'adeliePenguin',
  'icefish',
  'krillSwarm',
  'diatom',
  'labeledBacterium',
  'virusParticle',
  'goodProjection',
];
