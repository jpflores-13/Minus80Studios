# Changelog

All dates are build order, not calendar order (this game was built in one continuous session).

## Unreleased

- Project scaffold matching the studio's standard tooling (Phaser, TypeScript, Vite, Vitest, ESLint,
  Prettier) and shared UI/audio/progress conventions.
- ONE DROP's pure engine: weighted spawn tables, the four-category classification
  (target/non-target/artifact/unknown), combo scoring, and honest-uncertainty documentation, fully unit
  tested.
- A standalone, playable ONE DROP arcade scene with title, scale select, results, and pause.
- DIVE's pure engine (wildlife wander/alert/flee, photo scoring, disturbance tracking, one water sample
  per expedition) and its scene, connected so a DIVE's collected sample determines the following ONE
  DROP round's scale.
- RECONSTRUCT, reusing the ONE DROP engine for the molecular scale's stationary particle set, with its
  own particle-picking presentation and an explicitly illustrative structure reveal.
- The Discovery Journal and six Scientific Mysteries, each citing real sources where one exists, with
  Mystery 1 built so honest uncertainty about leopard seal mating is the only correct call.
- The full seven-expedition campaign, threading a `campaignIndex` through DIVE/ONE DROP/RECONSTRUCT,
  pause, retry, and results, ending in a campaign ending scene with Dr. Kienle's real credit.
- Endless Expedition (ONE DROP rounds cycling every scale with rising difficulty) and a More screen to
  keep the title menu short.
- A Settings & Accessibility screen (sound, volume, music, reduced effects, large text, relaxed
  microscopy, controls summary).
- This documentation set.
- Per-species code-drawn sprites (`src/render/art.ts`) for ONE DROP's organisms and DIVE's wildlife,
  replacing plain colored circles shared by every specimen of a kind. Real organisms (copepod, krill and
  krill larva, diatom, dinoflagellate, ciliate, labelled bacterium, virus-like particle, and the five DIVE
  species) get a shape grounded in a real distinguishing feature; artifacts and "unknown" particles stay
  deliberately abstract. The existing kind-color coding (target/non-target/artifact/unknown) and DIVE's
  mood border are both kept as an added cue on top, not replaced.
