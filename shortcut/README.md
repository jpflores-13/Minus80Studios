# SHORTCUT.

_A cozy puzzle game about connecting a city with temporary shortcuts._
A [Minus 80 Studios](../studio/README.md) prototype · Phaser 4 + TypeScript + Vite.

**Status:** v0.1. First three campaign levels on a working stochastic engine.

Machines load at depots and stretch golden shortcuts along the road, both ends moving on their own at a random pace.
Checkpoints stop ends arriving from the side their arrow points at, but sometimes let one slip past. Machines
wear out and leave. A shortcut that joins a supplier to the right customer makes a delivery likely, never certain.
The player's job is to arrange depots and checkpoints so the city stays connected over time.

## Quick start

Requires Node.js 26 LTS (see `.node-version`).

```bash
npm install
npm run dev       # http://localhost:8083
```

Dev shortcuts (dev builds only): `?scene=Level&level=level-2&nobrief&depots=16&cps=6>,25<&warm=20`
jumps to a level with a plan already placed and the clock run forward.

| Command                           | What it does                                             |
| --------------------------------- | -------------------------------------------------------- |
| `npm run dev`                     | Dev server with hot reload on port **8083**              |
| `npm run build`                   | Type-check, then build static files into `dist/`         |
| `npm run preview`                 | Serve the built `dist/` on port 9083                     |
| `npm run check`                   | Everything CI runs: typecheck, lint, format check, tests |
| `npm test` / `npm run test:watch` | Unit tests (Vitest)                                      |

## Project layout

```
src/
  main.ts          Entry point
  config/          gameConfig.ts (resolution, palette), tuning.ts (gameplay numbers), progress.ts (saves)
  levels/          Level data, one file per level
  systems/         Pure, unit-tested: extrusion (machines), city (deliveries), run, score
  scenes/          Boot → Splash → Title → LevelSelect → Level → Results (+ Settings)
  ui/              Buttons, text, drawing helpers for the city, screen-reader announcements
tests/  docs/
```

## Controls

Pointer or touch: tap the road to place, tap again to turn a checkpoint around, once more to pick it up.
Keyboard: ← → move along the road (Shift for big steps), Enter place/turn/pick up, Delete remove, 1/2 pick a tool,
R run, H briefing, F fast, P pause, S stop and edit, M mute. Everything is announced to screen readers.

## Docs

[Science](docs/SCIENCE.md) · [Changelog](CHANGELOG.md)

## License

Proprietary, © Minus 80 Studios (to be finalized before public release).
Scaffolded from [phaserjs/template-vite-ts](https://github.com/phaserjs/template-vite-ts) (MIT, see `TEMPLATE_LICENSE.txt`).
