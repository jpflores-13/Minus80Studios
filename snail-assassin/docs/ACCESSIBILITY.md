# Accessibility — Snail Assassin

Options live in **Settings & Accessibility** on the title screen. We follow the
[Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/) and plan to playtest with disabled players
(for example through AbleGamers' Player Panels).

## What's supported

| Need                                                   | How                                                                                                                                                        |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Time pressure                                          | **Relaxed mode**: no hunt timer, the octopus never grabs, and the ending doesn't advance on its own.                                                       |
| Low vision                                             | **Large text** (+25%). Dark outlines on all sprites and on text over the reef. HUD text meets WCAG 4.5:1 against its outline.                              |
| One hand, single switch, or limited fine motor control | **Assist**: abilities aim themselves; capture (and Catalyst's Motor Lock) fire on their own. Touch has hold-to-crawl, so one finger can move.              |
| Keys that don't suit you                               | **Controls**: remap every action. Arrow keys always move.                                                                                                  |
| Screen readers                                         | Menus, character cards, hunt events, results and the whole ending are read aloud through a hidden live region. The ending's buttons work with number keys. |
| Colour blindness                                       | No information by colour alone (fish icons, cloud patterns, outlines). Colours checked in `tests/colors.test.ts`.                                          |
| Motion sensitivity                                     | Reduced effects (also follows the device's reduce-motion setting): no shake, wobble or drift.                                                              |
| Hearing                                                | Every important sound also shows a message. Mute and volume in Settings.                                                                                   |
| Touch screens                                          | Joystick, hold-to-crawl, tap-to-aim, big buttons; full screen on Android and tablets.                                                                      |

## Known limits

- The hunt itself is a real-time visual game. A screen reader announces what happens, but blind players can't
  locate fish on the reef yet. Audio cues for direction would be the next step.
- Character select shows a shorter card with large text (full details are read aloud and appear on the help card).
