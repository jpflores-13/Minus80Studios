# Scientific mysteries — design notes

Six mysteries live in `src/content/mysteries.ts`, each unlocked by specific Discovery Journal evidence
and resolved by a calibrated interpretation — "supported," "possible, but insufficient evidence," or
"not supported" — rather than a single right/wrong quiz answer. `src/systems/mysteries.ts` holds the
pure unlock/interpret logic, tested in `tests/mysteries.test.ts`.

## The design rule

A mystery's `correctInterpretation` must match the real evidentiary status of its underlying finding, not
just "what sounds right in a game." Confident claims only get `supported` when the cited source actually
establishes that; a single observation or indirect evidence gets `insufficient`; a claim that
overstates or misreads the evidence gets `notSupported`.

## Mystery 1 — the one with a hard constraint

**"Do leopard seals mate the way this pair behaved?"** must resolve to `insufficient`, by design, and may
never change to `supported`. The real paper (Kienle et al., 2024) documented courtship behavior and
calling in detail but never directly observed copulation — only indirect evidence (an injury) afterward.
A fictional "confirmed mating observed" ending would misrepresent the actual study's epistemic status.
This constraint is enforced by a dedicated test: `tests/mysteries.test.ts`'s "the leopard seal mystery
stays honestly unresolved" case fails if `correctInterpretation` is ever changed away from
`'insufficient'`.

## The other five mysteries

- **Novel viral seascape** → `supported` (a full-season, repeated time series is strong evidence).
- **Icefish lack hemoglobin** → `supported` (well-documented genetic deletion, multiple sources).
- **Krill swarm defense/feeding** → `supported` (standard, well-established natural-history account).
- **Diatom bloom timing** → `supported` (light return after polar winter is the standard trigger).
- **Counting vs. resolving structure** → `notSupported` for the claim "counting alone tells you what a
  particle is" (counting and electron-microscopy structure resolution are genuinely separate techniques).

## Why not just reward "correct"

Each interpretation — right or wrong — gets its own explanation text (`Mystery.explanation`), because the
goal is calibration, not point-scoring. Choosing wrong is informative, not penalized beyond the honest
"here's why that's not quite right" response; `interpret()` reports `calibrated: boolean`, never a score.
