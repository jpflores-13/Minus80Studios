# Game design

## Premise

You are a marine scientist aboard a research vessel in the Southern Ocean. Three systems carry the game:

- **DIVE** — underwater exploration and wildlife photography (`src/systems/dive.ts`).
- **ONE DROP** — fast arcade microscopy (`src/systems/oneDrop.ts`), the signature mechanic, playable
  standalone from the title screen.
- **Discovery Journal + Scientific Mysteries** — collection and evidence interpretation
  (`src/content/journal.ts`, `src/content/mysteries.ts`, `src/systems/mysteries.ts`).

## The four-category classification (ONE DROP's core idea)

Every particle in ONE DROP is one of: `target`, `nonTarget`, `artifact`, or `unknown` — never framed as
"good" or "bad." Capturing the wrong thing breaks your combo; marking a genuine `unknown` as unknown is
rewarded and never breaks your combo. The reverse mistake — marking a real target as unknown instead of
documenting it — is scored as neutral, not punished, because it is a real, defensible scientific call,
just a missed opportunity. This is the same engine behind RECONSTRUCT and Endless Expedition, configured
with a different specimen set each time (see `docs/EXPEDITION_ENGINE.md`).

## Six biological scales

`src/content/organisms.ts` defines, in order: The Visible World (camera), A Drop of Ocean
(stereomicroscope), The Hidden Ecosystem (compound light microscope), The Microbial World (fluorescence
microscope), The Viral Frontier (fluorescence + electron microscope), The Molecular Frontier
(cryo-electron microscope → RECONSTRUCT). Each scale has its own ONE DROP specimen set.

## DIVE → ONE DROP connection

Collecting the one water sample per DIVE expedition (`collectSample` in `systems/dive.ts`) carries a
target scale ID into the ONE DROP round that follows (`DiveResultsScene` → `OneDropScene`). A fast or
close approach to wildlife counts as disturbance and ruins the photo instead of just being ignored —
there is no way to "win" by rushing.

## Campaign

Seven expeditions (`src/content/campaign.ts`): Beneath the Ice, Songs in the Deep, The Living Ocean, One
Drop, Invisible Giants, Beyond the Lens, Into the Unknown — roughly nine minutes played straight through.
Each expedition is a narrative beat (`ExpeditionIntroScene`) followed by one DIVE, ONE DROP, or
RECONSTRUCT round carrying a `campaignIndex` that threads through pause, retry, and results so finishing
one offers "CONTINUE" into the next. The final expedition leads into `CampaignEndingScene`: a zoom through
every scale visited, Dr. Kienle's real credit, and a pointer into the Journal and Mysteries.

## Endless Expedition

`EndlessScene` cycles ONE DROP rounds through every scale in order, lap after lap
(`endlessRoundFor` in `levels/oneDropRounds.ts`), raising the objective and tightening the clock each
time the cycle repeats. Score carries across laps; one missed round ends the run and is compared against
the saved best.

## Discovery Journal and Scientific Mysteries

Documenting a species in DIVE or a specimen in ONE DROP/RECONSTRUCT unlocks its Journal entry
(`config/progress.ts`'s `discover()`), which carries its real citations, a researcher attribution where
one exists, stated limitations, and open questions. Six mysteries (`content/mysteries.ts`) each require
specific Journal entries to unlock, then ask for a calibrated interpretation rather than a quiz answer —
see `docs/SCIENTIFIC_MYSTERIES.md` for the design rationale, especially Mystery 1.
