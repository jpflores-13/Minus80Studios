# Research hooks

Ways researchers could extend MUCK LIFE, and how the game plugs into the future Minus 80 platform.

## For researchers

- **Approve a profile.** Real bios, photos, or statements replace `PROFILE_PENDING` in
  `src/content/science.ts` (see `SCIENTIST_PROFILES.md`).
- **Review the model.** `SCIENTIFIC_REVIEW.md` lists every claim and three open questions about the
  simplifications.
- **Seasonal timing.** The paper's conclusion points to seasonal root and rhizome growth. A future level
  could compress a growing season (spring pulses → late-summer rhizome growth) once a researcher
  suggests defensible timing.
- **Field vs lab.** A "field optode" variant with variable water level or salinity could explore how
  results might differ in the field. It would need to be framed as hypothetical.
- **Real data.** The paper's data are archived (Environmental Data Initiative, per its data-availability
  statement). A mode replaying real ROI time series as a chart, never as fake imagery, would need its
  own reuse check.

## Project Yeti integration (future platform)

MUCK LIFE stays fully playable on its own. It only **emits events**. It holds no currency, calculates no
rewards, and has no backend.

`src/integration/yeti.ts` dispatches a `CustomEvent('minus80:game-event')` on `window`, and when embedded
in an iframe it also calls `window.parent.postMessage(envelope, '*')`. The payload is non-sensitive
gameplay facts only.

```ts
interface YetiEnvelope {
  gameId: 'muck-life';
  version: 1;
  at: string; // ISO timestamp
  event:
    | {
        type: 'level_complete';
        levelId: string;
        score: number;
        accuracy: number;
        objectivesMet: boolean;
      }
    | { type: 'mode_complete'; mode: string; score: number; accuracy: number; observations: number }
    | { type: 'discovery_unlocked'; discoveryId: 'stein-cardon-2026' }
    | { type: 'campaign_complete' };
}
```

**The host decides rewards.** Events never include Cryovial amounts. Client-reported scores are
untrusted. The host should cap or verify them (for example, against a level's known maximum) before
awarding anything. Achievements could map to: finishing each level, `campaign_complete`, and the
`discovery_unlocked` collectible.
