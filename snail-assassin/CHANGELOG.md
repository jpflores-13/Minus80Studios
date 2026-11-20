# Changelog

All notable changes to this project. Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- **Accessibility** (Settings & Accessibility): relaxed mode (no timer, no octopus grabs), large text, assist
  (auto-aim and auto-capture), remappable keys, screen reader announcements, number keys on the ending's buttons,
  and dark outlines on sprites and reef text. See docs/ACCESSIBILITY.md.

### Added (Android and tablets)

- FULL SCREEN option on the title menu where the browser supports it (Android, tablets, desktop), which
  also locks phones to landscape.
- Web app manifest, so "Add to Home screen" opens the game full screen and sideways.

### Added

- HOME buttons on the hunt, select, results, and pause screens.

### Changed

- The ending is now called "Did you know?".

## [0.3.0] - 2026-11-19

### Added

- **Catalyst** (_Conus catus_): Lightning Strike (aimed harpoon that immobilizes and tethers one fish), Motor Lock
  (extends immobilization), and Reel In (pull the tethered fish in; the tether breaks if it recovers).
- **Nightshade** (_Conus tulipa_): Ghost Signal (dampens escape responsiveness), Silent Tide (insulin-inspired cloud),
  and Phantom Net (engulf weakened, unaware fish).
- Neural module and escape-responsiveness effects in the shared prey simulation; strikes startle nearby fish.
- Minus 80 Studios splash, cinematic title menu, "Choose Your Assassin" select screen (all characters available),
  first-hunt tutorial checklist per character, and a richer pause menu (choose character, sound, effects).
- "Did You Know?" discovery sequence: reveal, species discovery text (draft pending expert review),
  "From Venom to Medicine", research links, replay and menu buttons, and the studio signature. Also
  reachable from the main menu. Skippable; auto-advances.
- Synthesized audio (ambience, ability sounds, per-character pitch) with mute and volume; reduced-effects setting.
- Dev-only balancing panel (backtick key): live sliders, prey-state plot, JSON export. Stripped from production builds.
- Tests: all three characters win with their combos; shortcuts fail; long strikes need Motor Lock; content links trace to SCIENCE.md.

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
