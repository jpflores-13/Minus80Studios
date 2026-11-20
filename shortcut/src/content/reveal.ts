// Player-facing science text for the ending. Plain language, deliberately hedged. Every claim
// here must also be listed in docs/SCIENCE.md, with a real source added during scientific review.
// Nothing in this file may name a paper, lab or person until it has been checked and approved.

export interface RevealPage {
  title: string;
  body: string[];
}

/** City → cell, shown as the city fades into the science view. Same positions, same rules. */
export const MAPPING: [string, string][] = [
  ['The road', 'A chromatin fibre (DNA and its packaging)'],
  ['Shortcut machines', 'Cohesin complexes'],
  ['Shortcuts', 'DNA loops'],
  ['Checkpoints and their arrows', 'CTCF sites and their direction'],
  ['Depots', 'Cohesin loading (NIPBL-associated)'],
  ['Maintenance crews', 'Cohesin release (WAPL-associated)'],
  ['Suppliers', 'Enhancers'],
  ['Factories and other customers', 'Genes'],
  ['Delivery trucks', 'Transcribing RNA polymerase'],
  ['Districts', 'Chromatin domains'],
  ['City Connectivity Map', 'A simulated contact map'],
];

export const PAGES: RevealPage[] = [
  {
    title: 'The Science Behind the Game',
    body: [
      'Every cell packs about two metres of DNA into a space far smaller than a grain of dust, and it isn’t just stuffed in. It is folded in ways that matter for which genes are on.',
      'One way it folds is loop extrusion: ring-shaped protein complexes called cohesin are thought to reel DNA in from both sides, making a growing loop, until something stops them or they fall off.',
      'A protein called CTCF sits on particular DNA sequences that have a direction. Loops often end at pairs of CTCF sites pointing toward each other, just like your inward-facing checkpoints.',
    ],
  },
  {
    title: 'Loading, release and neighbourhoods',
    body: [
      'Cohesin gets loaded onto DNA with the help of other proteins (NIPBL is one) and taken off again by others (WAPL is one). How long it stays changes how big loops can grow. That was Level 6.',
      'Loops and boundaries help divide chromosomes into neighbourhoods, often called domains or TADs, where DNA touches itself more than its neighbours. Insulating those neighbourhoods was Good Neighbors.',
    ],
  },
  {
    title: 'Why it matters for genes',
    body: [
      'Enhancers are stretches of DNA that can boost a gene from far away along the chromosome. Folding can bring an enhancer and a gene together, like a shortcut bringing bread to the Café.',
      'Contact helps, but it doesn’t guarantee a gene turns on. That is why your deliveries were only ever likely.',
      'The machinery that reads genes moves along DNA too, and there is evidence it can push cohesin around. How much that matters in living cells is still being worked out.',
    ],
  },
  {
    title: 'Same genome, different cells',
    body: [
      'Cells respond to their surroundings, such as heat, by changing which genes are active. Level 7’s heat advisory was illustrative, not a model of a particular experiment.',
      'Your nerve cells and skin cells carry the same genome but use different genes, and fold it differently. That was A New Identity: the same road, organised for a new job.',
      'Experiments such as Hi-C measure how often pieces of DNA are close together, giving contact maps. Your City Connectivity Map was made the same way in spirit, from a simple model, not from real data.',
    ],
  },
  {
    title: 'Where the analogy breaks down',
    body: [
      'Molecules don’t plan. Nobody places CTCF or chooses where cohesin lands: it all comes from chemistry and chance, across millions of cells.',
      'Proximity doesn’t guarantee transcription. Loop extrusion isn’t the only way genomes fold; other processes, such as the clustering of similar chromatin, matter too.',
      'A real chromosome is a floppy three-dimensional polymer in a crowded nucleus, not a flat road. Every number in this game (speeds, lifetimes, how often checkpoints hold) was chosen for play, not measured. Some details, like whether both sides of cohesin move at once, or whether cohesins can pass each other, are still being studied.',
    ],
  },
  {
    title: 'Explore the Research',
    body: [
      '[Publication placeholder: loop extrusion, to be added after scientific review]',
      '[Publication placeholder: CTCF orientation, to be added after scientific review]',
      '[Publication placeholder: cohesin loading and release, to be added after scientific review]',
      '[Researcher interview placeholder]  ·  [Scientific reviewer placeholder]  ·  [Collaborating laboratory placeholder]',
    ],
  },
];
