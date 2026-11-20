# OFF TARGET.

_Every second counts._ A retro arcade rescue platformer from [Minus 80 Studios](../studio/README.md).
Phaser 4 + TypeScript + Vite. Original game concept contributed by a researcher at the Broad Institute
(name and credits pending approval).

**Status:** v0.1, first playable. Six stages, four heroes, two bosses, three difficulties, time trials.

CHOP has been sent to the wrong target, GENE. Run, jump and climb as ACE to reach CHOP and stop it before its
countdown (searching → locking on → gripping → cutting) runs out.

## Quick start

```bash
npm install
npm run dev     # http://localhost:8084   (dev: ?scene=Stage&stage=stage-3&hero=block)
npm run check   # typecheck, lint, format, tests
npm run build
```

## Controls

Keyboard: arrows/WASD move and climb, Space/Z/K jump (hold for higher), E/X/J use your power, Esc/P pause,
down + jump drops through a ledge. Gamepad: stick or d-pad, A jump, B/X power, Start pause. Touch: on-screen
d-pad, JUMP and ★ buttons. Everything important is announced to screen readers.

## Layout

```
src/
  systems/   Pure and unit-tested: tilemap, physics, boss (countdown), game (stage rules), scoring
  content/   characters.ts (heroes, bosses, compatibility: edit here), science.ts (ending text)
  levels/    One file per stage; maps are text, one character per tile (key in systems/tilemap.ts)
  render/    art.ts: every sprite, drawn in code and replaceable by images under the same keys
  scenes/    Boot → Splash → Title → Intro → StageSelect → HeroSelect → Stage (+ Hud, Pause) → Results → Ending
  input/     Keyboard + gamepad (Controls), touch buttons (TouchControls)
  audio/     Synthesized chiptune music and effects
```

## Docs

[Science notes](docs/SCIENCE.md) · [Changelog](CHANGELOG.md)
