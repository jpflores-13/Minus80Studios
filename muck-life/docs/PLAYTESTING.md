# Playtesting

## Automated balance (every `npm test`)

`tests/bot.ts` autoplays each level: every _N_ seconds it documents one observable region and places
ROIs near growing tips. At a 2.5 s reaction (a slow human), every level's objectives are met. Score
targets were set from bot runs at 1.4 s and 2.5 s, so an attentive player earns around 2 stars.

| Level | Bot 1.4 s score | Bot 2.5 s score | Target | Avg visible regions |
| ----- | --------------- | --------------- | ------ | ------------------- |
| 1     | ~3,300          | ~2,500          | 1,500  | 4                   |
| 2     | ~18,000         | ~8,700          | 6,000  | 10                  |
| 3     | ~22,000         | ~11,800         | 8,000  | 15                  |
| 4     | ~11,800         | ~6,100          | 4,500  | 6                   |
| 5     | ~12,300         | ~9,900          | 7,000  | 11                  |
| 6     | ~30,500         | ~16,300         | 10,000 | 19                  |
| 7     | ~40,500         | ~21,700         | 15,000 | 19                  |

## Browser smoke tests (developer, headless Chrome)

Driven over the DevTools protocol with no runtime errors: splash → opening → Level 1 intro → Levels 1,
3, 5, 6 autoplayed with screenshots. Verified: smooth heatmap, ✓ repeats, combo/streak HUD, lateral
clusters, scan button state, the night-shift sky and "Lights out" beat, pools persisting at night, the
ROI/chemistry overlays, and the landing-page card.

## Bugs found by testing

- **Rapid key presses over-advanced menus and the ending** (3 presses → 11 steps). Root cause: Phaser
  4.2.1 re-delivering the same KeyboardEvent objects. Fixed with `installKeyDedupe`. The other studio
  games use the same Phaser version and may be affected.
- **Pools saturated at 100%** where roots overlapped. Fixed by making release gradient-limited and the
  local terms semi-implicit (see `SCIENCE_TO_GAMEPLAY.md`).

## Not yet done (needs humans)

- [ ] First-time players: can they explain the goal within 30 s of Level 1?
- [ ] Does Night Shift's twist land? Ask after the level: "What surprised you?"
- [ ] After the ending, can players say that growth mattered more than day/night?
- [ ] Phones (iOS Safari, Android Chrome): frame rate with 20+ visible regions in Level 7 and Rush.
- [ ] Screen-reader pass (VoiceOver, NVDA).
- [ ] Is Level 6 too busy? It is the densest by visible regions.

## Questions to ask testers

1. What were you doing? (Listen for "documenting/measuring" vs "collecting oxygen".)
2. Where did you expect the next glowing spot to appear, and why?
3. Did the artefacts feel fair?
4. Would you play O₂ RUSH again? Which mode?
