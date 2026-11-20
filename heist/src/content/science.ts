// Player-facing text for the ending. Every citation below was checked against PubMed/the
// publisher before being added — see docs/SCIENCE.md for the verification notes and the full
// game-to-biology mapping. Where a claim can't yet be backed by a checked source, it stays a
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

export const ENDING_LINE = 'Clean getaway. But the Folder isn’t just a gadget.';
export const DID_YOU_KNOW = 'DID YOU KNOW?';
export const CLOSING_LINE = 'The game ends here. The discovery doesn’t.';

export const ENDING_PAGES: EndingPage[] = [
  {
    title: 'A Folder, Hiding in Every Cell',
    body: [
      'Every cell in your body has about two meters of DNA packed into a nucleus a few microns across. That only works because the DNA is folded, and one of the machines doing the folding is a ring-shaped protein complex called cohesin.',
      'Cohesin grabs the DNA fiber, then reels it in from both sides at once, growing a loop — the corridor in this game, with the Folder pulling two ends apart, is a direct stand-in for that: a loop extrusion engine, not a hallway with a gadget in it.',
    ],
    research: [
      {
        label: 'Rao et al. (2014), Cell — mapping real chromatin loops across the genome',
        url: 'https://pubmed.ncbi.nlm.nih.gov/25497547/',
      },
      {
        label: 'Fudenberg et al. (2016), Cell Reports — the loop-extrusion model',
        url: 'https://pubmed.ncbi.nlm.nih.gov/27210764/',
      },
    ],
  },
  {
    title: 'Anchors Only Work One Way',
    body: [
      'The Anchors in this game stop the Folder’s ends from either direction. Real loop anchors don’t work that way: they’re built from a protein called CTCF that binds DNA in a specific orientation, and only stops a loop-extruding cohesin complex arriving from one side.',
      'Researchers proved this directly: flip a CTCF site around with gene editing, and the loops it used to anchor disappear or move, even though the DNA sequence itself barely changed. Direction, not just position, decides where the genome folds.',
    ],
    research: [
      {
        label: 'Guo et al. (2015), Cell — flipping CTCF sites changes genome folding',
        url: 'https://pubmed.ncbi.nlm.nih.gov/26276636/',
      },
    ],
  },
  {
    title: 'Watching the Motor Run',
    body: [
      'For years, loop extrusion was a model that explained the data but hadn’t been directly seen. In 2019, researchers watched single human cohesin complexes reel in loops of DNA in a test tube, in real time, confirming it’s a real molecular motor and not just a convenient idea.',
      'It’s fast by molecular standards — over a thousand DNA letters per second — but still many, many times slower than the Folder in this game, which is built for a few seconds of puzzle-solving, not biochemistry.',
    ],
    research: [
      {
        label: 'Davidson et al. (2019), Science — watching cohesin extrude DNA loops',
        url: 'https://pubmed.ncbi.nlm.nih.gov/31753851/',
      },
    ],
  },
  {
    title: 'What We Simplified',
    body: [
      'The corridor is one straight line; real chromatin is a tangled three-dimensional fiber, and a loop brings two distant points into physical contact in a crowded nucleus, not just on a map.',
      'The Anchors in this game stop a Folder end from either direction — real CTCF sites are directional, a deliberate simplification this phase of the game doesn’t yet model.',
      'Deploying, reeling in, and releasing the Folder are actions you choose on purpose; cohesin loading, extrusion and release happen continuously and are not goal-directed.',
      'Every timer, cooldown, charge count and score in this game is a gameplay-balancing number, not a measured molecular rate.',
    ],
  },
  {
    title: 'Meet the Scientist',
    body: [
      'This game’s design is inspired by published research on genome folding.',
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
