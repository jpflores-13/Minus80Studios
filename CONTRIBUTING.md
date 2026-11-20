# Working on Minus 80 Studios games

## Setup

Each game is its own Phaser 4 + TypeScript + Vite project. You need Node 26. See the [root README](README.md)
for the full list of game folders and dev ports.

```bash
cd snail-assassin    # or any other game folder
npm install
npm run dev          # each game has its own fixed dev port, see README.md
npm run check        # typecheck, lint, format check, tests (run before committing)
npm run build        # static files in dist/
```

Pushing to `main` runs CI only for the game(s) you changed (each has its own path-filtered workflow in
`.github/workflows/`), then rebuilds and republishes all six games to GitHub Pages together.

## House rules

- **Science.** Each game's `docs/SCIENCE.md` is the source of truth. Don't put a fact, number, or citation in
  the game unless it's in that file with a source. If something is a guess or a gameplay simplification, say so.
- **People.** This repo is public. No researcher names, photos, quotes, or bios until that person has said yes
  in writing. Name institutions and link published sources instead.
- **Name.** In text, the studio is "Minus 80 Studios". The logo and wordmark are "-80" (plain hyphen).
- **Tuning.** Balance numbers live in `src/config/tuning.ts` (or the equivalent tuning module) and the
  character/level data, not in scenes.
- **Logic vs. drawing.** Game rules go in `src/systems/` with no Phaser imports, so they can be tested.
  Scenes read input and draw.
- **Tests.** Every game has its own Vitest suite for its core rules; keep it passing when you tune. Snail
  Assassin and Downstream! also have dedicated balance tests (`tests/hunt.test.ts`, `tests/sim.test.ts`) that
  check every character or level can be won and that shortcuts fail.
- **Accessibility.** Everything works with keyboard, mouse and touch; nothing relies on colour alone; reduced
  effects is respected; and important text goes through `announce()` for screen readers. Snail Assassin and
  Downstream! also have a `docs/ACCESSIBILITY.md` and a `tests/colors.test.ts` that must keep passing; the
  other four games don't have a dedicated accessibility doc yet.
- **Assets.** Original or properly licensed only. Snail Assassin and Downstream! credit theirs in
  `docs/ASSET_CREDITS.md`; the other four games currently use only code-drawn placeholder art.
- **Secrets.** Never commit `.env` files, keys, or tokens.
