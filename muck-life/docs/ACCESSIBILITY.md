# Accessibility

Settings are in **Settings & Accessibility** (`MenuScenes.ts → SettingsScene`) and saved locally.

## Input

- **Mouse / touch:** tap a pool to move the reticle there and document it. Toolbar buttons for every
  tool. Taps in the toolbar never count as observations (`pointerIntent`).
- **Keyboard:** arrows/WASD move the reticle; Space / Enter / E document; **Tab / N jumps to the next
  signal**, so no aiming skill is needed. Every action has at least two keys (see `KEYMAP` in
  `src/systems/settings.ts`). Pause is Esc / P, restart is R, mute is M.
- **Gamepad:** left stick moves, A documents, X scans, Y changes view, B jumps to the next signal, Start
  pauses.
- All menus: arrows + Enter/Space, Esc back, or touch.

## Vision

- **Heatmap colour scales:** Optode, Viridis (colour-blind safe), Greyscale (high contrast). All three
  increase monotonically in lightness, which is tested, so they read without colour.
- **Colour-independent signals (on by default):** dashed outlines around every oxygen region, ✓ badges on
  documented regions, distinct shapes for artefacts (squares, diamonds, speckles vs smooth plumes),
  shapes in the chemistry overlay (◎ vs ■), and text labels in the reticle readout ("Lateral root plume ·
  ✓ in record").
- **Large text** (×1.25 everywhere) and readable sans-serif body text.
- **Screen readers:** an ARIA live region announces menu focus, captures (organ, reading, points),
  misses, tips, the night twist, and every ending panel.

## Motor and timing

- **Large Targets:** hit radius 58 → 84 px.
- **Timers:** Standard, Relaxed ×1.5, Extended ×2, Untimed (ends 6 s after objectives are met, or via
  Pause → Finish).
- **Difficulty:** Gentle halves artefacts and allows 10 data gaps in Endless Muck. Spicy adds artefacts.
- **Zen Optode** mode: no timer, no artefacts, no failure.
- A bot at a 2.5 s reaction time completes every level's objectives (tested). After any result you can
  continue, and the ending is always available from More.

## Motion and sound

- **Reduced motion** (defaults to the OS setting): no camera zoom/pan/shake, no fades, no swaying
  plants, no drifting text, static capture rings.
- Independent **effects volume**, **music volume**, and **marsh ambience** controls, plus mute-all.
  Audio is never required: all information is also visual and announced.

## Cinematics

The opening is skippable with any key or tap, and the ending is paged by the player (no auto-advance).

## Known gaps

- Not yet tested with real screen-reader users or on a range of physical phones.
- The in-canvas UI cannot be navigated with the browser's own focus ring. All actions are keyboard
  reachable through the game's own focus handling.
