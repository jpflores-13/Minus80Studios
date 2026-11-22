# Accessibility

## Input

- **Keyboard**: every interactive action has a keyboard path. ONE DROP/RECONSTRUCT/Endless: Tab cycles
  the nearest live particle, Enter documents it as the target, U marks it as an honest unknown. DIVE:
  arrows or WASD to move, Space to photograph, E to collect the sample. Menus: arrow keys or WASD to move
  focus, Enter/Space to choose, Escape to go back. Pause is always Escape or P; restart is always R from
  the pause menu.
- **Pointer/touch**: every action above also has a direct tap/click target (the particle body, its `?`
  badge, on-screen buttons). No mechanic requires a keyboard.
- **Gamepad**: menus support d-pad/stick navigation and A/B (via `ui/Menu.ts`'s shared pattern); in-round
  gamepad support for DIVE/ONE DROP movement is not yet implemented — a known gap, not a deliberate
  choice.

## Screen readers

`src/ui/announce.ts` posts to a hidden `aria-live` region (`#sr-announcer` in `index.html`) for every
expedition intro, round outcome, documented-unknown confirmation, disturbance event, sample collection,
and mystery resolution. The game canvas itself has an `aria-label` describing the core controls.

## Visual accessibility

- No signal depends on color alone: ONE DROP particle kinds pair color with stroke style and the
  separate `?` badge; DIVE wildlife mood pairs a border color with the animal's actual flee/idle
  behavior, visible independent of color.
- `largeText` in Settings scales UI text via `src/ui/textScaling.ts` and restarts the current scene to
  apply it immediately.
- `reducedEffects` in Settings is available for any future heavier screen-fade or pulse effects; current
  scenes are already fairly restrained (fades only, no flashing).

## Pacing

- `relaxedMicroscopy` in Settings slows ONE DROP, RECONSTRUCT, and Endless rounds (via a `speedMul` on
  the simulation step) for players who want more time without changing scoring rules.
- Every round can be paused, resumed, or restarted at any time; no mechanic punishes pausing.
- Campaign expeditions can be retried immediately on a loss, with no required replay of earlier
  expeditions.

## Known gaps

- No adjustable ONE DROP particle size / DIVE target-size setting yet for players who need larger tap
  targets beyond what `largeText` affects.
- In-round gamepad movement (DIVE, ONE DROP's pointer-based capture) is menu-only today.
