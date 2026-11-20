# SHORTCUT.

_A cozy puzzle game about connecting a city with temporary shortcuts._
A [Minus 80 Studios](../studio/README.md) prototype · Phaser 4 + TypeScript + Vite.

**Status:** v0.2. Full eight-level campaign, the ending reveal, Science Mode, City Planner and Blueprint.

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

## What's in it

- **Campaign** (8 levels, about 8–10 minutes): The Long Way Home, One Way Street, Good Neighbors, Power Play,
  Rush Hour, Nothing Lasts Forever, Heat Advisory, A New Identity. Each adds one idea.
- **The reveal**: after Level 8 the running city fades into the science view of the same simulation.
- **Science Mode**: every level, City Planner and Blueprint, drawn as chromatin, cohesin and CTCF, with tooltips.
- **City Planner**: a sandbox. Every setting, baseline vs. changed maps side by side, length distributions,
  seeds, and CSV/JSON export.
- **Blueprint**: reproduce a target connectivity map made by hidden settings. Some have more than one answer.

## Scientific analogies and approximations

See [docs/SCIENCE.md](docs/SCIENCE.md) for the full mapping, the contact model, the Blueprint similarity metric,
and the list of claims that still need checked references.

## Project layout

```
src/
  main.ts          Entry point
  config/          gameConfig.ts (resolution, palette), tuning.ts (gameplay numbers), progress.ts (saves)
  levels/          Level data, one file per level; sandbox.ts; blueprints.ts
  content/         terms.ts (city ↔ science words, tooltips), reveal.ts (ending text)
  systems/         Pure, unit-tested: extrusion (engine), city (deliveries), run, score, contacts (maps)
  render/          RoadView (city and science renderers), charts (heat maps, histograms)
  scenes/          Boot → Splash → Title → LevelSelect → Level → Results → Reveal → Modes, Planner, Blueprint
  ui/              Buttons, focusable controls, city and science drawing helpers, announcements
tests/  docs/
```

## Controls

Pointer or touch: tap the road to place, tap again to turn a checkpoint around, once more to pick it up.
Keyboard: ← → move along the road (Shift for big steps), Enter place/turn/pick up, Delete remove, 1/2 pick a tool,
3/4/5 change policies (Level 6), U undo, R run, H briefing, F fast, P pause, S stop and edit, M mute.
In City Planner and Blueprint, Tab moves between the road and the controls. Everything is announced to screen readers.

## Future development

Commissioned art and music, more Blueprint challenges, a guided undergraduate worksheet for Science Mode,
perturbation presets in the Planner (e.g. "remove all CTCF", "longer residence time"), and real references
once reviewed.

## Docs

[Science](docs/SCIENCE.md) · [Changelog](CHANGELOG.md)

## License

Proprietary, © Minus 80 Studios (to be finalized before public release).
Scaffolded from [phaserjs/template-vite-ts](https://github.com/phaserjs/template-vite-ts) (MIT, see `TEMPLATE_LICENSE.txt`).
