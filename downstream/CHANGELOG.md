# Changelog

All notable changes to this project. Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

## [0.2.0] - 2026-11-19

### Added

- Level 1, The Neighborhood: a complete Investigate → Deploy → Release the Flow → Results loop.
- Pure, tested systems: waterway network, litter ledger (one state per item plus audit history), seeded fixed-step
  transport simulation, equipment inventory and placement rules, scoring and stars.
- Trash bins (prevention) and trash traps (finite capacity, partial channel coverage); drag-and-drop and
  click-to-place; repositioning during deployment; placing remaining equipment mid-flow.
- Pause, ×3 speed, restart, flow-direction overlay, qualitative source inspection.
- Balance tests: multiple winning strategies, some losing ones, three stars achievable.
- SCIENCE.md built from the three provided sources; LEVEL_DESIGN.md and ENDING_SEQUENCE.md.

### Changed

- Click-to-intercept sandbox replaced. `ASSET_ATTRIBUTION.md` renamed to `ASSET_CREDITS.md`.

## [0.1.0] - 2026-11-19

### Added

- Project foundation: Phaser 4.2.1, TypeScript 6 (strict), Vite 8, Vitest, ESLint, Prettier, GitHub Actions CI.
- Boot → Title → Play scenes with code-generated placeholder art.
- River sandbox: placeholder plastic debris drifts with a placeholder current profile; click/tap to intercept, with a running tally.
- Centralized gameplay tuning in `src/config/tuning.ts`.
