# Changelog

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
