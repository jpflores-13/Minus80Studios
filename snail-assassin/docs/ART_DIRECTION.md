# Art Direction — Snail Assassin

## Mood

Dark, quiet, bioluminescent. A deep-water night dive: mostly darkness, with color used sparingly for life and danger.

## Placeholder art specs (generated in `src/scenes/BootScene.ts`)

| Asset                     | Source size (px)  | In-game scale | Notes / commission requirements                                                                        |
| ------------------------- | ----------------- | ------------- | ------------------------------------------------------------------------------------------------------ |
| Cone snail, per character | 16×9, faces right | ×4            | Top-down cone silhouette (spire, shoulder, taper, siphon). Needs idle, crawl, and strike/engulf frames |
| Reef fish ×3              | 8×5, faces right  | ×4            | Needs swim, alert, impaired (wobble), and flee frames                                                  |
| Reef backdrop             | 320×180           | ×4            | Sand, ripples, rocks with crevices, coral heads, and seagrass beds                                     |
| Particles                 | 1×1               | ×2            | Marine snow                                                                                            |

All pixel art renders with nearest-neighbour filtering (`pixelArt: true`).

## Palette (`src/config/gameConfig.ts`, character palettes in `src/characters/*.ts`)

Navy `#06192b`, deep `#0a2a3f`, sand `#cdb58a`, coral `#e0715a`, seagrass `#4f8a4a`.
Atlas: shell `#e9dcc0`, pattern `#1f6f78`, accent `#5fd3c6`. Catalyst: shell `#d9a441`, bands `#5a3416`, accent `#ffd36b` (angular bands). Nightshade: shell `#e8d9f0`, streaks `#7a4fa0`, accent `#c9a2ff` (soft streaks).
Cloud patterns: insulin = dots, override = crosses, escape-dampening = rippling rings. Fish icons add `x` (immobilized) and `z` (dampened).

## Principles

- **Readable silhouettes first**, even on an iPad.
- **Never colour alone:** fish states also use posture (wobble) and icons (`?` alert, `!` fleeing, `~` impaired, `[ ]` catchable).
  Cloud types differ by pattern (dots vs. crosses).
- **Respect reduced motion:** ambient particles and light drift stop when the OS asks.
- **Original or licensed only:** log everything in `ASSET_CREDITS.md`. Mood references (DREDGE, Rain World, etc.) are for feel only, never copied.
