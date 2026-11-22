# RIDGERUNNER — Science notes

The game is fiction inspired by research on the Cascade torrent salamander (_Rhyacotriton
cascadae_) and how landscapes shape where its populations can exchange genes. The ending
(`src/content/science.ts`, the "DID YOU KNOW?" reveal in `EndingScene.ts`) is where the real
science lives; gameplay numbers (moisture, movement speed, terrain drain rates) are fiction and
are never claimed otherwise.

## Status

- **Published and cited normally:**
  - AmphibiaWeb's species account for _R. cascadae_ (natural history: cold-headwater
    specialist, range, thermal tolerance).
  - Thurman, Cousins, Garcia, Olson & Penaluna (2025), _Journal of the American Water Resources
    Association_, "Mapping habitat suitability rangewide for headwater stream-associated torrent
    salamanders." DOI 10.1111/1752-1688.70045. Full text obtained and checked.
- **Forthcoming, NOT yet published — treated as such everywhere in this game:** Cousins, Olson,
  Millward, Adams, Pearl, Rowe & Garcia, "Genomics reveals extensive population structure and
  undescribed phylogenetic relationships in the Cascade torrent salamander (_Rhyacotriton
  cascadae_)," intended for the _Journal of Biogeography_. A DOI (10.1111/jbi.70167) resolves via
  Crossref and a USGS publication listing, but Christopher Cousins (whose research this is)
  confirmed directly that the paper has not actually come out yet; a resolving DOI before print is
  common (early/accepted-article registration) and is not the same as a finished, checkable
  publication. **Nothing in this game cites it as an already-public source you could go read
  today.**
- **The central game mechanic — gene flow mostly follows streams within a watershed, but can
  cross overland between nearby headwaters in different watersheds — is a research question this
  specific study was designed around, not a confirmed finding we verified against a finished
  manuscript.** We read the JBI abstract (via Crossref and the USGS listing) directly: it states
  that gene flow is "largely constrained within populations" and that major rivers act as partial
  phylogeographic boundaries, which is real and cited above, but it does not state the specific
  within-watershed-vs-overland-ridgeline mechanism the gameplay is built on. A similar-sounding
  claim about overland dispersal via forest cover between headwaters traces back to a different
  paper about different species (Emel et al. 2019, on _R. kezeri_ / _R. variegatus_), cited within
  the Thurman et al. 2025 paper, not a finding of the Cousins cascadae study. We do not merge the
  two. The game's central mechanic is presented in the ending explicitly as an open question
  motivating real research, not as something already shown to be true.
- A secondary, not-yet-independently-confirmed note: the Cousins paper is said to describe six
  genetically distinct populations, including one surprisingly divergent lineage. The ending
  presents this as a preview of forthcoming work, explicitly not a citable published result.

## What needs a human before this goes further

- **Confirm the Cousins et al. manuscript once it is actually published**: exact title, journal
  volume/page, and above all, whether it does or does not state the within-watershed/overland
  mechanism this game's core loop is built on. If it turns out not to, the ending's framing (an
  open research question, not a confirmed finding) already protects against that, but the
  six-populations preview and any other detail drawn from the preprint-stage abstract should be
  re-checked against the final text.
- **Never commit a biography, quote, photo, or interview answer for Christopher Cousins** (or any
  co-author on either paper) until he has given written permission. His name and institutional
  affiliation (PhD student, Oregon State University, Department of Fisheries, Wildlife, and
  Conservation Sciences, Garcia Lab; HHMI Gilliam Fellow) are fine to state; everything else in
  `science.ts`'s "Meet the Scientist" page stays a placeholder.

## What the reveal does not claim

- That Moss's moisture meter, movement speed, or any terrain number is a measurement of a real
  salamander's physiology. They are gameplay balance.
- That crossing between watersheds in-game is the same thing as gene flow. Gene flow requires
  successful reproduction after dispersal, not just arrival; the ending says this directly.
- That every road, clearing, or landscape change affects connectivity identically. Real landscape
  resistance depends on the specific species and site.

## Credits

Research inspiration: Christopher Cousins (Oregon State University, Garcia Lab; HHMI Gilliam
Fellow). Biography, photo and interview pending written approval, per studio policy.
