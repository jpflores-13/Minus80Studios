# SHORTCUT. — Science notes

**Spoiler file.** During the campaign players see only the city. The science appears in the ending reveal
(`src/content/reveal.ts`) and in Science Mode (`src/content/terms.ts`), both unlocked after Level 8.

SHORTCUT. is built on **loop extrusion**: ring-shaped cohesin complexes load onto DNA and enlarge loops until they
are stopped, often by CTCF bound in a particular orientation. The game keeps the rules and swaps the nouns.

This file is the source of truth for every scientific claim the game makes. **References below are
placeholders**: they describe what source is needed and must be filled in and checked by a scientist before
public release. Do not cite from memory, and do not name papers, labs or people in the game until approved.

## Mapping

| In the city                         | In the cell                                       | How faithful                                               |
| ----------------------------------- | ------------------------------------------------- | ---------------------------------------------------------- |
| The road, numbered addresses        | A stretch of chromatin, split into genomic bins   | Abstraction: one dimension, fixed bin size                 |
| Shortcut machine                    | Cohesin complex extruding a loop                  | Core idea                                                  |
| Depot                               | Cohesin loading (NIPBL-associated)                | Simplified: loading only at marked sites, at a fixed rate  |
| Maintenance (Level 6)               | Cohesin release (WAPL-associated), residence time | Exponential lifetimes; means are gameplay numbers          |
| Each end moving on its own          | Two-sided extrusion with independent sides        | Modelling choice; see open questions                       |
| Random pace                         | Stochastic stepping                               | Speeds are gameplay numbers, not measured rates            |
| Checkpoint and its arrow            | CTCF site and motif orientation                   | Rule follows the orientation convention below              |
| Checkpoint reliability, slipping    | Imperfect, dynamic CTCF blocking                  | Probabilities are gameplay numbers                         |
| Inward-facing pair holds a shortcut | Convergent CTCF sites anchoring a loop            | Core idea                                                  |
| Machines can't pass each other      | Cohesin–cohesin collisions                        | Simplified; see open questions                             |
| Delivery trucks (Level 5)           | Transcribing RNA polymerase moving cohesin        | Push/block probabilities are configurable gameplay numbers |
| Supplier / customer                 | Enhancer / promoter (gene)                        | Analogy only                                               |
| Delivery is likely, not certain     | Contact does not guarantee activation             | Analogy only; rates are gameplay numbers                   |
| Wrong connections (Level 4)         | Non-cognate enhancer–promoter contacts            | Analogy for regulatory specificity                         |
| Districts, mix-ups, border guards   | Domains (TADs), insulation, boundaries            | Qualitative                                                |
| Heat advisory (Level 7)             | Environmental perturbation                        | Illustrative only, not a model of a specific experiment    |
| A New Identity (Level 8)            | Cell identity: same genome, different activity    | Qualitative                                                |
| City Connectivity Map               | Simulated contact propensity (Hi-C-inspired)      | Model output, labelled as such; see below                  |

### Checkpoint rule

A checkpoint facing right (→) stops ends moving left; facing left (←) stops ends moving right. A → … ← pair
therefore holds a shortcut between them, the game's version of convergent CTCF sites anchoring a loop.
`tests/extrusion.test.ts` pins this rule down.

### Contact model (the City Connectivity Map)

Every 0.5 simulated seconds, the engine computes an **effective distance** between every pair of addresses: the
fewest steps along the road, where each shortcut counts as one step between its two ends. Contact propensity is
taken as `1 / effective distance` and averaged over time. This is a deliberately simple stand-in for a polymer
simulation. Its exponent was chosen for its shape, not fitted to data. It produces the familiar features of
contact maps: a bright diagonal, dots at loop anchors, stripes where one end is held, and squares for domains.
It is **not** an experimentally measured Hi-C map, and the game says so wherever the map appears.

### Blueprint similarity metric

`similarity()` in `src/systems/contacts.ts`: each map is divided by its own distance baseline (observed /
expected, the mean at each separation), then the two are compared with a Pearson correlation over every pair at
least two addresses apart. Negative correlations count as 0; the result is scaled to 0–100. Dividing by the
baseline means players match the pattern, not just the overall amount of contact. Maps are measured over 1,200
simulated seconds on fixed seeds (target and player use different seeds, so even the hidden settings don't
score exactly 100).

## Claims made at the reveal (each needs a checked source)

1. Cohesin is thought to extrude loops of DNA. — **[REF NEEDED: loop extrusion model, theory]**,
   **[REF NEEDED: direct observation of extrusion, single molecule]**
2. CTCF binds oriented sites; loops often end at convergent pairs; inverting a site can change loops. —
   **[REF NEEDED: high-resolution contact maps, convergent CTCF at loop anchors]**, **[REF NEEDED: motif inversion]**
3. NIPBL is involved in cohesin loading and WAPL in its release; residence time affects loop size. —
   **[REF NEEDED: loading]**, **[REF NEEDED: release and residence time]**
4. Loops and boundaries help divide chromosomes into domains (TADs). — **[REF NEEDED: domains and insulation]**,
   **[REF NEEDED: acute CTCF or cohesin depletion]**
5. Enhancers can regulate genes at a distance; contact doesn't by itself guarantee activation. —
   **[REF NEEDED: contact vs. activation]**
6. Transcription can move cohesin; how much this matters in cells is still being studied. — **[REF NEEDED]**
7. Cells change gene activity under stress such as heat; some studies report changes to genome folding. —
   **[REF NEEDED]** (if no suitable source is approved, remove the folding half of this sentence)
8. Different cell types use the same genome differently and fold it differently. — **[REF NEEDED]**
9. Loop extrusion isn't the only folding mechanism (e.g. compartmentalisation). — **[REF NEEDED]**
10. Open questions remain on one- vs. two-sided extrusion and whether cohesins can pass each other. —
    **[REF NEEDED]**

## Open questions (check before release)

- Two independent sides versus one-sided extrusion: how to describe this honestly in one sentence.
- Whether to let machines pass each other (in-vitro evidence of cohesin traversal) or keep blocking for the puzzle.
- Wording for the analogy between deliveries and transcription without overclaiming.
- Whether the heat-advisory claim (7) can be supported; otherwise soften it further.

## Gameplay abstractions (said in the reveal's "Where the analogy breaks down")

Every number in `src/config/tuning.ts` and the level files is chosen for play, not measured. The road is short and
one-dimensional, time runs in seconds, and maps are averaged over minutes of simulated time.
