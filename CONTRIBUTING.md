# Working on Minus 80 Studios games

## Setup

Each game is its own Phaser 4 + TypeScript + Vite project. You need Node 26.

```bash
cd snail-assassin    # or downstream
npm install
npm run dev          # Snail Assassin on :8081, Downstream! on :8082
npm run check        # typecheck, lint, format check, tests (run before committing)
npm run build        # static files in dist/
```

Pushing to `main` runs CI for the game you changed and republishes both games to GitHub Pages.

## House rules

- **Science.** Each game's `docs/SCIENCE.md` is the source of truth. Don't put a fact, number, or citation in
  the game unless it's in that file with a source. If something is a guess or a gameplay simplification, say so.
- **People.** This repo is public. No researcher names, photos, quotes, or bios until that person has said yes
  in writing. Name institutions and link published sources instead.
- **Name.** In text, the studio is "Minus 80 Studios". The logo and wordmark are "-80" (plain hyphen).
- **Tuning.** Balance numbers live in `src/config/tuning.ts` and the character/level data, not in scenes.
- **Logic vs. drawing.** Game rules go in `src/systems/` with no Phaser imports, so they can be tested.
  Scenes read input and draw.
- **Balance tests.** `tests/hunt.test.ts` (Snail Assassin) and `tests/sim.test.ts` (Downstream!) check that every
  character/level can be won and that shortcuts fail. Keep them passing when you tune.
- **Accessibility.** Everything works with keyboard and mouse, nothing relies on colour alone, and reduced
  effects is respected.
- **Assets.** Original or properly licensed only, and credited in `docs/ASSET_CREDITS.md`.
- **Secrets.** Never commit `.env` files, keys, or tokens.
