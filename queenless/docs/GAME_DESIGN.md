# Game Design — Queenless

## Pitch

You are one worker in a bumble bee colony. There's no queen managing anyone, no player-assigned jobs — every
nestmate decides for itself what needs doing, same as you. Keep the colony fed, the brood tended, and the nest
clean, and watch what happens to a quiet, previously unremarkable worker once the queen is gone.

## Target experience

- **Length:** 7–10 minutes for the 6-level campaign; Queenless Mode is endless.
- **Feel:** a small systems toy you watch as much as you play. The fun is in noticing what your nestmates are
  already doing and giving them a nudge, not in controlling them.
- **Audience:** general players, including museum and classroom visitors. No prior biology knowledge needed.
- **Platforms:** desktop browser first (keyboard + gamepad), fully playable on touch (iPhone, iPad, Android).

## Core loop

1. **Move and work:** walk your own worker onto a flower, brood cell, or debris pile and do that job directly.
2. **Watch:** your five to twelve nestmates are choosing their own tasks every ~1.4 seconds, from their own
   foraging/brood-care/maintenance tendencies, local need, and distance — never a role you assigned them.
3. **Buzz Pulse (from Level 2):** ring a pulse to temporarily raise nearby workers' attention to local need. It
   never tells anyone what to do; it just makes them notice faster.
4. **Survive a disturbance:** some foragers vanish, flowers thin out, or the queen herself disappears. The colony
   has to reorganize without you reassigning anyone.

## The six-level campaign

| #   | Name               | Teaches                                                                               | Buzz Pulse | Duration |
| --- | ------------------ | ------------------------------------------------------------------------------------- | :--------: | -------: |
| 1   | The Daily Buzz     | Move, forage, deliver — the whole job, solo                                           |     No     |      45s |
| 2   | Busy Bees          | Autonomous nestmates with their own tendencies; Buzz Pulse                            |    Yes     |      60s |
| 3   | Missing in Action  | Losing foragers mid-run; does the colony redistribute on its own?                     |    Yes     |      70s |
| 4   | The Empty Throne   | The queen disappears partway through, unprompted; watch Queenie                       |    Yes     |      80s |
| 5   | A Society in Chaos | Queenless from the start, plus a resource shortage; reproductive competition appears  |    Yes     |      90s |
| 6   | Stronger Together  | Everything at once, for the longest stretch; no single worker (or player) holds it up |    Yes     |     100s |

Stars are earned from `averageHealth` (food/brood/nest cleanliness, averaged over the whole run) against each
level's `stars: [one, two, three]` thresholds in `src/levels/*.ts`.

## Queenless Mode

Endless survival, queenless from the start, randomized but seed-reproducible (`src/systems/queenlessMode.ts`).
Disturbances (resource shortages, lost foragers) arrive on a ramping schedule that tightens from every 45s down to
every 14s over the first 3 minutes. The colony collapses — ending the run — if its health stays below 15 for 8
straight seconds. Score is survival time plus average health; both the score and the raw seconds survived are
saved as a personal best.

## The cast

Six named characters, each a different weighted mix of the same three tendencies (`src/content/characters.ts`);
none of them is a fixed "role" in the simulation itself, they just start with different numbers:

| Character | Leans toward             | What's different about her                                                        |
| --------- | ------------------------ | --------------------------------------------------------------------------------- |
| Buzzby    | Balanced                 | The one you play                                                                  |
| Pollen    | Brood care               | Gentle, stays close to the cells                                                  |
| Dash      | Foraging                 | Energetic, covers the most ground                                                 |
| Bumble    | Nest maintenance         | Relaxed, dependable                                                               |
| Stinger   | Nest maintenance, social | Territorial, more interactions with nestmates                                     |
| Queenie   | Nothing visible          | Highest `latentPotential` of anyone — inert while the queen is present, see below |

Levels also fill out the colony with 5–10 generic workers (`makeGenericWorker`), each randomized but following the
same shape: about 1 in 7 gets meaningfully high `latentPotential`, matching Queenie's design principle without
making her the _only_ worker it can happen to.

## Buzz Pulse: the one player tool

Buzz Pulse is the game's single ability and its central design constraint: **it is not a command.** It raises
nearby workers' `responsiveness` to whatever's actually needed around them for a few seconds — it cannot force a
worker into a task they wouldn't otherwise consider, and it never creates or assigns a role. This is a deliberate
gameplay abstraction (see `docs/SCIENCE.md`), not a claim that real bumble bees have anything like it.

## Queenie, and what "queen loss" does

While `queenPresent === true`, every worker's `latentPotential` sits inert — it affects nothing. The moment the
queen is gone, it starts driving two things: `reproductiveActivation` (rising faster for high-potential workers)
and a boost to `socialActivity`. Workers with nothing remarkable about them while the queen is present can become
unusually central to the colony once she's gone — that's Queenie's whole design, and it's drawn directly from a
real finding (see `docs/SCIENCE.md`), not an invented twist.

Queen loss also adds a small amount of extra randomness (`TUNING.postQueenLossVariance`) to every worker's task
utility, only while queenless — previously-constrained behavioral variation becoming visible, not the colony
getting worse at its job on purpose.

## Controls

| Action     | Keyboard      | Gamepad    | Touch                  |
| ---------- | ------------- | ---------- | ---------------------- |
| Move       | Arrows / WASD | Left stick | Drag                   |
| Buzz Pulse | Space / E     | A / B      | On-screen pulse button |
| Pause      | Esc / P       | Start      | Pause button           |
| Restart    | R             | —          | —                      |

## What we simplified

See `docs/SCIENCE.md`'s "What this game does not claim" section — the short version: Buzz Pulse is fictional, every
numeric trait and threshold is a balancing value rather than a measurement, and the queen is never modelled as a
manager whose absence "frees" workers to act — the research shows certain variation is present but not expressed
the same way while she's there.
