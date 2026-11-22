# Changelog

All notable changes to this project. Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- A painted backdrop (ridges, a tree line, a stream band, drifting fireflies) behind Title,
  Intro, Level Select and Settings, instead of a flat colour fill.
- Richer tile art: two stable-by-position variants each for forest floor, moss patches and
  clearings so the ground doesn't look like one tile repeated; animated water shimmer; grain and
  highlights on logs and rock barriers.
- A soft halo around Moss, and drifting ambient motes through the forest while it's not raining,
  on dry weather and in menus. All skip under Reduced Motion, same as the existing rain effect.
- All five campaign levels redesigned, much larger and spatially complex: real branching
  streams, two-watershed crossings, zigzagging barrier lanes and a wide rain-timed clearing,
  instead of single narrow corridors. Every level now fills the screen at the game's zoom
  instead of sitting in a sliver near the top (the previous maps were only 160-288px tall
  against a 720px-tall, 1.4x-zoomed canvas). Beyond the Divide's procedural generator was
  enlarged the same way. Difficulty now escalates deliberately from level 1 (a true tutorial)
  through level 5, validated with a scripted bot playthrough rather than asserted by eye.
- Moss redrawn: a longer, more clearly salamander-shaped body (a long sinuous spine, a
  distinctly wider head, four small splayed legs, a tapering tail), bigger expressive eyes, and
  a warmer colour palette, at both the in-level scale and the larger scale used on Title/Intro.
- Each level's terrain art now reflects a real Pacific Northwest setting instead of one
  undifferentiated forest look: shaded headwater forest with sword fern and heavy bigleaf-maple
  moss (levels 1-2), a drier upland past the stream's end (level 3), an open ridge crossing
  (level 4), and a wider, sunnier valley-bottom crossing (level 5). See docs/SCIENCE.md,
  "Backdrop / set-dressing notes," for exactly what's a cited real fact versus a labelled
  stylistic choice.

## [0.1.0] - 2026-11-22

### Added

- Initial build: the terrain/moisture/watershed engine, five hand-built levels (Little Creek
  through When It Rains), a seeded procedural "Beyond the Divide" endless mode with a
  reachability check on every generated map, the full scene set (Title, Settings, Level Select,
  Level, HUD, Pause, Results, Ending), and the scientific discovery ending.
- Accessibility: keyboard, gamepad and touch input; a reduced-motion toggle; a large-text toggle;
  an easier-moisture difficulty toggle; screen-reader announcements throughout.
