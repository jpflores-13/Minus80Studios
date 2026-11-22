# Artist brief

This game currently ships with procedural placeholder shapes everywhere (see `docs/ART_DIRECTION.md`).
This is the brief for a future illustration pass, organized by priority.

**Status update:** Priorities 1 and 2 below no longer mean "every specimen is a plain colored circle."
`src/render/art.ts` now draws one small code-drawn silhouette per DIVE species and per ONE DROP/RECONSTRUCT
organism — still procedural placeholder art, not real illustration, but each organism has its own shape
now, not just its category's color. A real illustration pass should still replace these; treat each
existing silhouette as a sketch of what that pose/species should communicate, not a spec to trace.

## Priority 1 — DIVE wildlife (five species)

Weddell seal, leopard seal, Adelie penguin, crocodile icefish, Antarctic krill swarm
(`src/content/wildlife.ts`). Each needs: an idle pose, an alert pose, a fleeing pose, and — where
`behavior` is defined — a distinct "behavior active" pose (e.g., the leopard seal mid-call). Style should
read clearly at the small sizes DIVE renders wildlife at (roughly 32px on screen). Each species currently
has one static code-drawn silhouette (no pose variants yet) — see `src/render/art.ts`.

## Priority 2 — ONE DROP / RECONSTRUCT specimens (28 entries across six scales)

`src/content/organisms.ts`'s `SPECIMENS`. Each scale needs one target, several non-targets, one or two
artifacts, and one unknown — visually distinct within a scale (shape, not only color), and distinct
enough from other scales' specimens that players recognize which scale they're in from the art alone.
Real organisms (copepod, krill/krill larva, diatom, dinoflagellate, ciliate, labelled bacterium,
virus-like particle) now have a distinct code-drawn shape each; artifacts and "unknown" particles are
still deliberately generic (a ring, a blur, a scatter of flecks) since they aren't organisms. RECONSTRUCT's
own molecular-scale categories are left as plain colored frames on purpose — see `docs/ART_DIRECTION.md`.

## Priority 3 — Instrument framing

A visual frame or vignette per instrument (underwater camera, stereomicroscope, compound light
microscope, fluorescence microscope, fluorescence + electron microscope, cryo-electron microscope) to
replace the current plain HUD text naming the instrument. See `docs/INSTRUMENT_DATABASE.md`.

## Priority 4 — Cinematic assets

- The campaign ending's scale zoom-out (`CampaignEndingScene`), currently six plain circles.
- A title-screen illustration of the research vessel, currently a flat color field with dots standing in
  for stars/bubbles.

## Constraints

- Original or licensed assets only, logged in an asset-attribution doc once any exist (none do yet — see
  `docs/ASSET_MANIFEST.csv`).
- No researcher photos or likenesses; DIVE wildlife and ONE DROP specimens are illustrations of species
  and specimen types, not any specific real photograph.
- Keep file sizes reasonable; this ships as a static site with no backend.
