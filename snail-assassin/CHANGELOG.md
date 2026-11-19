# Changelog

All notable changes to this project. Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

## [0.2.0] - 2026-11-19

### Added

- Atlas vertical slice: top-down pixel-art reef, cone-snail player, schooling reef fish.
- Pure, tested simulation: metabolic, escape-responsiveness, venom resource and cooldown, current field, and hunt
  modules; seeded RNG for reproducible hunts.
- Glucose Crash (Q) and System Override (E) drifting venom clouds, Engulf (Space), and the insulin + override synergy.
- HUD (objective, timer, venom, ability readiness), help card, pause (Esc), restart (R), and results screen.
- Balance tests: a scripted bot wins with the combo and never wins with Glucose Crash alone.
- Science evidence table, model equations, and ending-sequence format docs.

### Changed

- Side-view sandbox replaced by the top-down hunt. `ASSET_ATTRIBUTION.md` renamed to `ASSET_CREDITS.md`.

## [0.1.0] - 2026-11-19

### Added

- Project foundation: Phaser 4.2.1, TypeScript 6 (strict), Vite 8, Vitest, ESLint, Prettier, GitHub Actions CI.
- Boot → Title → Play scenes with code-generated placeholder art.
- Movable placeholder cone snail (keyboard, mouse, and touch) with drifting "marine snow" (respects reduced motion).
- Centralized gameplay tuning in `src/config/tuning.ts`.
