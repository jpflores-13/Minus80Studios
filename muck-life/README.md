# MUCK LIFE

_It's a dirty job. Somebody's gotta oxygenate it._

An arcade oxygen-imaging game from [Minus 80 Studios](../studio/), inspired by Stein & Cardon (2026),
"Belowground growth is the primary driver of radial oxygen loss from _Typha angustifolia_ to
sediment," _New Phytologist_ 252(5): 1832–1842 ([doi:10.1111/nph.71593](https://doi.org/10.1111/nph.71593)).

**Status:** complete first build. Seven-level campaign (~9 min), O₂ RUSH (Classic, Endless, Zen,
Time-Lapse Challenge), the discovery ending, Explore the Science (15 topics, 4 interactive labs), Meet
the Scientists, and full settings/accessibility. Art is procedural placeholder (see
`docs/ARTIST_BRIEF.md`). All audio is synthesized.

```bash
npm install
npm run dev     # http://localhost:8090   (dev: ?scene=Play&level=3)
npm run check   # typecheck, lint, format, tests
npm run build   # static files in dist/
```

## Layout

- `src/systems/`: pure, Phaser-free logic (plant growth, oxygen field, regions, scoring, session,
  time-lapse, ROI, virtual experiments), all tested in `tests/`.
- `src/levels/`: campaign and O₂ RUSH configs. `src/config/tuning.ts` holds every number, split into
  MEASURED / SIM / ARCADE.
- `src/content/science.ts`: every scientific claim and citation shown in the game.
- `src/scenes/`, `src/render/`: thin Phaser rendering and input.
- `docs/`: design, science (start with `SCIENCE.md` and `SCIENCE_TO_GAMEPLAY.md`), review checklist,
  art handoff, accessibility, playtesting.
