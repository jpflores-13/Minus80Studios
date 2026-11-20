// Player-facing text for the ending. Headings and fixed lines come from the game brief. Every
// citation below was checked against PubMed/the publisher before being added — see docs/SCIENCE.md
// for the verification notes. Where a claim can't yet be backed by a checked source, it stays a
// marked placeholder instead of a guess.

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
  'Host detected.',
  'Defense system activated.',
  'They’re coming for your genome.',
  'Time to fight back.',
];

export const ENDING_LINE = 'This battle isn’t entirely fictional.';
export const DID_YOU_KNOW = 'DID YOU KNOW?';
export const CLOSING_LINE = 'The game ends here. The discovery doesn’t.';

const PLACEHOLDER = '[To be written with the contributing scientist and reviewed before release.]';

export const ENDING_PAGES: EndingPage[] = [
  {
    title: 'The Science Behind the Game',
    body: [
      'Bacteria are constantly under attack from phages — viruses that infect them — and many bacteria defend themselves with CRISPR systems: a kind of molecular immune system that remembers past invaders and uses proteins like Cas9 to cut their DNA on sight.',
      'The Cutters, Stalkers, Swarms and other machines in this game are a fictional, arcade-ified version of that defense system going on the attack against the phage you’re playing as.',
      'But phages fight back. Some carry genes for anti-CRISPR proteins — small proteins whose whole job is to jam a bacterium’s CRISPR defenses so the phage can survive and reproduce.',
    ],
    research: [
      {
        label: 'Jinek et al. (2012), Science — how Cas9 cuts DNA',
        url: 'https://pubmed.ncbi.nlm.nih.gov/22745249/',
      },
      {
        label: 'Bondy-Denomy et al. (2013), Nature — anti-CRISPR proteins, first found in phages',
        url: 'https://pubmed.ncbi.nlm.nih.gov/23242138/',
      },
    ],
  },
  {
    title: 'An Arms Race, Not a Single Trick',
    body: [
      'Anti-CRISPR proteins don’t all work the same way, which is why BLOCKADE, LOCKDOWN and DOUBLE TROUBLE in this game have different effects. One well-studied example, AcrIIA4, physically blocks the part of Cas9 that first grabs onto DNA, by mimicking the shape of DNA closely enough to occupy that spot itself.',
      'Since the first anti-CRISPR proteins were found in 2013, dozens more have turned up across different phages and different CRISPR systems. Each one only works against specific CRISPR machinery — there’s no single universal “off switch,” which is why no weapon in this game works on every enemy.',
    ],
    research: [
      {
        label: 'Dong et al. (2017), Nature — how AcrIIA4 blocks Cas9 by mimicking DNA',
        url: 'https://pubmed.ncbi.nlm.nih.gov/28448066/',
      },
    ],
  },
  {
    title: 'What We Simplified',
    body: [
      'An intact phage does not walk around inside a bacterium, fire projectiles, or make tactical decisions — it’s a much smaller, much stranger process of molecules interacting by chemistry and chance, not intention.',
      'Inhibited machines in this game drift away rather than exploding, which is closer to the truth than a conventional kill: an anti-CRISPR protein disables its target, it doesn’t destroy it.',
      PLACEHOLDER,
      'Every damage value, timer, upgrade, wave and inhibition duration in this game is fictional, chosen for pacing rather than measured from any experiment.',
    ],
  },
  {
    title: 'Meet the Scientist',
    body: [
      'Original game concept contributed by a researcher at the Broad Institute.',
      '[Name, biography and interview pending approval.]',
    ],
  },
  {
    title: 'Explore the Research',
    body: [
      'Journal of the American Chemical Society (2026). doi:10.1021/jacs.5c19089',
      'Proceedings of the National Academy of Sciences (2025). doi:10.1073/pnas.2426960122',
      '[Further references and scientific reviewer: placeholders]',
    ],
  },
  {
    title: 'Credits',
    body: ['A Minus 80 Studios game.', '[Collaborator credits pending approval.]'],
  },
];
