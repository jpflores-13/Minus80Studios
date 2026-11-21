// Player-facing text for the ending. Every citation below was checked against PubMed/the
// publisher before being added — see docs/SCIENCE.md for the verification notes. Where a claim
// can't yet be backed by a checked source, it stays a marked placeholder instead of a guess.

export interface Reference {
  label: string;
  url: string;
}

export interface EndingPage {
  title: string;
  body: string[];
  research?: Reference[];
}

export const ENDING_LINE = 'Belly full. But that star on its nose isn’t fiction.';
export const DID_YOU_KNOW = 'DID YOU KNOW?';
export const CLOSING_LINE = 'The game ends here. The discovery doesn’t.';

// Short one-liners for the results screen, each a condensed restatement of a fact already
// checked and cited in full in ENDING_PAGES above, not a new claim.
export const QUICK_FACTS = [
  'The star has 22 rays covered in touch sensors called Eimer’s organs. One short ray does almost all the identifying, the same job your retina’s sharpest patch does for your eyes.',
  'A real star-nosed mole can decide something is food in as little as 8 milliseconds, about five times faster than a human’s fastest reflex.',
  'Star-nosed moles smell underwater by breathing out a bubble onto a scent, then sniffing it back in, several times a second.',
];

export function randomQuickFact(seed: number): string {
  return QUICK_FACTS[Math.abs(seed) % QUICK_FACTS.length] ?? QUICK_FACTS[0]!;
}

export const ENDING_PAGES: EndingPage[] = [
  {
    title: 'A Fovea You Can Touch',
    body: [
      'The star-nosed mole’s nose really does look like a tiny pink starfish: 22 fleshy rays, covered in thousands of microscopic touch sensors called Eimer’s organs, that it uses to feel its way through total darkness.',
      'One of those 22 rays — a short one near the bottom-center of the star, not the biggest — does almost all the identifying. The mole swings it onto anything it bumps into first, the same way your eyes snap to the sharpest point of what you’re looking at. That’s a “fovea”: usually a patch of retina, but here it’s a patch of skin.',
    ],
    research: [
      {
        label:
          'Catania & Kaas (1997), Journal of Comparative Neurology — discovering the touch fovea',
        url: 'https://pubmed.ncbi.nlm.nih.gov/9336224/',
      },
      {
        label: 'Catania & Remple (2004), Brain, Behavior and Evolution — how the star forages',
        url: 'https://pubmed.ncbi.nlm.nih.gov/14673194/',
      },
    ],
  },
  {
    title: 'Faster Than You Can Think',
    body: [
      'A real star-nosed mole decides whether something is food in as little as 8 milliseconds — about five times faster than a human’s fastest reflex. From first touch to the bite, the whole thing can be over in a quarter of a second.',
      'When it isn’t sure, it touches the same spot again before moving on — researchers called this a “double take.” The bite-then-decide tension in this game is a much slower, playable stand-in for a real nervous system working close to the physical limit of how fast a touch can be processed at all.',
    ],
    research: [
      {
        label: 'Catania & Remple (2005), Nature — moles foraging at the speed limit',
        url: 'https://pubmed.ncbi.nlm.nih.gov/15690041/',
      },
    ],
  },
  {
    title: 'Sniffing Underwater',
    body: [
      'Star-nosed moles swim and hunt underwater too, and mammal noses supposedly can’t smell there — you can’t inhale water to carry scent to your nose the way you inhale air. But the star-nosed mole breathes out through its nose, forms a tiny bubble around a scent, and sniffs that bubble back in before it can float away, flicking it out five to ten times a second.',
      'BUBBLE SNIFF, the mechanic you used underwater in this game, is built directly on that: a real, measured behavior, not an invented ability.',
    ],
    research: [
      {
        label: 'Catania (2006), Nature — underwater sniffing in semi-aquatic mammals',
        url: 'https://pubmed.ncbi.nlm.nih.gov/17183311/',
      },
    ],
  },
  {
    title: 'What We Simplified',
    body: [
      'The mole in this game sees a HUD, hears music, and chooses between labeled prey types — its real counterpart has no vision to speak of and makes every decision through touch and smell alone, far faster than any on-screen prompt.',
      'Energy, timers, scoring, and the other playable characters (Noseferatu, Sherlock Moles, Molezilla, Sir Sniffs-a-Lot, The Starfather) are fiction, built for pacing and fun — not measurements of any real animal.',
    ],
  },
  {
    title: 'Meet the Scientist',
    body: [
      'This game’s design is inspired by published research on the star-nosed mole.',
      '[Name, biography and interview pending the researcher’s written approval, per studio policy.]',
    ],
  },
  {
    title: 'Explore the Research',
    body: [
      'All four citations above link directly to PubMed.',
      '[Further reading and a scientific reviewer: placeholders, pending review.]',
    ],
  },
  {
    title: 'Credits',
    body: ['A Minus 80 Studios game.', '[Collaborator credits pending approval.]'],
  },
];
