# MUCK LIFE: game design

_It's a dirty job. Somebody's gotta oxygenate it._

**Genre:** arcade reaction / light strategy / scientific observation. **Length:** ~9 min campaign at
standard timers, plus endless O₂ RUSH. **Platforms:** desktop and mobile browsers (landscape, 1280×720
scaled to fit).

## Pillars

1. **The roots decide.** Every target is an oxygen pool produced by simulated tissue. Learn how roots
   grow, and you can predict where the next target will be.
2. **Observe → Predict → Capture → Score.** Readable within ~20 seconds: glowing pool, tap, ring, points.
3. **Honest imaging.** You document optode readings. You never "collect oxygen". Colours are an imaging
   scale, and artefacts exist and read ~0%.
4. **The twist is the science.** Growth, not sunlight, drives the signal. You feel it at sunset in Night
   Shift before the ending explains it.

## Core loop

The sediment is imaged by a virtual planar optode. Roots and rhizomes grow (`plant.ts`), tissue releases
oxygen by age (`oxygen.ts`), and pools above the imaging threshold become regions (`regions.ts`). The
player moves a reticle (pointer, arrows/WASD, or stick) that always shows the optode reading (% sat.).
Tapping a region documents it: shutter brackets, ring pulses, a flag marker, floating points with the
reading, and a rising capture tone that climbs with the combo. Documented regions show a ✓ until they
move, change, or enter a new measurement day.

**Wrong clicks are harmless but cost the combo:** empty mud ("No oxygen signal: 0.4%"), artefacts
(named, reading ~0%), and repeats ("Already in the record"). Repeats never cost accuracy.

## Tools

| Tool        | Keys            | Effect                                                                          |
| ----------- | --------------- | ------------------------------------------------------------------------------- |
| View        | V / 1           | Roots + oxygen → oxygen imaging only → natural sediment                         |
| Optode Scan | Q / F           | 1.8 s highlight of signals worth documenting; 10 s cooldown                     |
| Threshold   | T / G           | 8 / 12 / 18% imaging threshold: fewer, stronger targets, ×1 / 1.15 / 1.3 points |
| Time-Lapse  | L / K           | Replays the last 48 sim h of images (clock paused)                              |
| ROI window  | O / I, then tap | Records the reading at a spot hourly; +150 when it captures a ≥ 10-point change |
| Chemistry   | C / X           | Conceptual overlay: ◎ oxygenated microsite vs ■ oxygen-free mud                 |
| Next signal | Tab / N         | Keyboard snap to the next signal (real or artefact)                             |

## Campaign (`src/levels/campaign.ts`)

| #   | Level               | Time  | Teaches                                                 | Objectives                                     |
| --- | ------------------- | ----- | ------------------------------------------------------- | ---------------------------------------------- |
| 1   | Welcome to the Muck | 50 s  | Targeting, readout, artefacts, ✓ repeats                | 6 observations                                 |
| 2   | Root Rush           | 65 s  | Advancing tips, tracking                                | 10 obs, 3 tracked                              |
| 3   | Branching Out       | 70 s  | Lateral clusters, persistence, Scan                     | 10 obs, 4 lateral, ×4 streak                   |
| 4   | The Underground     | 75 s  | Rhizome apex, expanding optode window, delayed roots    | 9 obs, 2 apex, 2 fresh                         |
| 5   | Night Shift         | 75 s  | Day–night, persistence at night (the twist), Time-Lapse | 10 obs, 4 at night                             |
| 6   | Muck Chemistry      | 90 s  | Sediment demand, ROI, chemistry overlay, threshold      | 10 obs, 2 ROI changes                          |
| 7   | The Big Bloom       | 120 s | Everything; two plants                                  | 12,000 pts, 16 obs, 2 lateral, 1 apex, 3 night |

Results always offer **Next**, even when objectives are missed. The science is never locked behind a
score. Level 7 leads into the discovery ending.

**Night Shift twist:** at 19:00 the sky darkens and the music drops to a hush ("Lights out. No sunlight.
No photosynthesis."). Pools stay lit. 2.5 s later: _"It's nighttime. So why is there still oxygen down
here?"_ Then the music returns.

## O₂ RUSH (`src/levels/rush.ts`)

Seeded, endless growth. A director adds roots and rhizomes. Difficulty (`rushDifficulty`) raises the
_amount_ of biology over 150 s (3→12 growing roots, emergence every 12→4 sim h, laterals sooner,
artefacts 0.12→0.67/s, 1→4 rhizomes), never the growth speed.

- **Classic Rush:** 90 s.
- **Endless Muck:** untimed, ends at 6 data gaps (a pool that fades undocumented; 10 on Gentle).
- **Zen Optode:** untimed, no artefacts, no penalties. Finish from the pause menu.
- **Time-Lapse Challenge:** 5 rounds. Watch, place 3 prediction markers, fast-forward 24 sim h, and
  score by distance to new pools (`scorePredictions`).

Records per mode (local only): best score, accuracy, longest combo, most observations, documentation
efficiency (observations ÷ clicks). Seeds can be typed in to share a challenge. No purchases, loot, or
daily-login hooks.

## Flow

Splash (-80) → Opening (first run; skippable: marsh → camera sinks → first glowing pool → narration) →
Level 1 intro. Afterwards: Title (live growing roots behind the menu) → Campaign / Level Select / O₂ RUSH
/ Explore the Science / Meet the Scientists / Settings / More (Records, Ending, Opening, Credits).

## Ending (`EndingScene`)

Twelve player-paced panels (~60–120 s): opener → 7 discoveries with illustrations and basis tags →
measured vs simulated bar chart (growth 25–35% vs diel c. 3–5%) → rhizobox & optode explainer → people &
citations → "The game ends here. The discovery doesn't. / A Minus 80 Studios production. / Play the
discovery."

## Architecture

Pure systems in `src/systems/` (plant, oxygen, regions, scoring, distractors, timelapse, roi, session,
experiments, daynight, settings) are fully testable without Phaser. `Session` is the whole game minus
rendering. Scenes only draw it and route input. Content (`src/content/science.ts`) is separate from code.
Tuning lives in `src/config/tuning.ts`. Project Yeti events are in `src/integration/yeti.ts` (see
`RESEARCH_HOOKS.md`).
