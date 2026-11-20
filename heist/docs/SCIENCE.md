# HEIST. — Science notes

HEIST. is a stealth-action game on the surface. Underneath, the Folder's simulation engine
(`src/systems/extrusion.ts`) is the same ordered-pathway, independent-endpoint model used for
cohesin-mediated loop extrusion in 3D genome organization. None of this is shown to players during the
main campaign — the brief is explicit that the science stays hidden until a later reveal, which is not
yet built (this is a Phase 1 prototype).

## The hidden mapping (internal only — never shown in Phase 1)

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

**What Phase 1 does _not_ implement**, even as a hidden mechanic: directional barriers (anchors here stop an
end arriving from _either_ side, unlike CTCF's orientation-dependent blocking described in the brief), a
bypass/permeability probability, or multiple interacting Folder instances. These are called out in the brief's
Job 02–05 progression and are deliberately left for later phases rather than built and left unused.

## Facts the brief relies on (to verify with sources before any reveal is built)

None of these are shown to players. Each needs a checked primary source before a Science Mode, reveal, or
any public-facing text references them.

- Cohesin complexes extrude loops of DNA, with two ends that can move independently from a loading site.
  **[REF NEEDED]**
- CTCF sites are directional (an "orientation"), and convergent CTCF sites are associated with stable loop
  anchors. **[REF NEEDED]**
- Cohesin loading involves NIPBL; release involves WAPL. **[REF NEEDED]**
- Cohesin residence time and cohesin movement interact with transcription machinery ("molecular traffic").
  **[REF NEEDED]**

## Gameplay abstractions (to state plainly if a reveal is ever built)

- The corridor is one-dimensional and the building's rooms are a visual overlay on it; a real chromatin
  fiber is a three-dimensional polymer, not a hallway.
- Anchors in Phase 1 block an end from both directions, not just one — this is a placeholder, not a claim
  about CTCF orientation.
- Fold speed, lifetime, cooldown and charge counts are gameplay-balancing numbers, chosen for the puzzle,
  not measured molecular rates.
- "Connecting" two positions guarantees a usable passage in the game; contact between two genomic
  positions in a cell does not by itself guarantee any particular biological outcome.
- A Folder deploying, reeling in, and releasing is a deliberate, player-triggered action; cohesin loading,
  extrusion and release are not goal-directed.

## Open questions for a genome-architecture researcher

- Whether to add directional anchors (CTCF-orientation-style) in Phase 2, and how to telegraph "direction"
  to players without scientific jargon (the brief suggests simple arrow icons on security gates).
- A fair, simple way to represent multiple interacting Folders (Job 05) without implying a specific,
  verified collision rule between real cohesin complexes.
- Whether "molecular traffic" (Job 04's moving guards disrupting a fold) should be described at all in a
  reveal, or left as a loose, clearly-labelled analogy.
