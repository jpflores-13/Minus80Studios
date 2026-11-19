# Snail Assassin

_An atmospheric underwater stealth-and-hunting game inspired by venomous cone snails._
A [Minus 80 Studio](../studio/README.md) prototype · Phaser 4 + TypeScript + Vite.

**Status:** v0.2, Atlas vertical slice. Hunt 3 fish on a top-down reef using the Glucose Crash → System Override → Engulf combo.

## Quick start

Requires Node.js 26 LTS (see `.node-version`).

```bash
npm install       # once, or after dependencies change
npm run dev       # http://localhost:8081  (add ?scene=Hunt to skip the title)
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
  characters/      Character data (Atlas), built from reusable ability kinds
  scenes/          Boot → Title → Hunt (+ Pause) → Results
  entities/        Visual pieces (Reef)
  input/           Device → action mapping (keyboard + mouse now; touch/gamepad later)
  systems/         Pure, unit-tested simulation: hunt, fish, metabolic, escape, venom, current, movement
  ui/              Shared text styles and UI helpers
  utils/           Small helpers (math, accessibility)
public/assets/     Images/audio served as-is (credit them in docs/ASSET_CREDITS.md)
tests/             Vitest unit tests for systems/ and utils/
docs/              Design, science, art, playtesting, roadmap
```

**Tuning:** gameplay numbers (speeds, counts) live in [`src/config/tuning.ts`](src/config/tuning.ts).

## Docs

[Game design](docs/GAME_DESIGN.md) · [Science](docs/SCIENCE.md) · [Art direction](docs/ART_DIRECTION.md) · [Playtesting](docs/PLAYTESTING.md) · [Roadmap](docs/ROADMAP.md) · [Asset credits](docs/ASSET_CREDITS.md) · [Ending format](docs/ENDING_SEQUENCE.md) · [Changelog](CHANGELOG.md)

## License

Proprietary, © Minus 80 Studio. All rights reserved (to be finalized before any public release).
Scaffolded from the official [phaserjs/template-vite-ts](https://github.com/phaserjs/template-vite-ts) (MIT, see `TEMPLATE_LICENSE.txt`).
