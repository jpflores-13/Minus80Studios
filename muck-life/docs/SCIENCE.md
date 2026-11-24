# SCIENCE: MUCK LIFE

The single source of truth for the science in MUCK LIFE. Every player-facing claim lives in
`src/content/science.ts` and must trace back to this file. Claim-by-claim review status is tracked in
[`SCIENTIFIC_REVIEW.md`](SCIENTIFIC_REVIEW.md). This file is the source of truth only once a human has
validated it.

**Source read in full:** Stein & Cardon (2026), _New Phytologist_ 252(5): 1832–1842,
doi:[10.1111/nph.71593](https://doi.org/10.1111/nph.71593). It is open access (CC BY 4.0), and the full
text was read via Europe PMC (PMC13738676). The MBL news story (19 Nov 2026) was read too. Quotes below
are short and only for verification. The game paraphrases.

## The study in one paragraph

Four narrow-leaf cattail (_Typha angustifolia_) plants, with sediment collected from a Parker River marsh
feeding the Plum Island estuary (Newbury, MA), were grown one after another in laboratory rhizoboxes
(May 2024 – April 2026). A hand-made oxygen-sensitive planar optode on one clear wall imaged sediment
oxygen every 3–5 min, while an LI-6800 measured leaf gas exchange. The authors compared oxygen changes
caused by the day–night cycle with changes caused by root and rhizome development. Development won by a
wide margin.

## Measured findings (used in the game)

| Finding                                                           | Value                                                                                                         | Where in paper                  |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Sediment with no roots or rhizomes                                | anoxic                                                                                                        | Results, sediment oxygen demand |
| Oxygen when new adventitious roots or rhizomes colonized sediment | rose from 0 to 25–35% saturation                                                                              | Results                         |
| Strongly oxygenated regions, typical                              | "regularly 25–30%" saturation                                                                                 | Abstract                        |
| Diel variation                                                    | c. 5% (abstract); mean daily max–min c. 3% across three plants                                                | Abstract; Results, Fig. 5       |
| Pool duration at a sediment location, mean ± SE (Table 1)         | rhizomes 78 ± 28 h (n = 3); adventitious roots 95 ± 17 h (n = 4); lateral roots 502 ± 170 h (n = 4)           | Table 1                         |
| Longest lateral-root pool                                         | 888 h (Plant 2)                                                                                               | Table 1                         |
| One lateral series was cut off                                    | > 144 h, used as 144 in the mean                                                                              | Table 1 footnote                |
| New adventitious roots from rhizomes                              | often erupted 3–7 d after rhizome establishment                                                               | Results                         |
| Adventitious-root pools                                           | appeared with the growing tip, disappeared c. 2–5 d after tissue was established                              | Results; Discussion             |
| Lateral-root pools                                                | appeared with lateral emergence, often days after the parent pool vanished; lasted weeks, faded gradually     | Results, Fig. 3                 |
| Oxygen pools at night                                             | persisted, and increased gradually through the night after a ~2 h drop                                        | Results, Fig. 4–5               |
| Diel shape                                                        | rise 2–3 h after lights-on, decline through the day, sharp drop ~2 h after lights-off, gradual rise overnight | Results                         |
| Diel pulsing                                                      | undetectable in one plant; most evident around dense lateral roots                                            | Methods; Results                |
| Sediment oxygen demand                                            | injected oxygen peaked c. 50% and returned to anoxia in 1.5 (± 1) h; c. 3 mg O₂ L⁻¹ h⁻¹                       | Results                         |
| Flushing with anoxic water                                        | oxygen reappeared around roots within minutes, recovered in c. 1 h                                            | Results                         |
| Rhizobox                                                          | 39.4 × 20.3 × 3.8 cm external; optode 26 × 13 cm                                                              | Methods                         |
| Growth-room light                                                 | 05:00–19:00, c. 500 µmol m⁻² s⁻¹ PAR                                                                          | Methods                         |
| Plants                                                            | 4, studied sequentially; vegetative only (no reproductive shoots)                                             | Methods                         |

## Background stated in the paper (used in the game)

- Most wetland plants have aerenchyma that lets oxygen reach growing root tips despite soil anoxia.
  _T. angustifolia_ tissue porosity is up to c. 32% in roots and c. 74% in leaves (the paper cites
  Matsui & Tsuchiya 2006; Tornberg et al. 1994).
- Radial oxygen loss (ROL) is oxygen leaking from roots into soil (term from Armstrong 1980). The pool
  measured in sediment depends on ROL _and_ on consumption by microbial respiration and abiotic
  oxidation.
- _Typha_ spreads by horizontal rhizomes ending in new ramets of 5–10 leaves up to 3 m tall. Adventitious
  roots from rhizomes explore new sediment. Short, fine lateral roots from them maximize nutrient uptake.
- _Typha_ adventitious roots develop a suberized, double-layered Casparian strip; _T. angustifolia_
  lateral roots do not (Seago et al. 1999). Laterals originate in the centre of the parent root and
  perforate its ROL barrier as they emerge.
- ROL can stimulate aerobic decomposition (potentially less soil carbon storage), rhizosphere methane
  consumption, nitrification/denitrification, and redox-sensitive metal transformations.
- _Typha_ is of interest for invasiveness and for remediation of wastewater and metal contamination.

## Authors' hypotheses (labelled as such in the game)

- Pools fading behind growing tips may result from suberization of the Casparian strip plus continuous
  sediment oxygen demand ("We speculate…").
- Night-time ROL may be sustained by incomplete stomatal closure and/or cuticular conductance. The
  mechanism "remains unclear".
- Oxygenation from new rhizomes and roots may be particularly intense in late summer, based on earlier
  biomass data and models.

## What the study did **not** do

- It did not measure greenhouse gas emissions (stated in the MBL article). The game never computes
  methane or carbon fluxes.
- It was a lab study of four plants. No field measurements, no other species.

## General background (not from the paper)

- Without oxygen, sediment microbes use other electron acceptors (nitrate, Fe/Mn oxides, sulfate) and
  some produce methane. Standard redox-ladder biogeochemistry, labelled "General background" in game.
- Planar optodes use an oxygen-quenched luminescent dye plus a reference dye, imaged with a camera and
  converted to % saturation by calibration (Larsen et al. 2011, the method the study followed).

## People

See [`SCIENTIST_PROFILES.md`](SCIENTIST_PROFILES.md). Only published roles and contributions are used.

## The model

See [`SCIENCE_TO_GAMEPLAY.md`](SCIENCE_TO_GAMEPLAY.md) for the growth and oxygen algorithms, every
parameter, and which are measured, simulated, or arcade values.
