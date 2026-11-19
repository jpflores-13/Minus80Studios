# Downstream!

_An environmental strategy and puzzle game about plastic pollution, river transport, and waste interception._
A [Minus 80 Studio](../studio/README.md) prototype · Phaser 4 + TypeScript + Vite.

**Status:** v0.2. Level 1 is fully playable: investigate the watershed, deploy trash bins and a trash trap, release the flow, and earn up to three stars.

## Quick start

Requires Node.js 26 LTS (see `.node-version`).

```bash
npm install
npm run dev       # http://localhost:8082  (add ?scene=Level to skip the title)
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

Proprietary, © Minus 80 Studio (to be finalized before public release).
Scaffolded from [phaserjs/template-vite-ts](https://github.com/phaserjs/template-vite-ts) (MIT, see `TEMPLATE_LICENSE.txt`).
