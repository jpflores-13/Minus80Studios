# Snail Assassin

_An atmospheric underwater stealth-and-hunting game inspired by venomous cone snails._
A [Minus 80 Studio](../studio/README.md) prototype · Phaser 4 + TypeScript + Vite.

**Status:** foundation only. A title screen and a movable placeholder snail. No hunting or stealth mechanics yet.

## Quick start

Requires Node.js 26 LTS (see `.node-version`).

```bash
npm install       # once, or after dependencies change
npm run dev       # http://localhost:8081  (add ?scene=Play to skip the title)
```

| Command                             | What it does                                             |
| ----------------------------------- | -------------------------------------------------------- |
| `npm run dev`                       | Dev server with hot reload on port **8081**              |
| `npm run build`                     | Type-check, then build static files into `dist/`         |
| `npm run preview`                   | Serve the built `dist/` on port 9081                     |
| `npm run check`                     | Everything CI runs: typecheck, lint, format check, tests |
| `npm test` / `npm run test:watch`   | Unit tests (Vitest)                                      |
| `npm run lint` / `npm run lint:fix` | ESLint                                                   |
| `npm run format`                    | Auto-format with Prettier                                |

## Project layout

```
src/
  main.ts          Entry point: builds the Phaser game from the scene list
  config/          gameConfig.ts (resolution, palette), tuning.ts (gameplay numbers)
  scenes/          Boot → Title → Play
  entities/        Game objects with behaviour (Snail)
  systems/         Pure game logic, unit-tested (movement)
  ui/              Shared text styles and UI helpers
  utils/           Small helpers (math, accessibility)
public/assets/     Images/audio served as-is (credit them in docs/ASSET_ATTRIBUTION.md)
tests/             Vitest unit tests for systems/ and utils/
docs/              Design, science, art, playtesting, roadmap
```

**Tuning:** gameplay numbers (speeds, counts) live in [`src/config/tuning.ts`](src/config/tuning.ts).

## Docs

[Game design](docs/GAME_DESIGN.md) · [Science](docs/SCIENCE.md) · [Art direction](docs/ART_DIRECTION.md) · [Playtesting](docs/PLAYTESTING.md) · [Roadmap](docs/ROADMAP.md) · [Asset attribution](docs/ASSET_ATTRIBUTION.md) · [Changelog](CHANGELOG.md)

## License

Proprietary, © Minus 80 Studio. All rights reserved (to be finalized before any public release).
Scaffolded from the official [phaserjs/template-vite-ts](https://github.com/phaserjs/template-vite-ts) (MIT, see `TEMPLATE_LICENSE.txt`).
