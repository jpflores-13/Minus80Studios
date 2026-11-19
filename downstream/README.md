# Downstream!

_An environmental strategy and puzzle game about plastic pollution, river transport, and waste interception._
A [Minus 80 Studio](../studio/README.md) prototype · Phaser 4 + TypeScript + Vite.

**Status:** foundation only. A title screen and a river sandbox: plastic drifts downstream, and you tap pieces to intercept them.

## Quick start

Requires Node.js 26 LTS (see `.node-version`).

```bash
npm install
npm run dev       # http://localhost:8082  (add ?scene=Play to skip the title)
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
  scenes/          Boot → Title → Play
  entities/        Debris
  systems/         Pure, unit-tested logic (current profile, interception tally)
  ui/  utils/      Text styles; small helpers
public/assets/     Static assets (credit in docs/ASSET_ATTRIBUTION.md)
tests/  docs/
```

## Docs

[Game design](docs/GAME_DESIGN.md) · [Science](docs/SCIENCE.md) · [Art direction](docs/ART_DIRECTION.md) · [Playtesting](docs/PLAYTESTING.md) · [Roadmap](docs/ROADMAP.md) · [Asset attribution](docs/ASSET_ATTRIBUTION.md) · [Changelog](CHANGELOG.md)

## License

Proprietary, © Minus 80 Studio (to be finalized before public release).
Scaffolded from [phaserjs/template-vite-ts](https://github.com/phaserjs/template-vite-ts) (MIT, see `TEMPLATE_LICENSE.txt`).
