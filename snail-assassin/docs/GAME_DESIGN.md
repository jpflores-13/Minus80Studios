# Game Design — Snail Assassin

> Living document. Proposed ideas are marked **(proposal)** until the team agrees to them.

## Current build (v0.3)

Splash → title menu → **Choose Your Assassin** → species tutorial (checklist on each character's first hunt) →
reef hunt (capture 3 fish in 3:00) → results → **Did You Know?** → replay, switch character, or read the research.

| Character                   | Q                                       | E                               | SPACE                                | Strategy                                       |
| --------------------------- | --------------------------------------- | ------------------------------- | ------------------------------------ | ---------------------------------------------- |
| CATALYST · _Conus catus_    | Lightning Strike (aimed, single target) | Motor Lock (on the struck fish) | Reel In                              | Precision ambush; long strikes need Motor Lock |
| ATLAS · _Conus geographus_  | Glucose Crash (cloud)                   | System Override (cloud)         | Engulf (2 at once)                   | Metabolic area control; the combo is required  |
| NIGHTSHADE · _Conus tulipa_ | Ghost Signal (escape-dampening cloud)   | Silent Tide (cloud)             | Phantom Net (unaware, weakened fish) | Stealthy close approach; both clouds required  |

## Hazards

An octopus patrols the reef and chases the snail when it sees it move; holding still hides you. A grab stuns the
snail and costs venom but never ends the hunt. The reef wraps around at every edge.

## Escalation level: Cipher, the playable octopus

Selectable from the same Choose Your Assassin screen, after the three snails. The player becomes the predator
that threatened them all campaign: CIPHER, _Octopus bimaculoides_, hunting cone snails scattered individually
across the reef (cone snails are solitary foragers, not schooling animals, so they're placed one at a time rather
than in the three-snail campaign's fish schools) with Pounce (ambush strike), Paralytic Bite (immobilizes the
catch), and Draw to Mouth (reels it in), the same strike/lock/reel kit Catalyst uses, reflavoured around real
octopus prey-capture research (see docs/SCIENCE.md). A blue shark (_Prionace glauca_) now hunts the player,
reusing the octopus-threat's patrol/chase/grab/retreat state machine with its own tuning: faster, and far less
forgiving of holding still, since its real basis is electroreception rather than vision. The "Did you know?"
ending gets an extra step revealing the blue shark's own science, and the results screen surfaces a fact about
both animals.

## Pitch

You are a cone snail: slow, patient, and armed with one of nature's most sophisticated venoms.
Creep across the reef, stay unseen, and strike at exactly the right moment.

## Target experience

- **Length:** 7–10 minutes for a full playthrough.
- **Feel:** tense, quiet, deliberate. The fun comes from waiting and timing, not speed.
- **Audience:** general players, including museum and arcade visitors. No prior science knowledge needed.
- **Platforms:** desktop browser first, then iPad/touch and arcade cabinet.

## Core loop (proposal)

1. **Sense:** detect prey nearby (the snail's siphon "smells" the water).
2. **Approach:** move slowly and stay out of the prey's awareness.
3. **Strike:** a short timing/aim action using the venom harpoon.
4. **Consume and progress:** move on to harder prey or areas.

## Mechanics to explore (proposal; every science link must be validated in SCIENCE.md)

| Idea                        | Possible gameplay form               | Science status |
| --------------------------- | ------------------------------------ | -------------- |
| Slow movement vs. fast prey | Stealth and timing over chasing      | To validate    |
| Chemical sensing via siphon | A "scent" trail or radar             | To validate    |
| Venom harpoon strike        | One-shot, high-stakes aim and timing | To validate    |
| Different venom cocktails   | Choose a toxin type per prey         | To validate    |

## Controls

| Action        | Keyboard      | Pointer / touch                              |
| ------------- | ------------- | -------------------------------------------- |
| Move          | Arrows / WASD | Hold and the snail crawls toward your finger |
| Start         | Space / Enter | Tap                                          |
| Back to title | Esc           | (TBD on-screen button)                       |

## Structure (proposal)

Intro (~1 min) → 3 short hunting areas (~2 min each) → finale (~1–2 min) → science epilogue linking to the researchers.

## Open questions

- How is stealth shown visually (light, sound, awareness meters)?
- Is failing a strike punishing or just a setback?
- How do we credit and feature the scientists in-game without breaking the mood?
