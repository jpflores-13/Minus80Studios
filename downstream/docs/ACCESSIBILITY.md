# Accessibility — Downstream!

Options live in **Settings & Accessibility** on the title screen. We follow the
[Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/) and plan to playtest with disabled players
(for example through AbleGamers' Player Panels).

## What's supported

| Need                           | How                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Time pressure                  | **Relaxed mode**: the water runs at half speed, and the game pauses itself when rain starts. The ending doesn't advance on its own. Pause any time.                                                                                                                                                                                         |
| Low vision                     | **Large text** (+25%). Dark outlines on all litter and GPS bottles; a white edge under GPS trails. Text meets WCAG 4.5:1.                                                                                                                                                                                                                   |
| Keyboard only / screen readers | Fully playable by keyboard: **Tab or arrow keys** move between places and equipment spots (each one is read aloud with a plain description and a visible ring), **Enter** uses it, **Delete** takes equipment back, number keys pick tools, P pauses. Briefings, place info, messages, results, level select and the ending are read aloud. |
| Colour blindness               | Litter types differ by shape, full traps say FULL, stars are filled vs. outlined, booms show direction with moving dots and an arrow. Colours checked in `tests/colors.test.ts`.                                                                                                                                                            |
| Motion sensitivity             | Reduced effects (also follows the device's reduce-motion setting): water, rain and booms stop animating.                                                                                                                                                                                                                                    |
| Hearing                        | Every sound has an on-screen message. Mute and volume in Settings.                                                                                                                                                                                                                                                                          |
| Touch screens                  | Tap or drag to place; big tap areas; on-screen buttons for every keyboard shortcut; full screen on Android and tablets.                                                                                                                                                                                                                     |

## Known limits

- Watching the flow is visual. Screen reader players get messages for rain, full traps and results, but not a
  running description of every piece of litter.
