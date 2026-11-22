# Changelog

All notable changes to this project. Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Fixed

- The ability HUD, cost text, and a couple of lines of flavor text said "venom" for every
  character, including Glaucus the blue shark — sharks have no venom at all. Each character now
  has its own `resourceName` ("Venom" for the cone snails and the octopus, both genuinely
  venomous; "Energy" for the shark), used everywhere the resource is shown or mentioned.

### Added

- **Escalation level: Glaucus, the playable blue shark** (_Prionace glauca_) — the same blue shark that hunted
  Cipher is now playable. After Cipher's level, reachable from the same "Choose Your Assassin" screen: Pursuit
  (give chase: lock onto the nearest squid and swim hard at it for a few seconds, no aiming), Burst (a short extra
  push of speed that buys more time on a chase already underway), and Swallow Whole (pull the catch in). Unlike
  every other character, Glaucus never aims a cursor at anything — closing the distance before the chase window
  runs out is the whole challenge, echoing real telemetry showing blue shark swimming speed is far from constant.
  Glaucus hunts squid scattered individually in open water — blue sharks are major, well-documented predators of
  squid and other cephalopods — while a **pod of orcas** hunts Glaucus in turn: several threats coordinating
  instead of one, drawn much bigger than the player. Once any pod member spots the player, the rest are alerted
  toward them too, echoing the real, documented fact that orca pods hunt cooperatively (orcas are documented
  repeatedly, cooperatively hunting juvenile whale sharks and, via genetic evidence, a white shark — not the blue
  shark specifically; the game says so plainly rather than overclaiming). "Did you know?" gets an extra step for
  Glaucus revealing the real science behind the orca pod, and the results screen shows a fact about both. See
  docs/SCIENCE.md for the citations behind every ability and behaviour.

- **Escalation level: Cipher, the playable octopus** (_Octopus bimaculoides_). After the three-snail campaign,
  reachable from the same "Choose Your Assassin" screen: Camouflage (a timed stealth window that slows Cipher down
  but makes the shark barely notice it moving), Pounce (a synchronous ambush strike that restrains its catch the
  instant it lands — no separate hold-still step), and Draw to Mouth (pull the catch in). Camouflage ends the
  moment Cipher pounces, win or miss, so there's a real decision in when to break cover. Cipher hunts cone snails
  scattered individually across the reef, not schooling fish — cone snails are solitary foragers, so they're placed
  as scattered individuals rather than reusing the three-snail campaign's fish-school spawner. A blue shark
  (_Prionace glauca_) now plays the octopus's old role as the threat that hunts the player, with its own tuning:
  it's faster, and holding still helps less against it, since its real-world basis (electroreception) can sense
  prey that isn't moving. "Did you know?" gets an extra step for Cipher revealing the real science behind the blue
  shark too, and the results screen shows a fact about both. See docs/SCIENCE.md for the citations behind every
  ability and behaviour.

- **Accessibility** (Settings & Accessibility): relaxed mode (no timer, no octopus grabs), large text, assist
  (auto-aim and auto-capture), remappable keys, screen reader announcements, number keys on the ending's buttons,
  and dark outlines on sprites and reef text. See docs/ACCESSIBILITY.md.

### Added (Android and tablets)

- FULL SCREEN option on the title menu where the browser supports it (Android, tablets, desktop), which
  also locks phones to landscape.
- Web app manifest, so "Add to Home screen" opens the game full screen and sideways.

### Added

- HOME buttons on the hunt, select, results, and pause screens.

### Changed

- Cipher's and Glaucus's abilities no longer share the same aim/lock/reel skeleton as the cone snails. Each now has
  a core mechanic grounded in how that animal actually hunts (see the two bullets above and docs/SCIENCE.md) instead
  of the same three-step combo with different flavor text.
- The ending is now called "Did you know?".

## [0.3.0] - 2026-11-19

### Added

- **Catalyst** (_Conus catus_): Lightning Strike (aimed harpoon that immobilizes and tethers one fish), Motor Lock
  (extends immobilization), and Reel In (pull the tethered fish in; the tether breaks if it recovers).
- **Nightshade** (_Conus tulipa_): Ghost Signal (dampens escape responsiveness), Silent Tide (insulin-inspired cloud),
  and Phantom Net (engulf weakened, unaware fish).
- Neural module and escape-responsiveness effects in the shared prey simulation; strikes startle nearby fish.
- Minus 80 Studios splash, cinematic title menu, "Choose Your Assassin" select screen (all characters available),
  first-hunt tutorial checklist per character, and a richer pause menu (choose character, sound, effects).
- "Did You Know?" discovery sequence: reveal, species discovery text (draft pending expert review),
  "From Venom to Medicine", research links, replay and menu buttons, and the studio signature. Also
  reachable from the main menu. Skippable; auto-advances.
- Synthesized audio (ambience, ability sounds, per-character pitch) with mute and volume; reduced-effects setting.
- Dev-only balancing panel (backtick key): live sliders, prey-state plot, JSON export. Stripped from production builds.
- Tests: all three characters win with their combos; shortcuts fail; long strikes need Motor Lock; content links trace to SCIENCE.md.

## [0.2.0] - 2026-11-19

### Added

- Atlas vertical slice: top-down pixel-art reef, cone-snail player, schooling reef fish.
- Pure, tested simulation: metabolic, escape-responsiveness, venom resource and cooldown, current field, and hunt
  modules; seeded RNG for reproducible hunts.
- Glucose Crash (Q) and System Override (E) drifting venom clouds, Engulf (Space), and the insulin + override synergy.
- HUD (objective, timer, venom, ability readiness), help card, pause (Esc), restart (R), and results screen.
- Balance tests: a scripted bot wins with the combo and never wins with Glucose Crash alone.
- Science evidence table, model equations, and ending-sequence format docs.

### Changed

- Side-view sandbox replaced by the top-down hunt. `ASSET_ATTRIBUTION.md` renamed to `ASSET_CREDITS.md`.

## [0.1.0] - 2026-11-19

### Added

- Project foundation: Phaser 4.2.1, TypeScript 6 (strict), Vite 8, Vitest, ESLint, Prettier, GitHub Actions CI.
- Boot → Title → Play scenes with code-generated placeholder art.
- Movable placeholder cone snail (keyboard, mouse, and touch) with drifting "marine snow" (respects reduced motion).
- Centralized gameplay tuning in `src/config/tuning.ts`.
