# Art Direction — Queenless

## Mood

A warm, sunlit storybook nest. Earthy browns and honey golds, rose and sky accents for flowers, nothing clinical
or diagrammatic — this should read as a cozy little world, not a simulation dashboard.

## Placeholder art specs (generated in `src/render/art.ts`)

| Asset              | Source size (px)         | In-game scale             | Notes / commission requirements                                                                                     |
| ------------------ | ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Bee, per character | 32×26, viewed from above | ×1 (zoomed ×2 via camera) | Needs two wing-flap frames (`bee-0`, `bee-1`); tinted per character at runtime, so should stay a light/neutral base |
| Flower             | 32×32, top-down icon     | ×1                        | Two colour variants (`flower-rose`, `flower-sky`); scales with the site's resource level                            |
| Brood cell         | 32×32                    | ×1                        | Rounded cell with a honey-coloured larva; scales with brood level                                                   |
| Debris pile        | 32×32                    | ×1                        | Scales with debris level; should read as "needs cleaning" at low opacity, "cluttered" at high                       |
| Storage / honeypot | 40×40                    | ×1                        | Single fixed site per colony; doesn't scale                                                                         |
| Particle           | 4×4                      | varies                    | Marine-snow-style ambient dust, reused from the honey palette                                                       |

Everything renders with Phaser's default smoothing (no `pixelArt: true`); the storybook look favours soft shapes
over crisp pixels.

## Palette (`src/config/gameConfig.ts`)

Night `#241a10`, earth `#5a3f28`, earth light `#7a5a3a`, moss `#7a9b5c`, moss dark `#4f6a3c`, honey `#e8b84b`,
honey light `#f6d98a`, amber `#d98e3f`, cream `#f6ead0`, ink `#1a120a`, rose `#d97a7a`, sky `#8fb9d0`.

Each named character gets a tint on the shared bee sprite (`src/content/characters.ts`): Buzzby honey, Pollen
honey light, Dash amber, Bumble moss, Stinger rose, Queenie an understated tan (`#b89a6e`) — deliberately the
least eye-catching of the six, matching her design as "easy to overlook."

## Principles

- **Readable at a glance, even while moving.** Site state (how full a flower is, how clean a cell is) reads
  through scale and opacity, not just colour, so it still communicates under colour-blind simulation.
- **The queen's absence is felt, not shown.** There is no "queen" sprite in the simulation to begin with — queen
  loss is communicated through the `queenLost` screen flash, the announcer, and the music/behavior shift, not a
  character leaving the scene. Don't add a literal queen sprite; it would contradict the science (see
  `docs/SCIENCE.md`).
- **Respect reduced motion.** The reproductive-activation sprite shimmer and the screen shake/flash on
  disturbances and queen loss both check `progress().reducedEffects` before playing.
- **Original or licensed only.** Log everything in `ASSET_CREDITS.md` the same commit it's added.
