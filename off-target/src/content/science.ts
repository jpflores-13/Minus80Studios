// Player-facing text for the ending. The section headings and fixed lines come from the game
// brief. Every citation below was checked against PubMed/the publisher before being added — see
// docs/SCIENCE.md for the full verification notes. Nothing here is fabricated; where a claim can't
// yet be backed by a checked source, it stays a marked placeholder instead of a guess.

export interface Reference {
  label: string;
  url: string;
}

export interface EndingPage {
  title: string;
  body: string[];
  research?: Reference[];
}

export const ENDING_LINES = ['You saved the strand.', 'But this battle isn’t entirely fictional.'];

export const DID_YOU_KNOW = 'DID YOU KNOW?';

export const CLOSING_LINE = 'The game ends here. The discovery doesn’t.';

// Short one-liners for the results screen, each a condensed restatement of a fact already
// checked and cited in full in ENDING_PAGES below, not a new claim.
export const QUICK_FACTS = [
  'Cas9 doesn’t always cut only where it’s told to: a 2013 study found some guide RNAs caused off-target cuts in human cells as often as, or more often than, the intended one.',
  'Anti-CRISPR proteins were first found in 2013, in viruses that infect bacteria — they evolved to disable a bacterium’s CRISPR immune system so the virus could survive.',
  'One anti-CRISPR protein, AcrIIA4, blocks Cas9 by mimicking the shape of DNA closely enough to occupy the spot where Cas9 would otherwise grab on.',
];

export function randomQuickFact(seed: number): string {
  return QUICK_FACTS[Math.abs(seed) % QUICK_FACTS.length] ?? QUICK_FACTS[0]!;
}

export const ENDING_PAGES: EndingPage[] = [
  {
    title: 'The Science Behind the Game',
    body: [
      'CHOP is inspired by Cas9, a protein bacteria use to cut invading DNA. Scientists repurposed it as a genome-editing tool: give Cas9 a short guide RNA (that’s GUIDE) matching a target sequence, and it finds and cuts that exact spot in DNA (that’s GENE).',
      'The catch is that Cas9 doesn’t always cut only where it’s told to. DNA sequences that merely resemble the target can get cut too — an “off-target” edit. A widely cited 2013 study found some guide RNAs caused off-target cuts in human cells as often, or more often, than the intended one.',
      'ACE is inspired by anti-CRISPR proteins: small proteins, first found in viruses that infect bacteria, that block Cas9 and its relatives from working. One of them, AcrIIA4, was shown to physically block the part of Cas9 that first recognizes DNA — it mimics the shape of DNA closely enough to occupy that spot itself.',
    ],
    research: [
      {
        label: 'Jinek et al. (2012), Science — how Cas9 cuts DNA',
        url: 'https://pubmed.ncbi.nlm.nih.gov/22745249/',
      },
      {
        label: 'Fu et al. (2013), Nature Biotechnology — off-target cutting in human cells',
        url: 'https://pubmed.ncbi.nlm.nih.gov/24022156/',
      },
    ],
  },
  {
    title: 'Where Anti-CRISPRs Came From',
    body: [
      'Anti-CRISPR proteins were discovered in 2013, in phages (viruses that infect bacteria). Bacteria use CRISPR systems like Cas9 as an immune system against phages, so phages evolved their own counter-proteins to disable that immune system and survive.',
      'Since then, dozens of anti-CRISPR families have been found, and they don’t all work the same way. Some, like AcrIIA4, block Cas9 from grabbing onto DNA in the first place, by mimicking DNA’s shape. Others let Cas9 bind but jam its cutting machinery afterward. There is no single universal “off switch” — each works on some CRISPR systems and not others.',
    ],
    research: [
      {
        label: 'Bondy-Denomy et al. (2013), Nature — the first anti-CRISPR proteins',
        url: 'https://pubmed.ncbi.nlm.nih.gov/23242138/',
      },
      {
        label: 'Dong et al. (2017), Nature — how AcrIIA4 blocks Cas9',
        url: 'https://pubmed.ncbi.nlm.nih.gov/28448066/',
      },
    ],
  },
  {
    title: 'Why This Matters',
    body: [
      'Controlling exactly when and where a genome editor is active is one of the open problems in making CRISPR-based medicine safer. An anti-CRISPR that can be switched on at the right moment could, in principle, limit how long an editor stays active in a cell — fewer chances for an off-target cut.',
      'That’s still an active area of research, not a solved problem, and the right anti-CRISPR for the job depends on exactly which CRISPR system is being used.',
    ],
  },
  {
    title: 'What We Simplified',
    body: [
      'Proteins don’t run, jump, or carry a stopwatch. CHOP, GUIDE, ACE and the other characters are fictional stand-ins for real molecules, which interact through chemistry and chance, not intention or urgency.',
      'The four-stage countdown (searching, locking on, gripping, cutting) is a gameplay pacing device, not a measured reaction timeline. SNIP, FREEZE, and every hero’s special ability are fictional, as are all damage values, timers, and the specific assignment of which anti-CRISPR “stops” which boss — those pairings are marked for scientific review, not settled fact.',
      'A real anti-CRISPR protein doesn’t “decide” to protect one DNA site over another; whether an edit happens where you want it to depends on a lot of factors working together, not a single switch.',
    ],
  },
  {
    title: 'Meet the Scientist',
    body: [
      'Original game concept contributed by a researcher at the Broad Institute.',
      '[Name, biography and interview pending written approval, per studio policy.]',
    ],
  },
  {
    title: 'Explore the Research',
    body: [
      'Journal of the American Chemical Society (2026). doi:10.1021/jacs.5c19089',
      'Proceedings of the National Academy of Sciences (2025). doi:10.1073/pnas.2426960122',
      '[Further reading and a scientific reviewer: placeholders, pending review.]',
    ],
  },
];
