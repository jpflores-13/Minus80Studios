// Player-facing text for the ending. Every citation below was checked against Crossref (the
// publisher's own metadata, not a search-engine summary) before being added; see
// docs/SCIENCE.md for the full verification notes and docs/SCIENTIFIC_REVIEW.md for what still
// needs a human's direct read of the primary PDF. Nothing here is fabricated.

export interface Reference {
  label: string;
  url: string;
}

export interface EndingPage {
  title: string;
  body: string[];
  research?: Reference[];
}

export const OPENING_LINES = [
  'The colony hums along.',
  'Everyone has their place.',
  'Then the queen is gone.',
  'Every bee matters now.',
];

export const DID_YOU_KNOW = 'DID YOU KNOW?';
export const CLOSING_LINE = 'The game ends here. The discovery doesn’t.';

// Short one-liners for the results screen, each a condensed restatement of a fact already
// checked and cited in full in ENDING_PAGES below, not a new claim.
export const QUICK_FACTS = [
  'In real bumble bee colonies, a relatively small number of workers do most of the foraging, well before anything goes wrong.',
  'A 2026 study tracked over 80 million individual social interactions across whole bumble bee colonies after their queen was removed.',
  'Queenless bumble bee colonies become more decentralized: work and influence spread out across more workers rather than concentrating.',
  'Queen loss can trigger reproductive competition among workers, since some may start investing in their own reproduction instead of the colony’s.',
];

export function randomQuickFact(seed: number): string {
  return QUICK_FACTS[Math.abs(seed) % QUICK_FACTS.length] ?? QUICK_FACTS[0]!;
}

export const SCIENTIST_PLACEHOLDER =
  '[Name, biography and interview pending written approval, per studio policy.]';

export const ENDING_PAGES: EndingPage[] = [
  {
    title: 'A Real Colony, Reorganizing',
    body: [
      'Bumble bee workers already differ from each other in how often they forage, care for brood, or stay in the nest, well before anything goes wrong. In a 2018 study of bumble bee colonies, researchers found that a relatively small number of workers do most of the foraging, and that where a worker spends its time in the nest predicts how the colony responds when a disturbance hits.',
      'In QUEENLESS, that’s Buzz Pulse: it never assigns a job. It just asks a worker to pay closer attention to what’s actually needed nearby, the same way a real disturbance makes some workers step into new roles faster than others.',
    ],
    research: [
      {
        label:
          'Crall, Gravish, Mountcastle, Kocher, Oppenheimer, Pierce & Combes (2018), Nature Communications — spatial fidelity predicts collective response',
        url: 'https://doi.org/10.1038/s41467-018-03561-w',
      },
    ],
  },
  {
    title: 'What Happens When the Queen Is Gone',
    body: [
      'A 2026 study tracked whole bumble bee colonies after their queen was removed, using automated tracking to quantify more than 80 million individual social interactions. Queenless colonies showed increased behavioral variation among workers, including a subset who became unusually central to the colony’s social network, with elevated movement and reproductive activity that simply wasn’t there while the queen was present.',
      'The colony’s social network itself changed shape: queenright colonies looked more centralized, queenless ones more decentralized, work and influence spreading out rather than concentrating.',
      'Queenie, in this game, is built around that one finding: a worker with nothing remarkable about her until the queen is gone.',
    ],
    research: [
      {
        label:
          'Ruttenberg, Wolf, Webb, Wyman, White, Melo, Traniello & Kocher (2026), Communications Biology — workers adopt new roles and reshape social networks after queen loss',
        url: 'https://doi.org/10.1038/s42003-026-10795-8',
      },
    ],
  },
  {
    title: 'Not Necessarily a Happy Ending',
    body: [
      'Queen loss is not simply good news for a colony. It can trigger reproductive competition among workers, since without a queen, some workers may begin investing in their own reproduction rather than the colony’s. The game’s reproductive-competition meetings are a simplified stand-in for that real trade-off, not a claim that queen loss is harmless or beneficial.',
      'A real colony that loses its queen is also, long-term, a colony that can no longer be replaced by new offspring from her. QUEENLESS only ever asks you to hold things together for a little while; it never claims a queenless colony is thriving.',
    ],
  },
  {
    title: 'What We Simplified',
    body: [
      'Buzz Pulse is fictional: nothing in a real bumble bee colony works like a player-controlled attention boost. It’s a gameplay abstraction of local information transfer among nestmates, not a literal ability any bee has.',
      'Every worker’s attributes, the exact numbers behind foraging, brood care, nest maintenance, energy, and reproductive activation, are gameplay balancing values, not measurements from the cited studies.',
      'Bumble bee queens are reproductive individuals, not managers giving orders; nothing in this game should be read as the queen having been "in charge" and workers only acting freely once she’s gone. What the research shows is that certain behavioral differences are present but not expressed the same way while she’s there.',
      'Real bumble bee genetics, physiology, and colony development are far more complex than anything simulated here.',
    ],
  },
  {
    title: 'Meet the Scientist',
    body: [
      'QUEENLESS draws on research from Sarah Kocher’s lab at Princeton, which studies how bumble bee colonies organize themselves and what changes when the queen is gone.',
      SCIENTIST_PLACEHOLDER,
    ],
  },
  {
    title: 'Explore the Research',
    body: [
      'Nature Communications (2018). doi:10.1038/s41467-018-03561-w',
      'Communications Biology (2026). doi:10.1038/s42003-026-10795-8',
      '[Further reading and a scientific reviewer: placeholders, pending review.]',
    ],
  },
];
