# Playtesting notes

Open questions and known rough edges to check with real players before calling any system finished.

## ONE DROP / RECONSTRUCT

- [ ] Is the spawn-rate ramp (`rampPerTenSeconds` in `levels/oneDropRounds.ts`) fun across a full round,
      or does it spike too hard near the end for the later, smaller-particle scales (viral, molecular)?
- [ ] Do players discover the `?` badge on their own, or does it need a clearer first-round tutorial
      beat beyond the on-screen hint text?
- [ ] Is tapping the badge precisely enough separated from tapping the particle body on touch devices?

## DIVE

- [ ] Is the fast-approach disturbance threshold (`approachSpeed > diverSpeed * 0.5` in
      `systems/dive.ts`) intuitive, or does it feel arbitrary without more feedback before the animal
      actually flees?
- [ ] Is 60 seconds per expedition enough time to find the sample site and get a few good photos,
      especially in the campaign's earlier, slower-paced expeditions?

## Campaign pacing

- [ ] Does the full seven-expedition campaign land close to the intended ~9 minutes in an actual
      playthrough, or does narrative-intro reading time push it longer?
- [ ] Is "RETRY EXPEDITION" vs. "CONTINUE EXPEDITION" (on loss vs. win) clear from the results screen
      alone, without reading this doc?

## Scientific Mysteries

- [ ] Is "possible, but insufficient evidence" readable as a genuinely correct answer, or do players
      read it as a hedge / a way to avoid being wrong?
- [ ] Does Mystery 1's explanation text land as "the real science is honestly uncertain" rather than
      "the game is being coy"?

## Endless Expedition

- [ ] Does the difficulty ramp across laps (`endlessRoundFor`) stay fun past the third or fourth lap, or
      does it spike too fast?

## Accessibility

- [ ] Walk through a full campaign expedition keyboard-only (no mouse/touch) and confirm nothing is
      stuck or unreachable.
- [ ] Confirm `relaxedMicroscopy` actually makes rounds feel calmer rather than just "the same, slower."
