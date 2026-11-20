# Studio Roadmap

## Phase 0: Foundation ✅

- [x] Workspace, shared tooling and CI
- [x] Studio vision, playbook, catalog
- [x] Public monorepo on GitHub (`jpflores-13/Minus80Studios`)
- [ ] GitHub Project "Minus 80 Studios — Development" (couldn't confirm either way while updating this doc;
      left unchecked rather than guessed)

## Phase 1: First playable demos ✅

- [x] Snail Assassin: vertical slice with character select and a "Did You Know?" ending
- [x] Downstream!: full level campaign
- [x] OFF TARGET., DR. ANTI-CRISPR., STARSTRUCK. and HEIST. added to the roster, each with its own
      "Did You Know?" science reveal (checked citations; researcher credit still pending written approval)

## Phase 2: Public demos ✅

- [x] Hosting: public monorepo, GitHub Pages (one workflow per game, a shared Pages build for all six)
- [x] Studio landing page (`site/index.html`) linking every game, with a way back to it from each title screen
- [x] Branding v1 in practice: the "-80" wordmark and a working colour palette in every game (see each game's
      `src/config/gameConfig.ts`). The dedicated `branding/` asset folders (logos, typography, palettes)
      are still empty placeholders; nothing has been exported there yet.

## Phase 3: Finishing the current roster

- [ ] STARSTRUCK.: WORMAGEDDON endless mode, an achievements system, a character-select screen (the six
      characters currently play as unlockable variants, not something you choose from a menu)
- [ ] HEIST.: Jobs 2 through 7 (the one-way security anchor mechanic for Job 2 is now built, but no job uses
      it yet), the remaining crew (FLASH, ANCHOR, PHANTOM, ARCHITECT) and a select screen for them, multiple
      simultaneous Folders, upgrades, achievements, The Perfect Crime challenge mode, and the optional
      Science Mode
- [ ] A dedicated accessibility pass (and `docs/ACCESSIBILITY.md`) for OFF TARGET., DR. ANTI-CRISPR.,
      STARSTRUCK. and HEIST., matching what Snail Assassin and Downstream! already have
- [ ] Scientist conversations and written sign-off, so the placeholder "Meet the Scientist" sections across
      all six games can carry real names, bios and credit

## Phase 4: Expansion

- [ ] Touch/iPad optimisation, arcade-cabinet build profile
- [ ] Extract shared studio code (ending sequence, accessibility, UI) into a package, if it's genuinely
      duplicated across games and stable
- [ ] Next game from the idea backlog
