# OFF TARGET. — Science notes

The game is fiction inspired by CRISPR genome editing and anti-CRISPR proteins. It deliberately keeps science
words out of play during the campaign. The ending (`src/content/science.ts`, the "DID YOU KNOW?" reveal in
`EndingScene.ts`) shows the explanatory pages, with real, checked citations.

## Status

- The ending now carries real scientific content (not placeholders) for "The Science Behind the Game," "Where
  Anti-CRISPRs Came From," and "Why This Matters," each with checked references. "Meet the Scientist" and the
  name/biography line in "Explore the Research" remain **placeholders** pending the contributing scientist's
  written approval, per this repo's public-credit rule.
- Character inspirations in `src/content/characters.ts` marked **REVIEW** still need scientific sign-off on the
  specific hero/boss pairings. SNIP and FREEZE are fictional and not assigned to any real protein.
- Countdowns, stages, compatibility rules, power-ups and scores remain gameplay fiction, not kinetics.

## References (each checked against PubMed/the publisher before use)

- Jinek, Chylinski, Fonfara, Hauer, Doudna, Charpentier (2012). "A Programmable Dual-RNA-Guided DNA Endonuclease
  in Adaptive Bacterial Immunity." _Science_ 337(6096):816–821. PMID 22745249.
- Fu, Foden, Khayter, Maeder, Reyon, Joung, Sander (2013). "High-Frequency Off-Target Mutagenesis Induced by
  CRISPR-Cas Nucleases in Human Cells." _Nature Biotechnology_ 31(9):822–826. PMID 24022156.
- Bondy-Denomy, Pawluk, Maxwell, Davidson (2013). "Bacteriophage Genes That Inactivate the CRISPR/Cas Bacterial
  Immune System." _Nature_ 493:429–432. PMID 23242138.
- Dong, Guo, Wang, et al. (2017). "Structural Basis of CRISPR–SpyCas9 Inhibition by an Anti-CRISPR Protein."
  _Nature_ 546:436–439. PMID 28448066.

## References provided by the contributing scientist

- Journal of the American Chemical Society (2026). doi:10.1021/jacs.5c19089
- Proceedings of the National Academy of Sciences (2025). doi:10.1073/pnas.2426960122

## What the reveal does not claim

- That CHOP, GUIDE, ACE, SNIP, or FREEZE are literal molecules, or that any of them "decide" or "intend" anything.
- That the specific hero-stops-boss compatibility rules in `characters.ts` map onto a verified real mechanism —
  those are marked REVIEW and are gameplay design, not biology, until checked.
- That anti-CRISPR proteins have a single universal mechanism; the cited papers describe specific examples
  (AcrIIA4 blocking Cas9 by DNA mimicry), not anti-CRISPRs in general.

## Credits

Original game concept: a researcher at the Broad Institute. Name, biography and interview to be added once
approved in writing (public repository rule).
