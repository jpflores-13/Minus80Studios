# ANTARCTIC EXPEDITION

An underwater exploration and microscopy discovery game from [Minus 80 Studios](../studio/). Phaser 4 +
TypeScript + Vite. You play a marine scientist aboard a research vessel in the Southern Ocean, moving
between a diving simulator, a fast arcade microscopy minigame, and a Discovery Journal of what you found.

## What's built

- **DIVE**: swim a bounded field, photograph wildlife, and collect one water sample per expedition. A
  fast or close approach startles an animal instead of getting the shot — disturbance is tracked, not
  just ignored.
- **ONE DROP**: the signature minigame. Particles drift through a circular field of view; document the
  round's target, leave non-targets and artifacts alone, and — this is the point — tap the small `?`
  badge on anything genuinely ambiguous to document it as an honest unknown. That is rewarded, never
  penalized. The same pure engine (`src/systems/oneDrop.ts`) runs all six biological scales, just with a
  different specimen set each time.
- **RECONSTRUCT**: a cryo-EM particle-picking round built on the same ONE DROP engine, themed around
  picking clear particle projections instead of rejecting noise and contamination. Clearing a round
  reveals an explicitly illustrative placeholder shape, never presented as a real structure.
- A seven-expedition campaign (**Beneath the Ice** through **Into the Unknown**, roughly nine minutes
  straight through), **Endless Expedition** for replayability, a **Discovery Journal**, and six
  **Scientific Mysteries** that ask you to interpret evidence rather than answer a quiz.
- Settings & Accessibility: sound/volume/music, reduced effects, large text, a relaxed-microscopy speed
  option, full keyboard support, and screen-reader announcements throughout.

See `docs/` for the full design, science, and accessibility documentation.

## Quick start

```bash
npm install
npm run dev     # http://localhost:8089   (dev: ?scene=OneDrop)
npm run check   # typecheck, lint, format, tests
npm run build   # static files in dist/
```

## Layout

- `src/systems/` — pure, Phaser-free game logic (`oneDrop.ts`, `dive.ts`, `mysteries.ts`), each with
  Vitest coverage in `tests/`.
- `src/content/` — data: organisms and scales, DIVE wildlife, the campaign, scientific mysteries, and
  `science.ts`, the single source of truth for every citation used anywhere in the game.
- `src/levels/` — round builders that configure the pure engines per scale, campaign beat, or Endless lap.
- `src/scenes/` — thin Phaser rendering/input layers over the pure systems.
- `docs/` — design, science, accessibility, and review documentation (see `docs/` for the full index).

## Status

All seven campaign expeditions, both arcade minigames, Endless Expedition, the Discovery Journal, and the
Scientific Mysteries are playable end to end. Wildlife and specimen illustrations are placeholder vector
shapes, not final art — see `docs/ARTIST_BRIEF.md`.
