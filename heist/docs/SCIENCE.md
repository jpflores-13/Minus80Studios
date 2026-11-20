# HEIST. — Science notes

HEIST. is a stealth-action game on the surface. Underneath, the Folder's simulation engine
(`src/systems/extrusion.ts`) is the same ordered-pathway, independent-endpoint model used for
cohesin-mediated loop extrusion in 3D genome organization. None of this is shown to players during the
main campaign — the brief is explicit that the science stays hidden until a later reveal.

## Status

- The ending now carries real scientific content (not placeholders) in `src/content/science.ts` (the "DID
  YOU KNOW?" reveal in `EndingScene.ts`): cohesin and loop extrusion, CTCF orientation at loop anchors, and
  the direct biochemical observation of cohesin extruding DNA, each with checked references. "Meet the
  Scientist" and "Credits" remain **placeholders** pending the contributing scientist's written approval,
  per this repo's public-credit rule.
- Every timer, cooldown, charge count and score in this game is a gameplay-balancing number, not a
  measured molecular rate.

## The hidden mapping (internal only — never shown during the campaign)

| In the game                                                | In the cell                                                                                            |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| The service corridor (an ordered line of positions)        | A chromatin fiber, as an ordered sequence of genomic positions                                         |
| The Folder                                                 | A cohesin complex                                                                                      |
| The Folder's left and right ends, expanding independently  | Loop extrusion from a single loading site, bidirectionally                                             |
| Anchors (stop an end, from either direction)               | A simplified stand-in for CTCF-associated extrusion barriers                                           |
| The fold's lifetime, then release                          | Cohesin residence time / release (e.g., WAPL-associated unloading)                                     |
| Deploying the Folder at a corridor position                | Cohesin loading (e.g., NIPBL-associated)                                                               |
| The link between two positions once the ends are far apart | A chromatin loop bringing two distant positions into proximity                                         |
| Guards re-planning through an open fold                    | Illustrative "molecular traffic" interacting with an extruder — **not implemented as directional yet** |

**What the current build does _not_ implement**, even as a hidden mechanic: directional barriers (anchors
here stop an end arriving from _either_ side, unlike CTCF's orientation-dependent blocking cited below), a
bypass/permeability probability, or multiple interacting Folder instances. These are called out in the
brief's later-job progression and are deliberately left for later phases rather than built and left unused.

## References (each checked against PubMed/the publisher before use)

- Rao, Huntley, Durand, et al. (2014). "A 3D Map of the Human Genome at Kilobase Resolution Reveals
  Principles of Chromatin Looping." _Cell_ 159(7):1665–1680. PMID 25497547.
- Fudenberg, Imakaev, Lu, Goloborodko, Abdennur, Mirny (2016). "Formation of Chromosomal Domains by Loop
  Extrusion." _Cell Reports_ 15(9):2038–2049. PMID 27210764.
- Guo, Xu, Bhatt, et al. (2015). "CRISPR Inversion of CTCF Sites Alters Genome Topology and
  Enhancer/Promoter Function." _Cell_ 162(4):900–910. PMID 26276636.
- Davidson, Bauer, Goetz, Tang, Wutz, Peters (2019). "DNA Loop Extrusion by Human Cohesin." _Science_
  366(6471):1338–1345. PMID 31753851.

These four cover the facts the original brief relied on: cohesin extruding loops with two independently
moving ends (Fudenberg, Davidson), real chromatin loops mapped genome-wide (Rao), and CTCF sites acting as
directional, orientation-dependent anchors rather than symmetric barriers (Guo) — the direct basis for a
planned directional-Anchor mechanic in a later job. NIPBL-associated loading and WAPL-associated release are
not yet individually cited and stay out of the reveal until they are.

## What the reveal does not claim

- That the Folder, corridor, or Anchors are literal molecules, or that any of them "decide" or "intend"
  anything.
- That the current build's non-directional Anchors are a claim about how CTCF works — they're a stated
  simplification, corrected in the reveal itself.
- That cohesin loading, extrusion or release are goal-directed the way deploying, reeling in, or releasing
  the Folder is a player's deliberate choice.

## Gameplay abstractions (unchanged from the original brief)

- The corridor is one-dimensional and the building's rooms are a visual overlay on it; a real chromatin
  fiber is a three-dimensional polymer, not a hallway.
- Anchors in this build block an end from both directions, not just one — this is a stated placeholder, not
  a claim about CTCF orientation.
- Fold speed, lifetime, cooldown and charge counts are gameplay-balancing numbers, chosen for the puzzle,
  not measured molecular rates.
- "Connecting" two positions guarantees a usable passage in the game; contact between two genomic
  positions in a cell does not by itself guarantee any particular biological outcome.
- A Folder deploying, reeling in, and releasing is a deliberate, player-triggered action; cohesin loading,
  extrusion and release are not goal-directed.

## Open questions for a genome-architecture researcher

- Whether to add directional anchors (CTCF-orientation-style) in a later job, and how to telegraph
  "direction" to players without scientific jargon (the brief suggests simple arrow icons on security
  gates).
- A fair, simple way to represent multiple interacting Folders without implying a specific, verified
  collision rule between real cohesin complexes.
- Whether "molecular traffic" (moving guards disrupting a fold) should be described at all in a future
  reveal update, or left as a loose, clearly-labelled analogy.

## Credits

Inspired by published research. Name, biography and interview to be added once approved in writing (public
repository rule).
