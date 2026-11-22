# Organism database

A readable index of every organism, specimen, and artifact type defined in `src/content/organisms.ts`
(ONE DROP/RECONSTRUCT) and `src/content/wildlife.ts` (DIVE). The authoritative data lives in those files;
this is a reference, not a second copy to keep in sync by hand for gameplay numbers.

## DIVE wildlife (The Visible World)

| Species               | Kind in-game            | Documented behavior                        | Real citation?                                                                       |
| --------------------- | ----------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------ |
| Weddell seal          | photographable wildlife | hauled out, resting on the ice             | No — general natural history                                                         |
| Leopard seal          | photographable wildlife | vocalizing underwater                      | Yes — Kienle et al., 2024                                                            |
| Adelie penguin        | photographable wildlife | foraging in a tight group                  | No — general natural history                                                         |
| Crocodile icefish     | photographable wildlife | holding still over cold, oxygen-rich water | Partially — the hemoglobin-loss fact is cited; the in-game "behavior" framing is not |
| Antarctic krill swarm | photographable wildlife | (none defined)                             | No — general natural history                                                         |

## ONE DROP / RECONSTRUCT specimens, by scale

Each scale (`SPECIMENS` in `organisms.ts`) defines exactly one `target`, several `nonTarget`/`artifact`
entries, and one `unknown`. Radius, speed, and point value are fictional gameplay-balance numbers for
every entry (see `docs/SCIENCE.md`) — only the _existence and general nature_ of a specimen category is
meant to reflect anything real.

| Scale                                | Target specimen           | Has a Discovery Journal entry?         |
| ------------------------------------ | ------------------------- | -------------------------------------- |
| The Visible World (`visible`)        | Antarctic krill           | No (DIVE wildlife has entries instead) |
| A Drop of Ocean (`drop`)             | Copepod                   | No                                     |
| The Hidden Ecosystem (`hidden`)      | Diatom                    | Yes                                    |
| The Microbial World (`microbial`)    | Labelled bacterial cell   | Yes (cites Patel et al., 2007)         |
| The Viral Frontier (`viral`)         | Virus-like particle       | Yes (cites Piedade et al., 2024)       |
| The Molecular Frontier (`molecular`) | Clear particle projection | Yes                                    |

Specimens without a Journal entry yet (copepod and the `visible` scale's non-krill types) are a known gap
— see `docs/RESEARCH_HOOKS.md` for how to add one.
