# Roadmap — Queenless

## ✅ v0.1: Full game (2026-11-22)

Pure, unit-tested colony simulation (`src/systems/colony.ts`, 12 passing tests) → Buzz Pulse and the full
six-level campaign → Queenless Mode (endless) → the complete scene graph (Boot → Splash → Intro → Title →
Level Select / Settings / Level → Hud / Pause → Results → Ending) → accessibility pass → documentation.

- [x] Agent-based task selection (utility-weighted, not role-based)
- [x] Queen-loss-gated latent traits (reproductive activation, social activity, decentralization)
- [x] Buzz Pulse, gated correctly per level (`buzzPulseEnabled`)
- [x] Six campaign levels with escalating disturbances
- [x] Queenless Mode with a ramping disturbance schedule and a collapse condition
- [x] Full scene graph, keyboard/gamepad/touch input, screen-reader announcements
- [x] Ending sequence with checked citations; placeholders for scientist bio and reviewer
- [x] CI workflow and site landing card

## v0.2: Review and polish

- [ ] Human read of both cited papers in full (`docs/SCIENCE.md`'s "What still needs human review")
- [ ] Written permission and a real bio for the "Meet the Scientist" ending page
- [ ] A scientific reviewer assigned for `docs/SCIENCE.md`
- [ ] First human playtest session logged in `docs/PLAYTESTING.md`
- [ ] A spatial/audio cue so a blind player can locate which site needs attention, not just that one does

## v0.3: Art pass

- [ ] Licensed or commissioned bee/flower/nest art replacing the code-drawn placeholders in `src/render/art.ts`,
      per `docs/ART_DIRECTION.md`, logged in `docs/ASSET_CREDITS.md`
- [ ] A short, non-interactive queen-loss cinematic beat for campaign Level 4 (currently a flash + announcement)

## v1.0: Launch

- [ ] Performance pass on low-end mobile (10+ workers, continuous pathing)
- [ ] Final accessibility review against the Game Accessibility Guidelines checklist
