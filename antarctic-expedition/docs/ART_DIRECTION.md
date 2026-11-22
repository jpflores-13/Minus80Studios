# Art direction

## Current state

All visuals are procedural Phaser shapes and text glyphs (`src/config/gameConfig.ts`'s `PALETTE`, plus
`Phaser.GameObjects.Arc`/`Rectangle`/`Graphics` drawn directly in each scene) — no external image assets.
This is a placeholder visual language, not a final art pass; see `docs/ARTIST_BRIEF.md` for what a real
pass should produce.

## Palette

Southern Ocean colors, defined once in `PALETTE`: `midnight`/`ink` (deep water, backgrounds), `marine`
(mid-water panels), `glacier`/`ice` (foreground water and UI strokes), `mint` (targets, success,
confirmation), `amber`/`gold` (uncertainty, highlights, the "unknown" badge), `coral` (artifacts,
disturbance, failure). Every game-object color pairs with a non-color cue — see Accessibility below.

## Visual language

- **ONE DROP/RECONSTRUCT particles**: color-coded by `ParticleKind`, but also distinguished by stroke
  style (artifacts get a coral-vs-ice border) and the small separate `?` badge, so classification never
  depends on color alone.
- **DIVE wildlife**: a mood border (ice = idle, amber = alert, coral = fleeing) plus a species-initial
  glyph and a text label — never color alone.
- **Instruments**: implied through scene framing and HUD text (e.g., "FLUORESCENCE MICROSCOPE") rather
  than a drawn instrument model, pending real iconography.
- **Typography**: a serif ("Georgia"-family) for headings/HUD numerals, a system sans for body and hints
  — `src/ui/text.ts`'s `TEXT_STYLES`.

## Motion

Particle drift, wildlife wander/flee, and the RECONSTRUCT reveal's rotation are the only continuous
motion. `reducedEffects` in Settings does not change core particle/wildlife movement (that's the
mechanic), but should be extended to soften screen fades and tween-based popups if a future pass adds
heavier effects.
