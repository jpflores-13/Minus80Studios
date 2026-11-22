# Scientific review checklist

A claim-by-claim audit trail for a domain scientist to review before any claim here is trusted further.
Per the studio's principle, `docs/SCIENCE.md` is the source of truth only once a human has validated it —
this table is the tool for that validation, not a replacement for it.

| Claim                                                                                               | Source                                                  | Confidence                                                                          | Review status                                                                              |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Leopard seal courtship interaction lasted ~2 hrs, calls continued ~8 hrs more                       | Kienle et al., 2024                                     | High (direct quote from paper)                                                      | Not yet reviewed by a domain scientist                                                     |
| 65 underwater calls (male), 7 in-air calls (female: thump pulse, noseblast, blast, growl)           | Kienle et al., 2024                                     | High (direct quote from paper)                                                      | Not yet reviewed                                                                           |
| Copulation never directly observed; male later found with injury consistent with attempted mating   | Kienle et al., 2024                                     | High (direct quote from paper)                                                      | Not yet reviewed                                                                           |
| ~75% of sampled viral diversity previously uncharacterized, full-season survey at Rothera           | Piedade et al., 2024                                    | High (direct quote from paper)                                                      | Not yet reviewed                                                                           |
| Named viral groups (phages, Nucleocytoviricota, Polinton-like viruses, virophages, crAssphage-like) | Piedade et al., 2024                                    | High (direct quote from paper)                                                      | Not yet reviewed                                                                           |
| SYBR Green I epifluorescence counting is an established enumeration method                          | Patel et al., 2007                                      | High (the paper's own subject)                                                      | Not yet reviewed                                                                           |
| "Counting ≠ resolving structure" framing                                                            | Broader field consensus, not a Patel et al. quote       | Medium (field-level claim, not paper-specific)                                      | Not yet reviewed — flagged as broader-field, not a specific citation, in `docs/SCIENCE.md` |
| Icefish (Channichthyidae) lack hemoglobin via large deletional event                                | Multiple reviews/genome papers, not single-sourced here | High (well established, multi-source)                                               | Not yet reviewed                                                                           |
| Dr. Kienle's affiliation, lab, PhD, NSF CAREER Award                                                | Public sources (sarahskienle.com, NSF records)          | High (public record)                                                                | Not yet reviewed                                                                           |
| Weddell seal, Adelie penguin, krill, diatom general natural history                                 | General/textbook knowledge, no specific citation        | Medium (uncited; lower bar, should be sourced if any specific number is ever added) | Not yet reviewed                                                                           |

## How to use this table

A reviewing scientist should, for each row: confirm the source actually says what this game claims, flag
any row where confidence should be downgraded, and note anything that needs rewording in `docs/SCIENCE.md`
or the Discovery Journal (`src/content/journal.ts`). Update the "Review status" column directly once a
row has been checked.
