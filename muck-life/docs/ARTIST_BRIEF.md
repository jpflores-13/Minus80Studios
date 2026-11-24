# Artist brief

Everything on screen today is drawn procedurally as a placeholder. This brief and
[`ASSET_MANIFEST.csv`](ASSET_MANIFEST.csv) let an artist replace it **without changing gameplay code**:
the simulation (`src/systems/`) never touches art, and each placeholder lives in one draw function.
Read [`ART_DIRECTION.md`](ART_DIRECTION.md) first.

## Canvas and coordinates

- Game resolution 1280 × 720 (16:9), scaled to fit. Provide art at **2×** (2560 × 1440 reference) for
  sharpness on phones. Export PNG (sprites, 32-bit alpha) or SVG (logo, icons).
- The sediment starts at y = 180 (water line ~160–180). The oxygen grid is 16 px cells over
  x 0–1280, y 180–724. The toolbar strip is y 676–720.
- **Roots are data-driven polylines,** so they cannot be single sprites. Supply **tileable segment
  textures** (drawn along the path), **node/tip caps**, and a **young → mature tint ramp**. See
  `RootRenderer` in `src/render/marsh.ts`.

## Where to integrate

| Area                                    | Code entry point                                                    | Replace with                                                           |
| --------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Sky, sun/moon, grasses, water, cattails | `Aboveground` (`render/marsh.ts`)                                   | Layered parallax PNGs, cattail sprite sheet with sway frames           |
| Sediment                                | `drawSediment`                                                      | 1280×544 tileable sediment PNG (+ grain overlay)                       |
| Roots/rhizomes                          | `RootRenderer`                                                      | Segment textures, caps, scale-leaf and node sprites                    |
| Heatmap                                 | `Heatmap`                                                           | Keep procedural (it is data). Art may add a subtle film-grain overlay. |
| Artefacts                               | `drawDistractors`                                                   | 3 small animated sprites (glint, fluorescence, noise)                  |
| Reticle, rings, markers, ✓              | `PlayScene` (`drawReticle`, `drawFx`, `drawMarkers`, `drawOverlay`) | Sprite-sheet animations                                                |
| Logo, O₂ RUSH                           | `render/logo.ts`                                                    | SVG/PNG logos (keep the root-through-letters idea)                     |
| Ending/Explore illustrations            | `render/scienceArt.ts`                                              | Seven discovery illustrations, rhizobox diagram                        |
| Buttons                                 | `ui/Button.ts`                                                      | 9-slice panel and focus-ring art                                       |
| Site thumbnail                          | `site/index.html` (inline SVG, 160×90)                              | 640×360 PNG or refined SVG                                             |

Loading: add a `preload()` in `BootScene` (Phaser `this.load.image/spritesheet`) and swap each draw
function's Graphics calls for `this.add.image/sprite`. Keep the same depths (sky 0–2, sediment 3,
heatmap 5, roots 6, overlays 7–13, HUD 19+).

## Must-keep constraints

1. Oxygen colours are an imaging scale. No glowing-gas or bubble clouds rising from roots.
2. Colour-independent cues stay: outlines, ✓, artefact shapes, ◎ / ■ chemistry glyphs.
3. Rhizomes read as stems (nodes, scale leaves), distinct from roots.
4. Gameplay ramets have no flower spikes (the lab plants were vegetative). Title and opening may show
   them.
5. Do not copy the paper's figures or MBL photographs. All art must be original.

## Promotional

Key art (1920×1080 and 1080×1350): a cutaway marsh at dusk, a cattail above, glowing optode pools around
branching roots below, and the logo. Also needed: a social card (1200×630) and a store/itch capsule
(630×500).
