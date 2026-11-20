# STARSTRUCK.

_It's not what you see. It's what you feel._ A sensory exploration arcade game from
[Minus 80 Studios](../studio/README.md), inspired by published research on the star-nosed mole.
Phaser 4 + TypeScript + Vite.

**Status:** Phase 1 prototype: one level, built to answer whether finding and eating prey by touch is fun.

## What's in Phase 1

- **Diggy Stardust** and Level 1, _Hello, Darkness_: shallow tunnels, earthworms, pebbles, roots, soft soil.
- **STAR SENSE**: 22 short touch probes (11 per side, uneven lengths) that tap a few times a second. Only what
  they physically touch is revealed, as marks that fade. Materials leave differently shaped marks.
- **STAR FOCUS**: hold Shift / FOCUS to slow down; the innermost pair (ray 11) reaches further and taps faster,
  identifying things quickly. Recognised prey get a ★, non-food a ✕.
- **Feeding**: bite (Space / BITE) whatever is under your nose. Prey restore energy and build combos
  (NICE! … WORMAGEDDON!); biting a pebble costs energy and breaks the combo.
- Digging through soft soil (costs energy), energy and time limits, win/lose, restart (R).
- Opening scene, settings (visibility, touch memory, auto-bite, vibration, reduced effects, large text),
  keyboard, gamepad and touch controls.

## Not built yet (next phases)

Levels 2–6, larvae and beetles in play, predators, BUBBLE SNIFF and water, other characters and their
specials, WORMAGEDDON, achievements, the science reveal and Behind the Nose.

## Quick start

```bash
npm install
npm run dev     # http://localhost:8083   (dev: ?scene=Level)
npm run check
```

## Layout

```
src/
  systems/   senses.ts (rays, probes, sensory memory), game.ts (movement, digging, prey, eating), geometry.ts
  content/   objects.ts (prey and obstacles), characters.ts
  levels/    one file per level; maps are text, one character per tile
  render/    art.ts (placeholder art), senseView.ts (the star and its touch marks)
  scenes/    Boot → Splash → Intro → Title → Level (+ Hud, Pause) → Results, Settings
```

[Science notes and open questions](docs/SCIENCE.md) · [Changelog](CHANGELOG.md)
