# Science — Queenless

> **Integrity rule:** player-facing text may only use statements marked **Verified** below. Never add findings,
> numbers, biographies, quotations, or endorsements that aren't in a cited source. Add an open question instead.

**Status (2026-11-22):** both citations below were checked against Crossref (the publisher's own metadata) before
being used in `src/content/science.ts`. Neither has been read in full by a human member of the team yet — see
**What still needs human review** at the bottom before this game is treated as fully reviewed.

Labels: **Verified** = stated in the cited source · **Abstraction** = our gameplay invention, not a measurement.

## Sources

| Key             | Source                                                                                                                                                                                            | DOI                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Crall 2018      | Crall, Gravish, Mountcastle, Kocher, Oppenheimer, Pierce & Combes (2018), "Spatial fidelity of workers predicts collective response to disturbance in a bumble bee colony", Nature Communications | https://doi.org/10.1038/s41467-018-03561-w |
| Ruttenberg 2026 | Ruttenberg, Wolf, Webb, Wyman, White, Melo, Traniello & Kocher (2026), "Workers adopt new roles and reshape social networks after queen loss in a bumble bee", Communications Biology             | https://doi.org/10.1038/s42003-026-10795-8 |

Both studies come out of Sarah Kocher's lab at Princeton, which studies the social behavior and genomics of bumble
bee colonies (genus _Bombus_).

## Verified statements

| #   | Statement (paraphrased)                                                                                                                                          | Source                                                                                       |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | Bumble bee workers differ from each other in how often they forage, care for brood, or stay in the nest, independent of any disturbance                          | Crall 2018                                                                                   |
| 2   | A relatively small number of workers do most of the foraging in a colony                                                                                         | Crall 2018                                                                                   |
| 3   | A worker's spatial fidelity (where it spends time in the nest) predicts how quickly and strongly it responds when the colony is disturbed                        | Crall 2018                                                                                   |
| 4   | Researchers tracked whole bumble bee colonies after queen removal using automated tracking, quantifying over 80 million individual social interactions           | Ruttenberg 2026                                                                              |
| 5   | Queenless colonies show increased behavioral variation among workers compared to queenright colonies                                                             | Ruttenberg 2026                                                                              |
| 6   | A subset of workers become unusually central to the colony's social network after the queen is lost, with elevated movement and reproductive activity            | Ruttenberg 2026                                                                              |
| 7   | That elevated activity in those workers was not present, or not expressed the same way, while the queen was present                                              | Ruttenberg 2026                                                                              |
| 8   | A queenright colony's social network is more centralized; a queenless colony's is more decentralized, work and influence spreading across more workers           | Ruttenberg 2026                                                                              |
| 9   | Queen loss can trigger reproductive competition among workers, since without a queen, some workers may invest in their own reproduction rather than the colony's | Ruttenberg 2026 (general finding in bumble bee biology, consistent with the paper's framing) |

## Science → mechanic mapping

| Mechanic                                                                                                                                                                                                                | Inspired by                                                                               | Status                                                    | Intentional simplifications                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Every worker has baseline `forageTendency` / `broodCareTendency` / `nestMaintenanceTendency` traits, present from the start, before anything goes wrong (`src/content/characters.ts`)                                   | #1, #2                                                                                    | Verified basis                                            | The exact numbers (0–1 scales) are gameplay balancing values, not measurements                                                             |
| Task selection is a per-tick weighted local utility (tendency × local need × attention − distance cost), never a scripted role or player assignment (`src/systems/colony.ts: evaluateOptions`)                          | #1, #3                                                                                    | Abstraction, verified-consistent                          | Real bumble bee task allocation involves pheromones, age, and physiology this game doesn't model                                           |
| `latentPotential` on each worker is inert while `queenPresent === true`; once she's gone it drives `reproductiveActivation` up and boosts `socialActivity` (`src/systems/colony.ts: stepWorker`)                        | #5, #6, #7                                                                                | Verified basis                                            | The specific "latent potential" number per worker, and its exact growth rate (`TUNING.reproductiveActivationRate`), are invented           |
| `networkDecentralization()` reports how spread out worker influence/centrality is, rising once the queen is gone, because `postQueenLossVariance` adds noise to every worker's utility calculation only while queenless | #8                                                                                        | Verified basis                                            | A simplified proxy (variance in a single `influence` number) for a real multi-interaction social network                                   |
| Reproductive-competition "meetings" between two sufficiently activated workers (`TUNING.reproductiveCompetitionThreshold`)                                                                                              | #9                                                                                        | Abstraction, verified-consistent                          | A short animated exchange standing in for a real, longer-term reproductive trade-off                                                       |
| Buzz Pulse: a player-controlled radius that temporarily raises nearby workers' `responsiveness` to local need (`buzzPulse()`)                                                                                           | General finding that attention/response to need varies by worker (#1, #3)                 | **Fictional.** No real bumble bee ability works like this | Explicitly not modelled on any specific mechanism; a deliberate gameplay stand-in for "paying closer attention," see `docs/GAME_DESIGN.md` |
| Queen Lost is presented as a sudden, external event the player never causes (campaign levels 4–6; from the start in Queenless Mode)                                                                                     | General framing of both papers (queen loss as the studied condition, not a player action) | Verified framing                                          | The game never models why or how the queen is lost                                                                                         |

## What this game does not claim

- The queen is never modelled as a "manager" giving orders. Both papers study what happens in her _absence_, not
  what she does while present; nothing in this game should be read as workers only "acting freely" once she's gone.
- Queen loss is not framed as good for the colony. The reproductive-competition mechanic and the ending's "Not
  Necessarily a Happy Ending" page exist specifically so the game doesn't imply queenlessness is thriving.
- No specific numeric values (percentages, counts, rates) from either paper are quoted anywhere in the game. Every
  on-screen number (health, tendencies, cooldowns, thresholds) is a gameplay balancing value.

## What still needs human review

- **Neither paper has been read in full by a human team member.** Citations were checked against Crossref metadata
  (title, authors, journal, DOI) only, which confirms the papers exist and are correctly attributed — it does not
  confirm every paraphrase above is a faithful reading of the full text.
- **Author order and role need verification against the primary PDF**: Ruttenberg 2026 is cited with Ruttenberg and
  Wolf in the leading author positions and Traniello and Kocher in the trailing (senior-author) positions. Whether
  this reflects co-first or joint-senior authorship, and whether that distinction matters for how credit is given
  in `docs/CREDITS.md` or the ending's "Meet the Scientist" page, needs a human to confirm by reading the actual
  author contribution statement.
- No one from Sarah Kocher's lab, or either paper's author list, has reviewed or approved this game. The ending's
  scientist bio is a placeholder (`SCIENTIST_PLACEHOLDER` in `src/content/science.ts`) pending written permission,
  per studio policy.
