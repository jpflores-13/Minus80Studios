# Art direction

## Current state

All visuals are procedural Phaser shapes and text glyphs (`src/config/gameConfig.ts`'s `PALETTE`, plus
`Phaser.GameObjects.Arc`/`Rectangle`/`Graphics` drawn directly in each scene, or generated once into a
reusable texture by `src/render/art.ts`) — no external image assets. This is a placeholder visual
language, not a final art pass; see `docs/ARTIST_BRIEF.md` for what a real pass should produce.

`src/render/art.ts` draws one small code-drawn silhouette per ONE DROP/RECONSTRUCT organism
(`src/content/organisms.ts`) and per DIVE wildlife species (`src/content/wildlife.ts`), generated once
into a texture at boot (`BootScene`) and reused by every instance, rather than every specimen of a given
`kind` sharing one plain colored circle. Where a shape reflects a real structural feature — a copepod's
long antennae, a diatom's symmetric striated frustule, a dinoflagellate's trailing flagellum, a virus's
polyhedral capsid, krill's segmented body — that is grounded in natural history (see `docs/SCIENCE.md`,
`docs/ORGANISM_DATABASE.md`). Artifacts, noise, and "unknown" particles stay deliberately abstract (a
ring, a blur, a scatter of flecks) since they are not organisms and have no real shape to reflect.
RECONSTRUCT's own particle-picking frames (`ReconstructScene`) are left as-is rather than given
per-category sprites: a real cryo-EM micrograph's quality categories (clear projection, overlap,
contamination, poor orientation) are about signal quality, not organism identity, and indistinct blobs at
low signal-to-noise are genuinely what that picking step looks like.

## Palette

Southern Ocean colors, defined once in `PALETTE`: `midnight`/`ink` (deep water, backgrounds), `marine`
(mid-water panels), `glacier`/`ice` (foreground water and UI strokes), `mint` (targets, success,
confirmation), `amber`/`gold` (uncertainty, highlights, the "unknown" badge), `coral` (artifacts,
disturbance, failure). Every game-object color pairs with a non-color cue — see Accessibility below.

## Visual language

- **ONE DROP/RECONSTRUCT particles**: each specimen type has its own code-drawn shape
  (`src/render/art.ts`), tinted by `ParticleKind` and ringed with a stroke (artifacts get a coral-vs-ice
  border) with the small separate `?` badge on top — species identity, kind color, stroke, and the badge
  are all independent cues, so classification never depends on color alone.
- **DIVE wildlife**: each species has its own code-drawn shape, a mood border (ice = idle, amber = alert,
  coral = fleeing), and a text label — never color alone.
- **Instruments**: implied through scene framing and HUD text (e.g., "FLUORESCENCE MICROSCOPE") rather
  than a drawn instrument model, pending real iconography.
- **Typography**: a serif ("Georgia"-family) for headings/HUD numerals, a system sans for body and hints
  — `src/ui/text.ts`'s `TEXT_STYLES`.

## Motion

Particle drift, wildlife wander/flee, and the RECONSTRUCT reveal's rotation are the only continuous
motion. `reducedEffects` in Settings does not change core particle/wildlife movement (that's the
mechanic), but should be extended to soften screen fades and tween-based popups if a future pass adds
heavier effects.
