# Level Design — Downstream!

Levels are data (`src/levels/*.ts`). Difficulty comes from network shape, source placement, scarcity, capacity, and
weather, **never** from simply adding more litter.

Every level must pass `tests/sim.test.ts`: at least two distinct winning strategies, at least one losing full
deployment (choices matter), three stars achievable, and the best strategy robust across seeds.

## Level 1 — The Neighborhood ✅ (Milestone 3)

- **Map:** one creek to the ocean; four sources (Corner Store High, Park Medium, Houses Low, School High).
- **Inventory:** 3 bins, 1 trap · **Goal:** 75% · **Stars:** 75 / 80 / 85% · **Length:** ~1 min of flow.
- **The puzzle:** the School drains in _below_ every trap site, so only a bin can stop its litter. The trap then
  decides how much of the rest is caught (the lower site covers more of the channel but also receives more litter).
- **Balance snapshot (level seed):** 7 of 12 full deployments pass; the best is about 90%. Leaving the School without a bin always fails (56–69%).

## Levels 2–5 (built)

| #   | Name                       | New ideas                                        | Kit                                                | Goal | Share of full strategies that pass* |
| --- | -------------------------- | ------------------------------------------------ | -------------------------------------------------- | ---- | ----------------------------------- |
| 2   | Two Rivers                 | Confluence, drain filters, light rain            | GPS 1, bins 2, filter 1, traps 2                   | 80%  | ~58%                                |
| 3   | Storm Warning              | Forecast storm, overloaded traps, booms, cleanup | GPS 2, bins 2, filter 1, traps 2, boom 1, crew 1   | 85%  | ~30%                                |
| 4   | The Bottleneck             | Snags, wash-out in rain, narrow trap site        | GPS 2, bins 2, filter 1, trap 1, booms 2, crew 1   | 85%  | ~12%                                |
| 5   | Everything Flows Somewhere | Whole watershed, estuary, big storm              | GPS 2, bins 3, filters 2, traps 2, boom 1, crews 2 | 90%  | ~19%                                |

*Measured by trying every full placement with a simple cleanup rule. Real players won't place perfectly, so
these should feel harder than the numbers suggest. Check with playtests.
