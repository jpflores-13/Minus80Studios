# SHORTCUT. — Science notes

**Spoiler file.** Players see only the city until the campaign is finished. Nothing here is shown in the game yet.

SHORTCUT. is built on **loop extrusion**: ring-shaped cohesin complexes load onto DNA and enlarge loops until they
are stopped, often by CTCF bound in a particular orientation. The game keeps the rules and swaps the nouns.

This file is the source of truth for every scientific claim the game will make. **References below are
placeholders**: they describe what source is needed and must be filled in and checked by a scientist before any of
this reaches players. Do not cite from memory.

## Mapping

| In the city                         | In the cell                                      | How faithful                                        |
| ----------------------------------- | ------------------------------------------------ | --------------------------------------------------- |
| The road, numbered addresses        | A stretch of chromosome, split into genomic bins | Abstraction: one dimension, fixed bin size          |
| Shortcut machine                    | Cohesin complex extruding a loop                 | Core idea                                           |
| Depot                               | Cohesin loading site                             | Simplified: loading is local and at a fixed rate    |
| Each end moving on its own          | Two-sided extrusion with independent sides       | Modelling choice; see open questions                |
| Random pace                         | Stochastic stepping                              | Speeds are gameplay numbers, not measured rates     |
| Machine lifetime                    | Cohesin residence time before release            | Exponential lifetimes; mean is a gameplay number    |
| Checkpoint and its arrow            | CTCF site and motif orientation                  | Rule follows the orientation convention below       |
| Checkpoint reliability, slipping    | Imperfect, dynamic CTCF blocking                 | Probabilities are gameplay numbers                  |
| Inward-facing pair holds a shortcut | Convergent CTCF sites anchoring a loop           | Core idea                                           |
| Machines can't pass each other      | Cohesin–cohesin collisions                       | Simplified; see open questions                      |
| Supplier / customer                 | Enhancer / promoter                              | Analogy only                                        |
| Delivery is likely, not certain     | Contact does not guarantee activation            | Analogy only; rates are gameplay numbers            |
| Districts, mix-ups, border guards   | Domains (TADs), insulation, boundaries           | Qualitative                                         |
| City Connectivity Map               | Contact map (Hi-C-style), time-averaged          | Computed from the simulation the same way in spirit |

### Checkpoint rule

A checkpoint facing right (→) stops ends moving left; facing left (←) stops ends moving right. A → … ← pair
therefore holds a shortcut between them, the game's version of convergent CTCF sites anchoring a loop.
`tests/extrusion.test.ts` pins this rule down.

## Claims we plan to make at the reveal (need sources)

1. Cohesin extrudes loops of DNA. — **[REF NEEDED: loop extrusion model, theory]**, **[REF NEEDED: direct
   observation of extrusion, single molecule]**
2. Extrusion is usually halted by CTCF, and orientation matters (convergent sites anchor loops). — **[REF NEEDED:
   high-resolution contact maps showing convergent CTCF at loop anchors]**, **[REF NEEDED: motif inversion
   experiment]**
3. Cohesin is released after a limited residence time. — **[REF NEEDED: cohesin release factor and residence time]**
4. Loops are dynamic rather than permanent. — **[REF NEEDED: live-cell imaging of loop dynamics]**
5. Removing CTCF or cohesin changes domains and insulation. — **[REF NEEDED: acute CTCF depletion]**,
   **[REF NEEDED: acute cohesin depletion]**
6. Enhancer–promoter contact does not by itself guarantee transcription. — **[REF NEEDED: contact vs. activation]**

## Open questions (check before the reveal)

- Two independent sides versus one-sided extrusion: how to describe this honestly in one sentence.
- Whether to let machines pass each other (in-vitro evidence of cohesin traversal) or keep blocking for the puzzle.
- Whether to show loading as targeted (depots) or diffuse.
- Wording for the analogy between deliveries and transcription without overclaiming.

## Gameplay abstractions (say so in the reveal)

Every number in `src/config/tuning.ts` is chosen for play, not measured. The road is short and one-dimensional,
time runs in seconds, and the map is averaged over a single minute.
