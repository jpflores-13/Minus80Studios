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

## [0.1.0] - 2026-11-22

### Added

- Initial build: the terrain/moisture/watershed engine, five hand-built levels (Little Creek
  through When It Rains), a seeded procedural "Beyond the Divide" endless mode with a
  reachability check on every generated map, the full scene set (Title, Settings, Level Select,
  Level, HUD, Pause, Results, Ending), and the scientific discovery ending.
- Accessibility: keyboard, gamepad and touch input; a reduced-motion toggle; a large-text toggle;
  an easier-moisture difficulty toggle; screen-reader announcements throughout.
