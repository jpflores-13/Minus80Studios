# STARSTRUCK.

_It's not what you see. It's what you feel._ A sensory exploration arcade game from
[Minus 80 Studios](../studio/README.md), inspired by published research on the star-nosed mole.
Phaser 4 + TypeScript + Vite.

**Status:** A complete 6-level campaign: finding and eating prey by touch, then underwater, then evading a
predator, all playable start to finish.

## What's in

- **Six levels**, Diggy Stardust's warren through The Sixth Sense: shallow tunnels, discrimination among
  lookalike decoys, a combo-chaining sprint, a flooded gallery with aquatic prey, a rising-water escape, and a
  finale combining all of it with a patrolling predator.
- **STAR SENSE**: 22 short touch probes (11 per side, uneven lengths) that tap a few times a second. Only what
  they physically touch is revealed, as marks that fade. Materials leave differently shaped marks.
- **STAR FOCUS**: hold Shift / FOCUS to slow down; the innermost pair (ray 11) reaches further and taps faster,
  identifying things quickly. Recognised prey get a ★, a threat a pulsing warning triangle, anything else a ✕.
- **Water and BUBBLE SNIFF**: swim with an oxygen budget; SNIFF releases a bubble that seeks out and reports
  back on the nearest unidentified scent, for prey touch barely reaches on its own.
- **Predators**: patrol a loop until they notice you, then give chase for good.
- **Six playable characters** (Diggy Stardust, Noseferatu, Sherlock Moles, Molezilla, Sir Sniffs-a-Lot, The
  Starfather), each with different sensing/energy/combo stats and a charge-gated special ability.
- **Feeding**: bite (Space / BITE) whatever is under your nose. Prey restore energy and build combos
  (NICE! … WORMAGEDDON!); biting a pebble costs energy and breaks the combo.
- Digging through soft soil (costs energy), energy and time limits (or a flood clock, or a combo target,
  depending on the level), win/lose, restart (R).
- A level-select screen with per-level stars; an opening scene naming the star-nosed mole's touch fovea,
  reaction speed and underwater sniffing with checked citations ("DID YOU KNOW?"), reachable from the title
  screen at any time.
- Settings (visibility, touch memory, auto-bite, vibration, reduced effects, large text), keyboard, gamepad and
  touch controls, with on-screen (not just screen-reader) control hints.

## Not built yet

WORMAGEDDON endless mode, an achievements system, a character-select screen (all six characters currently play
as unlockable stat variants of Diggy, selected programmatically rather than through a menu), and a dedicated
accessibility pass beyond what's listed above.

## Quick start

```bash
npm install
npm run dev     # http://localhost:8083   (dev: ?scene=Level)
npm run check
```

## Layout

```
src/
  systems/   senses.ts (rays, probes, sensory memory), game.ts (movement, digging, water, predators, specials,
             eating, objectives), geometry.ts
  content/   objects.ts (prey and obstacles), characters.ts, science.ts (the ending's checked citations)
  levels/    one file per level (6), maps are text, one character per tile
  render/    art.ts (placeholder art), senseView.ts (the star, its touch marks, water, the bubble, specials)
  scenes/    Boot → Splash → Intro → Title → LevelSelect → Level (+ Hud, Pause) → Results → Ending, Settings
```

[Science notes and open questions](docs/SCIENCE.md) · [Changelog](CHANGELOG.md)
