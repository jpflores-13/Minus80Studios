# HEIST.

_Distance is your greatest weapon._ A stealth-action puzzle game from
[Minus 80 Studios](../studio/README.md). Phaser 4 + TypeScript + Vite.

**Status:** Phase 1 prototype: one job, built to answer whether folding the building is genuinely fun.

## What's in Phase 1

- **GHOST** and Job 01, _The Diamond District_: a jewellery store with a shop floor, glass display cases,
  one patrolling guard, one sweeping camera, and a vault at the far end of a long service corridor.
- **The Folder**: deploy it anywhere on the service corridor (Space / FOLDER) and its two ends reel the
  corridor in independently, at a random pace, until an anchor stops one of them. Once the ends are far
  apart they link: step into either glowing doorway and you come out of the other, carrying your position
  with you. The fold has a limited lifetime, a cooldown, and a fixed number of charges.
- **Stealth**: guards and cameras have readable vision cones (dashed edges, so they don't depend on
  colour). Suspicion rises while seen and cools when you're not; too much ends the job. Glass display
  cases block your path but not a guard's view. Guards plan routes through open folds too.
- **The job**: grab the diamond, then reach the van before the escape clock runs out. Optional loot adds
  to the score. Up to three stars, local high scores.
- Opening scene, title, settings, results, keyboard, gamepad and touch controls.

## Not built yet (next phases)

Jobs 2–7, the remaining crew (FLASH, ANCHOR, PHANTOM, ARCHITECT), directional security gates and
multiple simultaneous Folders, upgrades, achievements, the scientific reveal, The Perfect Crime
challenge mode, and the optional Science Mode.

## Quick start

```bash
npm install
npm run dev     # http://localhost:8086   (dev: ?scene=Job)
npm run check
```

## Layout

```
src/
  systems/   extrusion.ts (the underlying ordered-pathway engine), folder.ts (the Folder on top of it),
             building.ts (map parsing, the pathway, line of sight), mission.ts (the whole job, pure and tested)
  content/   crew.ts (thieves and their Folder settings)
  levels/    one file per job; maps are text, one character per tile
  render/    art.ts (placeholder art: the building, the crew, the Folder)
  scenes/    Boot → Splash → Intro → Title → Job (+ Hud, Pause) → Results, Settings
```

[Science notes and open questions](docs/SCIENCE.md) · [Changelog](CHANGELOG.md)
