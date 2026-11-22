# Instrument database

The six instruments tied to the six biological scales in `src/content/organisms.ts`'s `SCALES`.

| Scale                  | Instrument                         | What it really does                                                                                                                                       | What it does in-game                                                                |
| ---------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| The Visible World      | Underwater camera                  | Captures images of macroscopic wildlife directly                                                                                                          | DIVE's photography mechanic: framing distance, documented behavior, novelty scoring |
| A Drop of Ocean        | Stereomicroscope                   | Low magnification, shows whole small organisms (copepods, krill larvae) in 3D                                                                             | ONE DROP's `drop` scale                                                             |
| The Hidden Ecosystem   | Compound light microscope          | Higher magnification, resolves single-celled organisms like diatoms                                                                                       | ONE DROP's `hidden` scale                                                           |
| The Microbial World    | Fluorescence microscope            | A fluorescent stain (e.g., SYBR Green I) makes otherwise-invisible bacteria and viruses visible and countable, without resolving their shape              | ONE DROP's `microbial` scale; backs the "counting vs. structure" mystery            |
| The Viral Frontier     | Fluorescence + electron microscope | Fluorescence counts; electron microscopy resolves actual viral particle shape                                                                             | ONE DROP's `viral` scale                                                            |
| The Molecular Frontier | Cryo-electron microscope           | Flash-freezes a sample so water forms glass instead of ice crystals, preserving molecular shape; many 2D particle images are averaged into a 3D structure | RECONSTRUCT's particle-picking mechanic and its explicitly-illustrative reveal      |

See `docs/SCIENCE.md` for the citations behind the fluorescence/SYBR Green and cryo-EM facts, and
`docs/ARTIST_BRIEF.md` for the planned instrument iconography (none exists yet — instruments are named in
HUD text only).
