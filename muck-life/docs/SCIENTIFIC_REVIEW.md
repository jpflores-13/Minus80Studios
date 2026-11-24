# Scientific review checklist

A claim-by-claim audit trail for a domain scientist (wetland plant physiology or rhizosphere
biogeochemistry). **No claim has yet been reviewed by a domain scientist.** "Checked" means a developer
matched it against the full paper text.

| Claim (as shown in game)                                                                  | Source                                                  | Basis tag                      | Checked against source                   | Domain review                                          |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------ | ---------------------------------------- | ------------------------------------------------------ |
| Root-free sediment was anoxic                                                             | Paper, Results                                          | Measured                       | Yes                                      | Pending                                                |
| New roots/rhizomes raised O₂ from 0 to 25–35% saturation; "regularly 25–30%"              | Paper, Results + Abstract                               | Measured                       | Yes                                      | Pending                                                |
| Diel swing c. 5% (abstract), mean c. 3% (three plants)                                    | Paper, Abstract + Fig. 5                                | Measured                       | Yes                                      | Pending                                                |
| Pool durations: rhizome 78 ± 28 h, adventitious 95 ± 17 h, lateral 502 ± 170 h            | Paper, Table 1                                          | Measured                       | Yes                                      | Pending                                                |
| One lateral pool lasted ~888 h; one series cut off at > 144 h                             | Paper, Table 1                                          | Measured                       | Yes                                      | Pending                                                |
| Roots erupted from rhizomes 3–7 d after establishment                                     | Paper, Results                                          | Measured                       | Yes                                      | Pending                                                |
| Pools persisted at night and crept up overnight                                           | Paper, Results / Figs 4–5                               | Measured                       | Yes                                      | Pending                                                |
| Diel shape (rise after dawn, decline, drop after dusk, overnight rise)                    | Paper, Results                                          | Measured (shape used in model) | Yes                                      | Pending                                                |
| Injected O₂ drawn down in ~1.5 h; ~3 mg O₂ L⁻¹ h⁻¹                                        | Paper, Results                                          | Measured                       | Yes                                      | Pending                                                |
| After flushing with anoxic water, O₂ reappeared in minutes, recovered ~1 h                | Paper, Results                                          | Measured                       | Yes                                      | Pending                                                |
| Aerenchyma porosity up to c. 32% roots, c. 74% leaves                                     | Paper (citing earlier work)                             | From the paper                 | Yes                                      | Pending                                                |
| Rhizomes end in ramets of 5–10 leaves up to 3 m                                           | Paper intro (citing Grace & Harrison 1986)              | From the paper                 | Yes                                      | Pending                                                |
| Adventitious roots: suberized double Casparian strip; laterals lack it                    | Paper (citing Seago et al. 1999)                        | From the paper                 | Yes                                      | Pending                                                |
| Fading pools may be due to suberization + sediment demand                                 | Paper, Discussion                                       | Hypothesis                     | Yes                                      | Pending                                                |
| Night ROL mechanism unclear; maybe incomplete stomatal closure / cuticle                  | Paper, Discussion                                       | Hypothesis                     | Yes                                      | Pending                                                |
| Oxygenation may peak in late summer                                                       | Paper, Conclusions                                      | Hypothesis                     | Yes                                      | Pending                                                |
| ROL can affect decomposition, methane consumption, N cycling, metals                      | Paper, Intro + Conclusions                              | From the paper                 | Yes                                      | Pending                                                |
| The study did not measure greenhouse gases                                                | MBL News                                                | From the source                | Yes                                      | Pending                                                |
| Plants/sediment from Parker River marsh, Plum Island estuary; 4 plants, May 2024–Apr 2026 | Paper, Methods                                          | Measured / methods             | Yes                                      | Pending                                                |
| Rhizobox and optode dimensions; images every 3–5 min                                      | Paper, Methods                                          | Methods                        | Yes                                      | Pending                                                |
| Planar optode principle (luminescence quenched by O₂, reference dye, calibration)         | Larsen et al. 2011 (method followed)                    | General background             | Partly (principle not restated in paper) | Pending                                                |
| Anaerobic redox ladder (nitrate, Fe/Mn, sulfate, methanogenesis)                          | Textbook biogeochemistry                                | General background             | No specific citation                     | Pending: needs a citation if kept                      |
| Profiles: roles and contributions of Stein, Cardon, Thomas                                | Paper author contributions + acknowledgements; MBL News | Public record                  | Yes                                      | Pending (and see policy note in SCIENTIST_PROFILES.md) |

## Model claims (must stay labelled as simulation)

| Model behaviour                                               | Status                                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Simulated pool durations ~73 / 92 / 513 h                     | Tuned to match Table 1 means. Not a prediction.                          |
| Simulated region peaks 24–34% and diel swing ~3.9%            | Tuned. Gradient-limited release is a simplification.                     |
| Chemistry overlay (oxygenated microsites vs. oxygen-free mud) | Conceptual only. A 2% cut-off drawn as icons. No reactions are computed. |

## Open questions for a reviewer

1. Is "gradient-limited release toward an internal O₂ level" an acceptable simplification, or misleading?
2. Is the redox-ladder paragraph in Explore → Sediment redox chemistry fair as written?
3. Is showing roots as pale (young) → tan (mature) a reasonable visual for maturation?
