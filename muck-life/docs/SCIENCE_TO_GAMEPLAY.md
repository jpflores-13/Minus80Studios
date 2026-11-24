# Science to gameplay

How the study's findings became mechanics, and exactly where the game simplifies. All numbers live in
`src/config/tuning.ts`, split into three groups that must never be confused:

- **`MEASURED`**: values reported in Stein & Cardon (2026). The only numbers presented to players as
  findings.
- **`SIM`**: simplified-model parameters, tuned so the model behaves _qualitatively_ like the study.
  Never presented as measurements.
- **`ARCADE`**: points, timers, and hitboxes. No biological meaning.

## Finding → mechanic

| Finding                                              | Mechanic                                                                                                                                     |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Pools appear around growing tissue                   | Targets are pools in the simulated field, produced by tissue. They are never spawned at random.                                              |
| Pools fade as tissue matures                         | Release falls with tissue age, so the tissue behind a growing tip goes quiet.                                                                |
| Tips advance                                         | A pool that moves ≥ 70 px since you documented it can be documented again (TRACKED GROWTH).                                                  |
| Laterals erupt later and last weeks                  | Laterals emerge from older root sections after a delay; their plumes last ~5× longer and can be re-measured each new day (PERSISTENT PLUME). |
| Rhizomes open new ground and spawn roots 3–7 d later | Rhizomes extend sideways, and their nodes sprout roots after a delay. Level 4's imaging window expands to follow them.                       |
| Night does not switch oxygen off                     | Level 5's twist. Release is modulated only slightly by time of day.                                                                          |
| Diel swings are small (c. 3–5%)                      | Diel amplitude is tuned so simulated swings are ~4 percentage points.                                                                        |
| Mud consumes oxygen fast                             | First-order consumption plus a small constant demand. Level 6 raises it.                                                                     |
| Researchers used ROIs                                | The ROI tool records an optode reading over time and scores when it captures a real change.                                                  |
| Optodes image concentration, not molecules           | You document readings. Nothing is collected or removed. The score is never the total oxygen.                                                 |

## Root growth algorithm (`src/systems/plant.ts`)

Each organ axis (rhizome, adventitious root, lateral root) is a polyline of tissue points spaced 6 px
apart. Each point stores the sim hour it formed.

- **Growth:** each sim step, a growing axis extends by `growthRate × growthBoost × dt` px (rates in
  `SIM.growthRate`). Headings wander with organ-specific rules: rhizomes are pulled toward horizontal,
  adventitious roots toward vertical, laterals wander freely.
- **Pulses (abstraction):** growth runs for 70% of every 30 sim h, then rests. This gives rest-then-burst
  growth and makes emergence predictable.
- **Rhizome nodes:** every ~130 px, a node schedules 1–3 adventitious roots after
  `adventitiousDelayHours` (paper: 3–7 d; levels compress this to 20–40 h). When a rhizome stops, its
  apex becomes a new aboveground ramet.
- **Laterals:** once the section ~25% down an adventitious root is older than `lateralDelayHours`, a
  cluster of 4–7 laterals erupts along it. They share one cluster id, which becomes one target region.
- **Stops:** at max length (per organ, or per level for rhizomes) or the sediment bounds.
- **Seeded:** a mulberry32 RNG per session, so a seed always gives the same growth.

## Oxygen field algorithm (`src/systems/oxygen.ts`)

An 80 × 34 grid of 16 px cells over the sediment holds % air saturation `O`. Each 0.25 sim-h step:

1. **Sources.** Every tissue point deposits `releaseFactor(organ, age) × releasePerPoint × diel`
   bilinearly into its four nearest cells.
2. **Release curve** `releaseFactor`: full release until `plateau`, then a linear fade to zero at `end`.
   Tips younger than 10 h get ×1.5, and laterals ramp in over 10 h. Rhizome 30→70 h, adventitious
   40→88 h, lateral 260→520 h.
3. **Update** (semi-implicit for the local terms, explicit for diffusion):
   `O' = (O + dt·(S − baseline + D·∇²O)) / (1 + dt·(k + S/O_int))`, clamped to 0–100, with no-flux
   edges. The `S/O_int` term makes release **gradient-limited**: a root leaks less as the surrounding
   mud approaches its internal oxygen level (`O_int` = 38%). This is a simplified Fick's-law idea, and
   it keeps overlapping roots from pushing pools above the study's range.
4. **Diel term** `1 + 0.25 · dielShape(hour)`, where `dielShape` traces the paper's described pattern.

### Calibration (enforced by tests)

`src/systems/experiments.ts` runs virtual versions of the paper's ROI measurements at the game's
growth speed. Current results against the paper:

| Quantity                      | Paper          | Model                     |
| ----------------------------- | -------------- | ------------------------- |
| Rhizome pool duration         | 78 ± 28 h      | ~73 h                     |
| Adventitious pool duration    | 95 ± 17 h      | ~92 h                     |
| Lateral pool duration         | 502 ± 170 h    | ~513 h                    |
| Region peaks during play      | 25–35%         | 24–34% (median per level) |
| Diel swing around laterals    | c. 3–5%        | ~3.9%                     |
| Night minimum around laterals | > 0 (persists) | ~19%                      |

These are qualitative checks. The model does not predict real fluxes, emissions, or outcomes.

## Targets, observation, and duplicates (`src/systems/regions.ts`)

- A **region** is one growing tip, one rhizome apex, or one lateral cluster. It is _visible_ when any
  field cell near its releasing tissue is above the imaging threshold (8 / 12 / 18%). Its position
  follows its newest tissue, so it can be tracked.
- A click documents the region whose above-threshold cells contain the click, or the nearest centre
  within the hit radius (58 px, or 84 px with Large Targets).
- **New observation rules:** first documentation, moved ≥ 70 px, strength changed ≥ max(8 points, 50%),
  or ≥ 24 sim h since the last documentation. Anything else is a repeat. Repeats break the combo but do
  not cost accuracy. There is a 1.5 s per-region cooldown.
- **Distractors** (sediment glints, non-oxygen fluorescence, imaging noise) spawn away from live
  regions. They read ~0% on the optode and are drawn hard-edged or speckled, never as a smooth plume.

## Scoring (`src/systems/scoring.ts`)

100 × combo multiplier (1, 1.25, 1.5, … capped at ×4), plus bonuses: FRESH EMERGENCE +50 (within 14 sim h
of a pool appearing), TRACKED GROWTH +40, PERSISTENT PLUME +60, NIGHT SIGNAL +30 (levels 5+), ROI
change +150. Multiplied by imaging stringency (×1 / 1.15 / 1.3 for 8 / 12 / 18% threshold). The combo
lapses after 4.5 s. Titles: Mud Rookie → Root Tracker → Oxygen Observer → Rhizosphere Ranger → Muck
Master, based on score relative to the level target (accuracy below 60% caps the title at Oxygen
Observer).

## Time compression and level overrides

Levels run 0.6–2 sim h per second and boost growth 2.2–6×. Level-specific shortened delays (laterals
28–70 h, root emergence 20–40 h) are gameplay compression. The _order_ of events always follows the paper.

## What we simplified

The player-facing list is `SIMPLIFICATIONS` in `src/content/science.ts`, shown in Explore → What We
Simplified. It covers: imaging colours vs. visible oxygen, documenting vs. removing, a coarse 2-D model,
sped-up growth and compressed time, uncalibrated intensities, simplified diel and maturation rules,
illustrative microbes, no emissions, and the four-plant lab context.
