# Art direction

**Mood:** whimsical, a little mysterious, a little mischievous, never childish. An indie arcade game, not an
educational simulation. Warm hand-drawn plants, a clean modern UI, and one vivid scientific glow.

## Palette (`PALETTE` in `src/config/gameConfig.ts`)

| Name             | Hex       | Use                                                     |
| ---------------- | --------- | ------------------------------------------------------- |
| Deep mud         | `#28231F` | Background, deepest sediment, text strokes              |
| Wet sediment     | `#5B4839` | Upper sediment layer                                    |
| Cattail green    | `#688C55` | Leaves                                                  |
| Root tan         | `#C6AD84` | Roots and rhizomes (young tissue paler, mature browner) |
| Oxygen mint      | `#70DAB8` | Heatmap mid-high, success, chemistry ◎                  |
| Optode cyan      | `#80DCE3` | Heatmap high, tools, scan                               |
| Scientific amber | `#E8BD72` | UI accents, markers, reticle lock, titles               |
| Warm cream       | `#F4E8CE` | Text, heatmap peak                                      |

## The two worlds

- **Aboveground (top 180 px):** sky that blends between day and night, sun/moon, a band of marsh
  grasses, a shimmering water line, swaying cattail ramets. Flower spikes appear only in the opening and
  title. The study's plants were vegetative, so gameplay ramets have no spikes.
- **Belowground:** four soft sediment bands with grains. Rhizomes are thick, segmented underground
  **stems** with node rings and papery scale leaves, and a pointed pale apex while growing. Adventitious
  roots are medium, tapering, with a pale root cap. Laterals are fine hairs. Tissue colour shifts from
  cream (young) to tan-brown (mature, ~120 h). They must not look like generic tree roots.

## The optode glow

The heatmap is an **imaging overlay**, never a light source in the mud. It is always paired with a
numbered legend ("% O₂ sat. · imaging scale"). In "roots + oxygen" view, low values are transparent. In
"oxygen imaging" view, it is an opaque sensor sheet. Scales: Optode (mud → teal → mint → cyan → cream),
Viridis, Greyscale. Each must brighten monotonically.

Artefacts must look **unlike** real pools: hard squares with glints, flickering diamonds, pixel
speckle. Real pools are smooth and hug tissue.

## Type

Display: rounded humanist sans ("Trebuchet MS" stack; replace with a licensed organic display face).
Body: system sans. The "-80" studio mark stays Georgia serif.

## Motion

Gentle sway, water shimmer, star twinkle. Arcade feedback (rings, shutter brackets, floating points) is
short (≤ 0.7 s). Reduced motion disables camera moves, shake, sway, and drift.

## Logo

"MUCK LIFE" in chunky cream letters, mud-outlined, with a root threading through the word, a lateral
branch dropping below, and a mint O₂ bubble at the root tip over a faint cyan glow. The **O₂ RUSH**
sub-logo is italic amber with speed streaks. Current versions are procedural placeholders
(`src/render/logo.ts`).
