# Changelog

## [Unreleased]

### Added

- A small minimap in the HUD's top-right corner, covering the whole playable area (most of
  which is off-screen at any one time behind the zoomed camera): every site, color-coded by
  what it needs, every nestmate as a dot, the player picked out, and the camera's own current
  view outlined on top.
- Every level's intro text now shows on screen too, in a short non-blocking corner panel, not
  just in the screen-reader-only announcement it always went to. Level 1's panel also includes
  a short flower/brood-cell/debris/honeypot key, since it's the first thing a new player sees
  before learning what any of those actually look like.
- Visible on-screen confirmation, not just a screen-reader announcement, for Buzz Pulse's
  result and the game's bigger moments (a disturbance, the queen leaving).

### Fixed

- The "DID YOU KNOW?" line on every results screen sat at a fixed position regardless of how
  many menu buttons ended up below the stats block, so it always overlapped one of them. The
  title screen's menu (7-8 rows once Full Screen is available) ran its last couple of rows off
  the bottom of the canvas entirely, past the point where they could be seen or clicked. A
  research page on the "Did You Know?" screen could, for a long enough page, overlap its own
  title or push its citation off the bottom of the screen. All three now size themselves off
  their actual content instead of a guessed constant.

- The player's own job never actually worked: walking onto a flower, brood cell, or debris pile
  did nothing, and nothing ever reached the honeypot, because `stepColony()` only ran the
  autonomous task logic for non-player workers and the player had no interaction code of its
  own at all — a critical gap, since the tutorial explicitly tells you to do exactly that.
  Standing on a site now gathers nectar, tends brood, or clears debris directly, and carrying
  nectar home now shows a small droplet over the player's own sprite so there's visible
  confirmation the action worked.

## 0.1.0 (first complete build)

- A pure, unit-tested agent-based colony simulation: workers choose their own task each decision tick from a
  weighted local utility (tendency × local need × attention − distance cost), never a scripted role or a
  player-assigned job.
- Queen-loss-gated latent traits: every worker's `latentPotential` is inert while the queen is present and only
  drives reproductive activation, elevated social activity, and network decentralization once she's gone.
- Buzz Pulse: a player-controlled radius that temporarily raises nearby workers' attention to local need, never
  assigning a task directly. Correctly disabled on Level 1, where the brief is just move/forage/deliver.
- Six campaign levels, escalating from a solo forage loop to a queenless colony under a resource shortage and
  reproductive competition, all at once, for the longest stretch yet.
- Queenless Mode: endless survival, queenless from the start, a ramping disturbance schedule, and a collapse
  condition if colony health stays critically low too long. Score and seconds survived both saved as bests.
- Six named characters (Buzzby, Pollen, Dash, Bumble, Stinger, Queenie), each a different weighted mix of the
  same three tendencies, plus randomized filler workers following the same shape.
- Full scene graph (Boot, Splash, Intro, Title, Level Select, Settings, Level, Hud, Pause, Results, Ending),
  keyboard/gamepad/touch controls, and screen-reader announcements throughout.
- A "DID YOU KNOW?" ending sequence with citations checked against Crossref (Crall 2018, Ruttenberg 2026),
  reachable from the title screen or any results screen.
