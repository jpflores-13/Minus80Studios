// Player-facing text for the ending. See docs/SCIENCE.md for the full verification notes. The
// central watershed-crossing mechanic is explicitly a research question, not a settled citation;
// Cousins et al. is forthcoming work, not yet published, and is never presented as a clickable,
// already-public source. Nothing here invents a finding, a number, or a researcher's words.

export interface Reference {
  label: string;
  url?: string;
}

export interface EndingPage {
  title: string;
  body: string[];
  research?: Reference[];
}

export const DID_YOU_KNOW = 'DID YOU KNOW?';
export const CLOSING_LINE = 'The game ends here. The discovery doesn’t.';

export const ENDING_PAGES: EndingPage[] = [
  {
    title: 'A Tiny Stream Specialist',
    body: [
      'Moss is a Cascade torrent salamander (Rhyacotriton cascadae), a real species that lives only in cold, clean headwater streams in the Pacific Northwest, from southern Washington into Oregon’s Cascades.',
      'They are so sensitive to warm water that they are almost never found in streams that stay above about 14°C for more than a day and a half at a time.',
    ],
    research: [
      {
        label: 'AmphibiaWeb — Rhyacotriton cascadae species account',
        url: 'https://amphibiaweb.org/species/4232',
      },
    ],
  },
  {
    title: 'Waterways Form Networks',
    body: [
      'Small headwater streams join larger ones, branching into networks the way the streams in this game do. For a small, water-dependent animal, that network can be most of its world.',
      'Researchers who study where species like this one can live map exactly this: which streams are cold and clean enough to count as suitable habitat, across an entire landscape.',
    ],
    research: [
      {
        label:
          'Thurman, Cousins, Garcia, Olson & Penaluna (2025), JAWRA — mapping habitat suitability rangewide for headwater stream-associated torrent salamanders',
        url: 'https://doi.org/10.1111/1752-1688.70045',
      },
    ],
  },
  {
    title: 'A Real, Still-Open Question',
    body: [
      'This game’s central idea, that a salamander might usually stay in its home stream network but occasionally cross overland between nearby headwaters, is the question a real research project is built around, not a settled finding you can look up today.',
      'Christopher Cousins, a PhD student at Oregon State University (in Tiffany Garcia’s lab) and an HHMI Gilliam Fellow, is studying the population genetics of the Cascade torrent salamander across its range. That work is forthcoming: as of this game’s release, it has not yet been published, and the exact within-watershed-versus-overland pattern in it has not been confirmed by us against a finished manuscript.',
      'What we simplified: the moisture meter, movement speeds, and every terrain number in this game are gameplay choices, not measurements of a real salamander’s physiology or behavior.',
    ],
  },
  {
    title: 'Hidden Diversity (A Preview)',
    body: [
      'Early word from Cousins’ forthcoming genetic work is that this species is not one uniform population across its range, it looks like several distinct groups, possibly including one surprisingly different from the rest.',
      'We’re stating that as a preview of ongoing research, not a citable, published result: the paper isn’t out yet, and we haven’t checked the final numbers against it. That kind of hidden structure, once confirmed, is exactly why conservation decisions can’t rely on distance on a map alone.',
    ],
  },
  {
    title: 'Movement Is Not the Same as Gene Flow',
    body: [
      'An animal crossing from one stream to another is not, by itself, gene flow. Gene flow needs that animal to survive, settle, and successfully reproduce there, passing its genes into the next generation.',
      'Scientists infer gene flow (and its limits) mostly from genetic data collected after the fact, not by tracking every individual’s journey directly.',
    ],
  },
  {
    title: 'Meet the Scientist',
    body: [
      'Research inspiration: Christopher Cousins, PhD student, Oregon State University, Department of Fisheries, Wildlife, and Conservation Sciences (Garcia Lab); an HHMI Gilliam Fellow.',
      '[Biography, photo, and interview pending written approval, per studio policy.]',
    ],
  },
];
