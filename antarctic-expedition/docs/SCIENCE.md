# ANTARCTIC EXPEDITION — Science notes

The single source of truth for every specific finding, number, or citation used in this game is
`src/content/science.ts`. This document explains the status of each claim and what is deliberately
fictional or simplified for play. See `docs/REFERENCES.md` for full citations and `docs/SCIENCE_TO_GAMEPLAY.md`
for how each finding maps to a mechanic.

## Verified findings used directly in the game

- **Leopard seal courtship and calls** (Kienle, Bonin, Gomez, Goebel, Donke, Sperou, Guerrero-Vega,
  Borras-Chavez, 2024, _Polar Biology_): the first paired description of leopard seal sexual behavior and
  calls in the wild. A courting pair interacted for about two hours at Laguna San Rafael, Chile, with
  calls continuing roughly eight more hours; 65 underwater calls (male), 7 in-air calls (female: thump
  pulse, noseblast, blast, growl). **Copulation itself was never directly observed** — only a male later
  found with a swollen genital opening and a fresh laceration, consistent with an attempted mating. The
  game's Mystery 1 is built so that "possible, but insufficient evidence" is the only correct
  interpretation, matching the real paper's own epistemic status.
- **A novel Antarctic viral seascape** (Piedade, Schon, Lood, Fofanov, Wesdorp, Biggs, Wu, Bolhuis,
  Fischer, Yutin, Dutilh, Brussaard, 2024, _Nature Communications_): a full Antarctic season (Nov–Apr)
  sampled at a Rothera time-series site found that roughly 75% of viral diversity was previously
  uncharacterized. Notable groups: phages, giant viruses (Nucleocytoviricota, likely regulating
  phytoplankton dynamics), Polinton-like viruses, virophages, crAssphage-like viruses.
- **Epifluorescence enumeration of viruses and prokaryotes** (Patel, Noble, Steele, Schwalbach, Hewson,
  Fuhrman, 2007, _Nature Protocols_): staining with a DNA-binding dye (SYBR Green I) and counting under
  epifluorescence microscopy is a long-established way to enumerate virus- and bacteria-sized particles
  from a water sample. The game cites this paper for the counting method itself. The broader
  counting-tells-you-how-many / electron-microscopy-resolves-structure distinction reflects the wider
  field, not a verbatim claim from this specific paper, and is presented that way in the Discovery
  Journal and the "counting vs. structure" mystery.
- **Icefish lack hemoglobin**: Channichthyidae lost their hemoglobin genes entirely through a large
  deletional event, surviving on oxygen dissolved in blood plasma, aided by an oversized heart and the
  cold, oxygen-rich water they live in. Well documented across multiple sources (reviews in the _Journal
  of Experimental Biology_, genome papers, and general science press); not a single-paper claim.
- **Dr. Sarah S. Kienle's real, citable affiliation**: Assistant Professor, Natural Resources Science,
  University of Rhode Island; PI, Comparative Ecophysiology of Animals Lab (sarahskienle.com); PhD UC
  Santa Cruz; NSF CAREER Award (2025) for Southern Ocean predator research. No quote, interview answer, or
  biography has been invented for her or any of her seven co-authors, or any author of the virus or
  SYBR Green papers — see `docs/SCIENTIST_PROFILES.md`.

## General natural history (not tied to a specific paper)

Weddell seal diving physiology, Adelie penguin colony biology, Antarctic krill swarming, and diatom
spring-bloom timing are presented as well-established natural history for these taxa, without citing a
specific study. If a future pass wants to cite a specific finding for any of these, it should be added to
`science.ts` with a real DOI first.

## Deliberate gameplay simplifications

- **DIVE** scores photographs with a fixed formula (framing distance, a documented-behavior bonus, a
  novelty bonus, halved if the animal is fleeing). This is a gameplay-balancing design, not a measured
  photo-quality metric.
- **ONE DROP / RECONSTRUCT** particle radius, speed, and point values in `content/organisms.ts` are
  fictional gameplay-balance numbers, explicitly not scientific claims about real specimen size or
  abundance.
- **RECONSTRUCT**'s revealed shape (an icosahedron) is explicitly labeled illustrative. A real cryo-EM
  reconstruction averages thousands of particle images; this game simplifies picking into a single
  tap-or-flag decision per particle.
- **Scientific Mysteries** ask for a calibrated interpretation ("supported" / "possible, but insufficient
  evidence" / "not supported"), not a pass/fail quiz. Mystery 1 (leopard seal) is specifically designed so
  that confident "confirmed mating" is always the wrong call, by design, matching the real paper.

## What this document does not yet cover

Krill, Weddell seal, and penguin natural history, and any future addition of a specific citation for
them, should be verified with the same rigor as the findings above before being added here.
