# QUEENLESS

_One colony. No queen. Every bee matters._ A colony action-strategy game from
[Minus 80 Studios](../studio/README.md). Phaser 4 + TypeScript + Vite. Inspired by research from Sarah Kocher's
lab at Princeton on bumble bee social organization.

**Status:** v0.1, complete first build. Six-level campaign plus an endless Queenless Mode.

You're one worker in a bumble bee colony. There's no queen managing anyone and no jobs you assign — every
nestmate decides for itself what needs doing, same as you. Keep the colony fed, the brood tended, and the nest
clean, ring a Buzz Pulse to help a nestmate notice what's needed nearby, and watch what happens to a quiet,
previously unremarkable worker once the queen is gone.

## Quick start

```bash
npm install
npm run dev     # http://localhost:8087   (dev: ?scene=Level&levelId=level-1)
npm run check   # typecheck, lint, format, tests
npm run build
```

## Controls

Keyboard: arrows/WASD or drag to move, Space/E for Buzz Pulse (from Level 2), Esc/P pause, R restart. Gamepad:
stick to move, A/B for Buzz Pulse, Start pause. Touch: drag to move, an on-screen pulse button. Everything
important is announced to screen readers.

## Layout

```
src/
  systems/   colony.ts (the pure, unit-tested agent simulation), queenlessMode.ts (endless mode on top of it)
  content/   characters.ts (the six named workers), science.ts (ending text, checked citations)
  levels/    One file per campaign level; a helpers.ts for shared site/worker setup
  render/    art.ts: every sprite, drawn in code and replaceable by images under the same keys
  scenes/    Boot → Splash → Intro → Title → LevelSelect / Settings → Level (+ Hud, Pause) → Results → Ending
  ui/        Shared menu, button, text, announcer and text-scaling helpers
  audio/     Synthesized chiptune music and effects
```

## Docs

[Science notes](docs/SCIENCE.md) · [Game design](docs/GAME_DESIGN.md) · [Art direction](docs/ART_DIRECTION.md) ·
[Accessibility](docs/ACCESSIBILITY.md) · [Roadmap](docs/ROADMAP.md) · [Changelog](CHANGELOG.md)

## License

© 2026 Minus 80 Studios. All rights reserved. See the [repo-wide LICENSE](../LICENSE) for details.
Scaffolded from [phaserjs/template-vite-ts](https://github.com/phaserjs/template-vite-ts) (MIT, see `TEMPLATE_LICENSE.txt`), which covers only those original template files.
