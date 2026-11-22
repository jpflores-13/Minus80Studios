# Accessibility — Queenless

Options live in **Settings & Accessibility** on the title screen. We follow the
[Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/).

## What's supported

| Need                                                   | How                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Low vision                                             | **Large text** (+25%, via `installTextScaling`). Readable storybook-serif headings and sans body text throughout.                                                                                                                                                                                                              |
| One hand, single switch, or limited fine motor control | Movement works from a single analog input (stick, drag, or arrow keys alone); Buzz Pulse has two independent key bindings (Space and E) plus gamepad A/B and a dedicated touch button, so no action requires a specific finger or hand.                                                                                        |
| Keys that don't suit you                               | Buzz Pulse, pause, and restart are all bound to at least two keys each (Space/E, Esc/P). Movement supports arrows, WASD, drag, and gamepad stick simultaneously.                                                                                                                                                               |
| Screen readers                                         | Every scene transition, level intro, disturbance, queen-loss moment, reorganization event, and the full ending sequence is read aloud through a hidden `aria-live` region (`src/ui/announce.ts`). The game canvas itself is marked `role="application"` with a descriptive `aria-label`.                                       |
| Colour blindness                                       | Site state (resource level, cleanliness) is shown through scale and opacity, not colour alone. Reproductive-activation is shown through a pulsing alpha, not a colour change. Disturbance and queen-loss moments are announced in text, not only shown as a screen flash.                                                      |
| Motion sensitivity                                     | **Reduced effects** (also follows the OS's reduce-motion setting via `prefersReducedMotion()`): disables camera shake on disturbances and the flash on queen loss.                                                                                                                                                             |
| Hearing                                                | Every sound effect pairs with an announced or on-screen text event (deliveries, brood care, disturbances, queen loss, reorganization). Mute and volume live in Settings.                                                                                                                                                       |
| Touch screens                                          | Drag-to-move, a dedicated on-screen Buzz Pulse button (hidden until Buzz Pulse unlocks on Level 2), and a touch-sized pause button. Full-screen support on devices that offer it.                                                                                                                                              |
| New or sighted players finding the game hard to read   | A corner minimap shows the whole nest at once, not just the zoomed camera's view. Every level's intro text (plus a first-level icon key) now also shows on screen, not only to the screen reader, and Buzz Pulse's result and the game's bigger moments show as a visible on-screen toast alongside the existing announcement. |

## Known limits

- Like the campaign's other autonomous systems, a blind player can be told _that_ the colony is struggling (via
  announced disturbance/queen-loss events and the HUD's spoken-equivalent state) but can't yet directly locate
  which site needs attention without sight. Spatial audio cues would be the natural next step.
- The HUD's resource bars (food, brood, nest) are visual-only; their values are not currently included in the
  periodic announcer text, only in one-off events. A periodic or on-demand "status" announcement would close
  this gap.
