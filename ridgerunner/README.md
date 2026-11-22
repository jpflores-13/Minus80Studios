# RIDGERUNNER.

A Minus 80 Studios game: follow a Cascade torrent salamander between headwater streams, and
discover when it pays to leave the water.

## Play

```bash
npm install
npm run dev      # http://localhost:8088
npm run check    # typecheck, lint, format, tests
npm run build    # static files in dist/
```

## What this is

Moss, a small salamander, must reach a neighbouring population's stream. Streams are the easy,
moisture-replenishing route, but some destinations have no stream connection at all: the only way
there is a short, risky walk overland. Five hand-built levels teach the idea; Beyond the Divide
generates endless, seed-reproducible watershed crossings after that, each checked for a solvable
route before it's handed to the player.

## Layout

```
src/
  systems/   terrain.ts (what each tile does), network.ts (the landscape, stream watersheds via
             flood fill), game.ts (moisture, movement, stepGame — pure and tested),
             procedural.ts (Beyond the Divide's generator + reachability check)
  levels/    one file per level; maps are text, one character per tile (key in levels/types.ts)
  content/   science.ts (the ending's checked citations)
  render/    art.ts: every sprite, drawn in code and replaceable by images under the same keys
  scenes/    Boot → Splash → Intro → Title → Settings → LevelSelect → Level (+ Hud, Pause) →
             Results → Ending
  ui/        shared Menu/Button/text/announce/textScaling helpers (this game's own copies; no
             imports between game folders)
```

## Docs

[Science notes](docs/SCIENCE.md) · [Changelog](CHANGELOG.md)

## License

© 2026 Minus 80 Studios. All rights reserved. See the [repo-wide LICENSE](../LICENSE) for details.
Scaffolded from [phaserjs/template-vite-ts](https://github.com/phaserjs/template-vite-ts) (MIT,
see `TEMPLATE_LICENSE.txt`), which covers only those original template files.
