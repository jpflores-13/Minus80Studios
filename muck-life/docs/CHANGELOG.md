# Changelog

All notable changes to MUCK LIFE. Format loosely follows Keep a Changelog.

## [Unreleased]

### Added

- The game: procedural cattail root growth (rhizomes, adventitious roots, lateral clusters, growth pulses,
  ramets) driving a simplified oxygen field (age-dependent release, gradient-limited, consumed, diffusing,
  small diel term).
- Model calibrated to Stein & Cardon (2026): pool durations ~73 / 92 / 513 h vs 78 / 95 / 502 h; pools
  24–34% saturation in play; diel swing ~3.9 points.
- Seven-level campaign, results screens with titles and stars, Level Select.
- O₂ RUSH: Classic Rush, Endless Muck, Zen Optode, Time-Lapse Challenge; seeds; local records.
- Optode tools: view modes, Optode Scan, imaging threshold, Time-Lapse replay, ROI windows, chemistry
  overlay. Keyboard signal-snapping.
- Opening sequence, the discovery ending with a measured-vs-simulated comparison, Explore the Science
  (15 topics with basis tags, 4 interactive labs, What We Simplified, References), Meet the Scientists,
  Credits, Records.
- Settings: separate effects/music/ambience volume, reduced motion, large text, three colour scales,
  signal outlines, timers, difficulty, large targets.
- Synthesized music and SFX (Web Audio), with intensity that follows root activity and a night hush.
- Project Yeti event hooks (`src/integration/yeti.ts`).
- Website card, CI workflow, and GitHub Pages build.
- Docs: design, science, science-to-gameplay, references, profiles, review checklist, art direction,
  artist brief, asset manifest, accessibility, playtesting, credits, research hooks.

### Fixed

- Pressing keys quickly could skip ending panels and menu items: with Phaser 4.2.1, a scene's
  keyboard plugin could re-deliver the same key event several times when several arrived in one frame.
  `installKeyDedupe` (`src/ui/keys.ts`) now emits each event once per scene.
