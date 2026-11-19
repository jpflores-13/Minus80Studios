# Art Direction — Downstream!

## Mood

Bright, readable, and hopeful but honest. A living river worth protecting, with plastic that stands out clearly against nature.

## Placeholder sprite specs (`src/scenes/BootScene.ts`, rendered ×3, nearest-neighbour)

| Key                           | Size (px)                   | Notes for commissioned art                                                  |
| ----------------------------- | --------------------------- | --------------------------------------------------------------------------- |
| bin                           | 8×10                        | Distinct green bin; placement pop animation                                 |
| trap                          | 18×6                        | Floating mesh frame across the channel; fill-state frames (empty/half/full) |
| bottle / bag / wrapper        | 6×3 / 4×4 / 3×3             | Distinguishable by **shape**, not just colour                               |
| house / store / school / tree | 10×10 / 14×10 / 18×12 / 8×9 | Cozy small buildings                                                        |
| GPS research bottle (M4)      | TBD                         | **Bright pink**, clearly different from ordinary litter                     |

## Palette (`src/config/gameConfig.ts`)

Grass `#6f9a52`, water `#3f86b0`, ocean `#2c6a96`, bank `#8a7a55`, cream UI `#f4ead2`, ink `#2d2a26`, action `#d9603b`, GPS pink `#ff4fa3`.

## Principles

- Hopeful and alive, not apocalyptic. Clear network readability (flow dashes, optional arrows).
- Never rely on colour alone: litter differs by shape, a full trap says "FULL", and stars are filled vs. outlined.
- Respect reduced motion: water animation stops.
- Mood references (Mini Motorways, Terra Nil, etc.) are for feel only. Never copy their assets or interfaces.
