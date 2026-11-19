# Science — Snail Assassin

> **Integrity rule:** player-facing science text may only use statements marked **Verified** below, and only
> after review by a cone-snail researcher. Never add findings, numbers, toxin assignments, citations, or
> endorsements from memory or AI generation. Add an open question instead.

**Status (2026-11-19):** bibliographic details were checked against Crossref and PubMed. Biological statements are
based on the papers' **abstracts only**. Full-text reading and expert review are pending.

Labels: **Verified** = stated in a cited abstract · **Hypothesis** = proposed by the authors · **Abstraction** = our gameplay invention.

## References

| Key                  | Citation                                                                                                                                | Link                                                |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Safavi-Hemami 2015   | _Specialized insulin is used for chemical warfare by fish-hunting cone snails._ PNAS 112:1743–1748                                      | https://doi.org/10.1073/pnas.1423857112             |
| Ahorukomeye 2019     | _Fish-hunting cone snail venoms are a rich source of minimized ligands of the vertebrate insulin receptor._ eLife 8:e41574              | https://doi.org/10.7554/eLife.41574                 |
| Yeung 2024           | _Fish-hunting cone snail disrupts prey's glucose homeostasis with weaponized mimetics of somatostatin and insulin._ Nat Commun 15:6408  | https://doi.org/10.1038/s41467-024-50470-2          |
| Dutt 2019            | _The α1-adrenoceptor inhibitor ρ-TIA facilitates net hunting in piscivorous Conus tulipa._ Sci Rep 9:17841                              | https://doi.org/10.1038/s41598-019-54186-y          |
| Olivera 2015         | _Prey-capture strategies of fish-hunting cone snails: behavior, neurobiology and evolution._ Brain Behav Evol 86:58–74                  | https://doi.org/10.1159/000438449                   |
| Dutertre 2014        | _Evolution of separate predation- and defence-evoked venoms in carnivorous cone snails._ Nat Commun 5:3521                              | https://doi.org/10.1038/ncomms4521                  |
| Ramiro 2022          | _Somatostatin venom analogs evolved by fish-hunting cone snails: from prey capture behavior to identifying drug leads._ Sci Adv 8(12)   | https://doi.org/10.1126/sciadv.abk1410 (PMC8942377) |
| Koch 2026            | _From neuropeptides to toxins: illuminating the origins of venom complexity in cone snails._ Mol Biol Evol 43:msag206                   | https://doi.org/10.1093/molbev/msag206              |
| Bjørn-Yoshimoto 2025 | _Cone snail venom-inspired somatostatin receptor 4 (SSTR4) agonists as new drug leads for peripheral pain._ Sci Rep 15:42638            | https://doi.org/10.1038/s41598-025-26820-5          |
| Himaya 2015          | _Comparative venomics reveals the complex prey capture strategy of the piscivorous cone snail Conus catus._ J Proteome Res 14:4372–4381 | https://doi.org/10.1021/acs.jproteome.5b00630       |
| Schulz 2019          | _The high speed radular prey strike of a fish-hunting cone snail._ Curr Biol 29:R788–R789                                               | https://doi.org/10.1016/j.cub.2019.07.034           |

## Evidence table: implemented character (Atlas, _Conus geographus_)

| Ability             | Plain-language inspiration                                                                                               | Status               | Sources                          | Intentional simplifications                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------- | -------------------------------- | --------------------------------------------------------------- |
| Hunting style       | Net-engulfment: the snail captures fish with its expanded false mouth                                                    | Verified             | Safavi-Hemami 2015; Olivera 2015 | One shared reef; three fish needed                              |
| Q · Glucose Crash   | A specialised venom insulin that causes dangerously low blood sugar in fish                                              | Verified             | Safavi-Hemami 2015               | Released as a drifting cloud; effects on a compressed timescale |
| (Q) delivery        | The insulin is thought to be released into the water as part of a venom mixture that disorients fish                     | **Hypothesis**       | Safavi-Hemami 2015               | On-screen wording must say "scientists think"                   |
| E · System Override | A venom molecule that mimics a fish hormone and stops the fish's own blood-sugar rescue, making the insulin effect worse | Verified             | Yeung 2024                       | Activated separately from Q (in nature it is part of the venom) |
| SPACE · Engulf      | Capturing several weakened fish at once                                                                                  | Verified (behaviour) | Olivera 2015                     | Capture threshold on a game "vulnerability" score               |

Catalyst (_C. catus_) and Nightshade (_C. tulipa_) rows are added in Milestones 3–4, after full-text review. Open
questions are listed below.

## Gameplay model (all **Abstraction**)

All constants live in `src/config/tuning.ts`. They are balancing parameters, not measured biology.

**Metabolic module** (`src/systems/metabolic.ts`). Glucose state g, insulin-like exposure I, recovery override O, all in [0, 1]:

```
dg/dt = −drop·I·g + recovery·(1 − g)·(1 − O)
I, O decay exponentially (τ_I, τ_O); clouds add exposure while a fish is inside them
swim performance = min + (1 − min)·g²
```

O scales only the recovery term, so it does almost nothing to a healthy fish but extends the low-glucose window
after an insulin hit. With current tuning, insulin alone settles just above the catch threshold, and only the
combination makes fish catchable. This is a game rule chosen to echo the qualitative relationship in Yeung 2024,
not a model of fish physiology.

**Escape module** (`src/systems/escape.ts`). Awareness a ∈ [0, 1] rises with snail proximity and motion, scaled by
`responsiveness` (the hook for Nightshade's escape-dampening ability) and by glucose-dependent alertness, and decays
otherwise. Fish flee with hysteresis.

**Capture.** Vulnerability = 1 − g. Engulf captures up to N fish within its radius whose vulnerability ≥ threshold.

**Other abstractions.** Venom reserve, regeneration, cooldowns, a 3-fish objective, a time limit, a sinusoidal reef current.

## Open questions for expert review

- Which hunting-strategy terms (e.g., "taser-and-tether", named venom "cabals") are appropriate for each species on screen?
- Catalyst (_C. catus_): which venom-component descriptions are safe to show in plain language? (See Himaya 2015 and Schulz 2019.)
- Nightshade (_C. tulipa_): Dutt 2019 reports that ρ-TIA may act alone. Should the Ghost Signal → Silent Tide combo be described as complementary rather than synergistic?
- Is there any evidence of a somatostatin-like override component in _C. tulipa_? (None assigned until confirmed.)
- Ziconotide facts for the ending: verify the source species and approval details against an authoritative review.
- Image sourcing: licensed photographs of each species (e.g., Wikimedia Commons, with per-file license checks).

## Links used in the game

Every link shown in the game (`src/content/science.ts`) must appear here (enforced by `tests/content.test.ts`).
PubMed and open-access pages are preferred because some publisher DOI pages block automated link checks.

- https://pubmed.ncbi.nlm.nih.gov/31430472/ (Schulz 2019)
- https://pubmed.ncbi.nlm.nih.gov/26322961/ (Himaya 2015)
- https://pubmed.ncbi.nlm.nih.gov/26397110/ (Olivera 2015)
- https://pubmed.ncbi.nlm.nih.gov/25605914/ (Safavi-Hemami 2015)
- https://doi.org/10.1038/s41467-024-50470-2 (Yeung 2024, open access)
- https://doi.org/10.1038/s41598-019-54186-y (Dutt 2019, open access)
- https://pubmed.ncbi.nlm.nih.gov/38779019/ (Lin et al. 2024, _A comprehensive review on ziconotide_, Heliyon; source for the ending's medicine screen)

## Pending documentation

The evidence-table rows for Catalyst (_C. catus_) and Nightshade (_C. tulipa_) still need to be written by the team
and reviewed by a cone-snail researcher. Their in-game abilities are labelled as inspired by the papers above, and the
ending text is marked as a draft.
