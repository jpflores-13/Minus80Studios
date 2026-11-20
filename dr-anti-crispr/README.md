# DR. ANTI-CRISPR

_One phage. An entire army._ A portrait, phone-first arcade survival shooter from
[Minus 80 Studios](../studio/README.md). Phaser 4 + TypeScript + Vite. Original concept contributed by a researcher
at the Broad Institute (name and credits pending approval).

**Status:** v0.1, first playable. Eight-wave campaign with two bosses, Endless Survival, Daily Challenge,
four weapons, ACR Cloud, Phage Reinforcements, nine stacking upgrades, three difficulties.

## Quick start

```bash
npm install
npm run dev     # http://localhost:8085   (dev: ?scene=Battle&mode=endless)
npm run check
npm run build
```

## Controls

Phone: drag anywhere to move (the doctor sits just above your finger); tap ACR CLOUD and REINFORCE.
Keyboard: arrows/WASD move, E or Shift cloud, Space reinforce, Esc/P pause, 1–3 choose upgrades.
Gamepad: stick moves, A reinforce, B cloud, Start pause. Firing and aiming are automatic (aim can be set to
"straight up" in Settings). Important events are announced to screen readers.

## Layout

```
src/
  content/   arsenal.ts (enemies, weapons, compatibility: edit here), waves.ts, upgrades.ts, science.ts
  systems/   world.ts (the whole battle, pure and tested), pool.ts (object pooling)
  render/    art.ts: every sprite drawn in code, replaceable by images under the same keys
  scenes/    Boot → Splash → Intro → Title → Battle (+ Pause) → Results → Ending, Settings
  audio/     Synthesized chiptune music and effects
```

## Docs

[Science notes](docs/SCIENCE.md) · [Changelog](CHANGELOG.md)

## License

© 2026 Minus 80 Studios. All rights reserved. See the [repo-wide LICENSE](../LICENSE) for details.
Scaffolded from [phaserjs/template-vite-ts](https://github.com/phaserjs/template-vite-ts) (MIT, see `TEMPLATE_LICENSE.txt`), which covers only those original template files.
