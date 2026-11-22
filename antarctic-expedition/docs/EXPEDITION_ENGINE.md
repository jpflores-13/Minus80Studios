# The Expedition engine

Per the original brief (section 28), this game's core systems are built as genuinely reusable, pure
modules, decoupled from Phaser, so a hypothetical future Minus 80 Studios installment could reuse them
with new content. **No second game or shared package has been scaffolded** — this document describes the
reuse surface that already exists inside this game, for a future effort to draw on if the studio decides
to build another installment.

## Reusable pure modules

- **`src/systems/oneDrop.ts`** — the particle-field engine: weighted spawn tables, four-category
  classification, combo scoring, win/loss. Nothing in it is Antarctica-specific; a future installment
  would supply its own `SpecimenType` records and `OneDropConfig`. This game already reuses it three
  ways: ONE DROP itself, RECONSTRUCT (a themed presentation over the same engine), and Endless
  Expedition (lap-based configs from the same `roundFor`/`endlessRoundFor` builders).
- **`src/systems/dive.ts`** — the exploration/photography engine: wildlife wander/alert/flee AI, photo
  scoring, disturbance tracking, one sample site per expedition. A future installment would supply its
  own `WildlifeSpecies` records.
- **`src/systems/mysteries.ts`** — evidence-unlock and interpretation-outcome logic, driven entirely by a
  `Mystery` record and a `JournalEntry` map; no game-specific logic beyond that shape.
- **`src/utils/rng.ts`** — the seeded RNG every engine above uses, for deterministic rounds.

## The configurable-content pattern

Each pure engine takes a config object built by a small "levels" function
(`src/levels/oneDropRounds.ts`, `src/levels/diveRounds.ts`) from content records
(`src/content/organisms.ts`, `src/content/wildlife.ts`). A future installment reusing these engines would
write its own content records and level builders; the engines themselves would not need to change.

## Scene/engine separation

Every scene (`src/scenes/*.ts`) is a thin rendering and input layer: it calls into a pure engine's
`step`/`capture`/`markUnknown`/`takePhoto`/`collectSample` functions and only translates state into
Phaser draw calls and events into sound/announce calls. None of the actual game logic lives in a scene —
this is what makes the engines above testable in isolation (`tests/oneDrop.test.ts`, `tests/dive.test.ts`,
`tests/mysteries.test.ts`) and reusable without Phaser at all.

## What would need to change for a new installment

- New content records for specimens/wildlife/mysteries/scales, matching the existing interfaces.
- New scenes (or reused ones, if the visual language fits), since presentation is intentionally not part
  of the reusable layer.
- A new `docs/SCIENCE.md`-equivalent audit, since the engines carry no domain claims themselves — all
  scientific content lives in configuration, not in the pure systems.
