# Downstream!

_An environmental strategy and puzzle game about plastic pollution, river transport, and waste interception._
A [-80 Studios](../studio/README.md) prototype · Phaser 4 + TypeScript + Vite.

**Status:** v0.3. Five-level campaign with scouting, weather, six kinds of equipment, and the "Did you know?" ending.

## Quick start

Requires Node.js 26 LTS (see `.node-version`).

```bash
npm install
npm run dev       # http://localhost:8082  (dev shortcuts: ?scene=Level&level=level-3, ?scene=Ending)
```

| Command                           | What it does                                             |
| --------------------------------- | -------------------------------------------------------- |
| `npm run dev`                     | Dev server with hot reload on port **8082**              |
| `npm run build`                   | Type-check, then build static files into `dist/`         |
| `npm run preview`                 | Serve the built `dist/` on port 9082                     |
| `npm run check`                   | Everything CI runs: typecheck, lint, format check, tests |
| `npm test` / `npm run test:watch` | Unit tests (Vitest)                                      |
| `npm run lint` / `npm run format` | ESLint / Prettier                                        |

## Project layout

```
src/
  main.ts          Entry point
  config/          gameConfig.ts (resolution, palette), tuning.ts (gameplay numbers)
  levels/          Level data (Level 1), with slot positions derived from the network
  scenes/          Boot → Title → Level → Results
  entities/        MapView (terrain, creek, sources, slots, equipment, litter)
  systems/         Pure, unit-tested: network, litter ledger, sim, equipment, score
  ui/  utils/      Text styles; small helpers
public/assets/     Static assets (credit in docs/ASSET_CREDITS.md)
tests/  docs/
```

## Docs

[Game design](docs/GAME_DESIGN.md) · [Science](docs/SCIENCE.md) · [Art direction](docs/ART_DIRECTION.md) · [Playtesting](docs/PLAYTESTING.md) · [Roadmap](docs/ROADMAP.md) · [Asset credits](docs/ASSET_CREDITS.md) · [Level design](docs/LEVEL_DESIGN.md) · [Ending format](docs/ENDING_SEQUENCE.md) · [Changelog](CHANGELOG.md)

## License

Proprietary, © -80 Studios (to be finalized before public release).
Scaffolded from [phaserjs/template-vite-ts](https://github.com/phaserjs/template-vite-ts) (MIT, see `TEMPLATE_LICENSE.txt`).
