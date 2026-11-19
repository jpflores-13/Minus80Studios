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

## Planned

| #   | Name                       | New ideas                                                       | Inventory (preliminary)          | Goal |
| --- | -------------------------- | --------------------------------------------------------------- | -------------------------------- | ---- |
| 2   | Two Rivers                 | Confluence, multiple sources, GPS scouting, storm-drain filters | 2 bins, 2 traps, 1 filter, 1 GPS | 80%  |
| 3   | Storm Warning              | Forecasts, storms, trap overload, booms, cleanup                | 2/2/1/2 GPS/1 boom/1 cleanup     | 85%  |
| 4   | The Bottleneck             | Retention hotspots, remobilization, directional interception    | 2/1/1/2/2/1                      | 85%  |
| 5   | Everything Flows Somewhere | Full watershed to estuary, major storm                          | 3/2/2/2/1/2                      | 90%  |
